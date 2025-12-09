import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { z } from "zod"
import crypto from "crypto"
import { sendVerificationEmail } from "@/lib/email"

const prisma = new PrismaClient()

// Validation schema for registration
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    }

    // Validate input
    const validatedData = registerSchema.parse(data)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.redirect(
        new URL("/register?error=User already exists", request.url)
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user in database
    await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        authProvider: "EMAIL",
        emailVerified: null, // Not verified yet
      },
    })

    // Create verification token in database
    await prisma.verificationToken.create({
      data: {
        identifier: validatedData.email.toLowerCase(),
        token: verificationToken,
        expires: tokenExpiry,
      },
    })

    // Send verification email
    const emailResult = await sendVerificationEmail(
      validatedData.email.toLowerCase(),
      verificationToken
    )

    if (!emailResult.success) {
      console.error("Failed to send verification email")
      // Still redirect to success - user is created
    }

    // Redirect to check email page
    return NextResponse.redirect(
      new URL("/check-email", request.url)
    )
  } catch (error) {
    // Validation error
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues[0].message
      return NextResponse.redirect(
        new URL(`/register?error=${encodeURIComponent(errorMessage)}`, request.url)
      )
    }

    // Generic error
    console.error("Registration error:", error)
    return NextResponse.redirect(
      new URL("/register?error=Something went wrong", request.url)
    )
  }
}