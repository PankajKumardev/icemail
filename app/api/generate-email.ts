import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { generateEmail } from '../../utils/gemini';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { name, company, jobRole, details } = req.body;
  const prompt = `Write a cold email for ${name} applying for the ${jobRole} role at ${company}. Include the following details: ${details}.`;

  try {
    const emailContent = await generateEmail(prompt);
    res.status(200).json({ emailContent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate email' });
  }
}
