import GoogleProvider from 'next-auth/providers/google';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const NEXT_AUTH = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || '',
      clientSecret: process.env.GOOGLE_SECRET || '',
      async profile(profile) {
        const email = profile.email;
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
            },
          });
        }

        return {
          id: user.id.toString(),
          email: user.email,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    jwt: ({ token, user }: any) => {
      if (user) {
        token.userid = user.id;
      }
      return token;
    },
    session: ({ token, session }: any) => {
      if (session && session.user) {
        session.user.id = token.userid;
      }
      return session;
    },
  },
  //   pages: {
  //     signIn: '/signin',
  //   },
};
