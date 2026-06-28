import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const mockUsers = [
  { id: "1", name: "employer1", role: "employer" },
  { id: "2", name: "employer2", role: "employer" },
  { id: "3", name: "alice",     role: "candidate" },
  { id: "4", name: "bob",       role: "candidate" },
];

const mockPasswords: Record<string, string> = {
  employer1: "password123",
  employer2: "password123",
  alice:     "password123",
  bob:       "password123",
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string;
        const password = credentials?.password as string;

        if (!username || !password) return null;

        const user = mockUsers.find((u) => u.name === username);
        if (!user) return null;

        if (mockPasswords[username] !== password) return null;

        return { id: user.id, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // user only defined on first sign-in — copy role onto token
      if (user) {
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      // relay role from token to session so auth() callers can read it
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});