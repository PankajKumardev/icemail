import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: Session & { accessToken?: string, user?: { id?: string } } = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { to, subject, content } = req.body;

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken || '' });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const rawEmail = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      content,
    ].join('\n');

    const encodedEmail = Buffer.from(rawEmail).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    // Save email to database
    await prisma.email.create({
      data: {
        subject,
        content,
        userId: session.user?.id || '',
      },
    });

    res.status(200).json({ message: 'Email sent and saved successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send email' });
  }
}