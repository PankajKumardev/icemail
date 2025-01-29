import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req }) as (Session & { accessToken?: string; user?: { id?: string } }) | null;

  // Check if the user is authenticated
  if (!session || !session.accessToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { to, subject, content } = req.body;

  try {
    // Initialize OAuth2 client with the user's access token
    const oauth2Client: OAuth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: session.accessToken,
    });

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Construct the raw email
    const rawEmail = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      content,
    ].join('\n');

    // Encode the email in Base64 URL-safe format
    const encodedEmail = Buffer.from(rawEmail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Send the email using Gmail API
    const response = await gmail.users.messages.send({
      userId: 'me', // 'me' refers to the authenticated user
      requestBody: {
        raw: encodedEmail,
      },
    });

    // Save the email to the database
    await prisma.email.create({
      data: {
        subject,
        content,
        userId: Number(session.user?.id) || 0, //Ensure userId is valid
      },
    });

    // Return success response
    res
      .status(200)
      .json({ message: 'Email sent and saved successfully!', response });
  } catch (error) {
    console.error('Error sending email:', error);
    res
      .status(500)
      .json({ message: 'Failed to send email', error: (error as any).message });
  }
}
