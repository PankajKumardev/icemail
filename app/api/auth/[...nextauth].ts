import NextAuth, { Account } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          access_type: 'offline',
          prompt: 'consent',
          scope: 'https://www.googleapis.com/auth/gmail.send',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      user,
      account,
    }: {
      token: any;
      user: any;
      account: Account | null;
    }) {
      if (account?.accessToken) {
        token.accessToken = account.accessToken;
      }
      if (account?.refreshToken) {
        token.refreshToken = account.refreshToken;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
  },
});
