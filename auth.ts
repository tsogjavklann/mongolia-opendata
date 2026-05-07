import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Auth.js v5 (NextAuth) — Google OAuth, JWT session.
 *
 * Production-д шаардлагатай env (Vercel Settings → Environment Variables):
 *   AUTH_SECRET         — `npx auth secret` эсвэл `openssl rand -base64 32`
 *   AUTH_GOOGLE_ID      — Google Cloud Console OAuth Client ID
 *   AUTH_GOOGLE_SECRET  — Google Cloud Console OAuth Client Secret
 *
 * Тохируулагдаагүй (env алгад) бол providers алга, login товч "Тохиргоо
 * хийгдээгүй" гэж заана. Anonymous-ыг дэмжсээр.
 */

const hasAuthEnv = Boolean(
  process.env.AUTH_SECRET &&
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET,
);

export const authIsConfigured = hasAuthEnv;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: hasAuthEnv
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID!,
          clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
      ]
    : [],
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: { signIn: '/login' },
});
