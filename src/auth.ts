import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import type { Adapter } from "next-auth/adapters"

// Initialize Prisma Client
const prisma = new PrismaClient()

// Define the shape of our user for TypeScript
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      image: string | null  // Add this line
      role: "USER" | "ADMIN"
    }
  }

  interface User {
    role: "USER" | "ADMIN"
    image?: string | null  // Add this line
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Use Prisma adapter to store sessions and accounts in database
  adapter: PrismaAdapter(prisma) as Adapter,
  
  // Session strategy - we'll use JWT tokens
  session: {
    strategy: "jwt",
  },

  // Authentication providers
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Request email verification from Google
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // Apple Sign In
    Apple({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),

    // Email/Password authentication
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate input
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials)

        if (!parsedCredentials.success) {
          return null
        }

        const { email, password } = parsedCredentials.data

        // Find user in database
        const user = await prisma.user.findUnique({
          where: { email },
        })

        // User doesn't exist
        if (!user || !user.password) {
          return null
        }

        // Check if account is active
        if (!user.isActive || user.isSuspended) {
          return null
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password)

        if (!isValidPassword) {
          return null
        }

        // Return user object (without password)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],

  // Callback functions
  callbacks: {
    // Called when JWT is created or updated
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
      }

      // OAuth sign in - update user's email verification
      if (account?.provider === "google" || account?.provider === "apple") {
        await prisma.user.update({
          where: { id: token.id as string },
          data: { emailVerified: new Date() },
        })
      }

      return token
    },

    // Called whenever session is checked
    async session({ session, token }) {
  if (session.user) {
    session.user.id = token.id as string
    session.user.role = token.role as "USER" | "ADMIN"
    session.user.image = token.picture as string | null  // Add this line
  }
  return session
},
  },

  // Custom pages
  pages: {
    signIn: "/login",
    error: "/login", // Redirect errors to login page
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === "development",
})