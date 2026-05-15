import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';

/**
 * Auth.js v5 — Google + GitHub OAuth, JWT session.
 *
 * Production env (Vercel Settings → Environment Variables):
 *   AUTH_SECRET           — `npx auth secret`
 *   AUTH_GOOGLE_ID        — Google Cloud Console OAuth Client ID
 *   AUTH_GOOGLE_SECRET    — Google Cloud Console OAuth Client Secret
 *   AUTH_GITHUB_ID        — GitHub OAuth App Client ID (optional)
 *   AUTH_GITHUB_SECRET    — GitHub OAuth App Client Secret (optional)
 *
 * Аль ч provider env-гүй бол Anonymous mode-оор ажиллана.
 */

const hasSecret = Boolean(process.env.AUTH_SECRET);
const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
const hasGitHub = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

export const authIsConfigured = hasSecret && (hasGoogle || hasGitHub);
export const googleEnabled = hasSecret && hasGoogle;
export const githubEnabled = hasSecret && hasGitHub;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: any[] = [];

if (googleEnabled) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  );
}

if (githubEnabled) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: { signIn: '/login' },
});
