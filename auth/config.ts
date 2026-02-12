import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true";
const GOOGLE_ONE_TAP_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true";

export const authConfig = {
  secret: process.env.AUTH_SECRET,

  pages: {
    signIn: "/auth/signin",
  },

  session: {
    strategy: "jwt",
  },

  providers: [
    // Google One Tap Provider
    ...(GOOGLE_ONE_TAP_ENABLED
      ? [
          Credentials({
            id: "google-one-tap",
            name: "Google One Tap",
            credentials: {
              credential: { label: "Credential", type: "text" },
            },
            async authorize(credentials) {
              const token = credentials.credential as string;

              if (!token) {
                console.error("[Google One Tap] No credential provided");
                return null;
              }

              try {
                // Verify the Google ID token
                const response = await fetch(
                  `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`
                );

                if (!response.ok) {
                  console.error("[Google One Tap] Failed to verify token");
                  return null;
                }

                const payload = await response.json();

                if (!payload || !payload.email) {
                  console.error("[Google One Tap] Invalid token payload");
                  return null;
                }

                return {
                  id: payload.sub,
                  email: payload.email,
                  name: payload.name,
                  image: payload.picture,
                  emailVerified: payload.email_verified,
                };
              } catch (error) {
                console.error("[Google One Tap] Error verifying token:", error);
                return null;
              }
            },
          }),
        ]
      : []),

    // Standard Google OAuth Provider
    ...(GOOGLE_ENABLED && process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        // Store basic user info in token
        token.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
      return token;
    },

    async session({ session, token }) {
      // Add user info from token to session
      if (token.user) {
        session.user = token.user as any;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
