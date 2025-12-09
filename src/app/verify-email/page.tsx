import { PrismaClient } from "@prisma/client"
import { redirect } from "next/navigation"
import Link from "next/link"

const prisma = new PrismaClient()

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Invalid Link</h2>
            <p className="text-red-700">
              This verification link is invalid. Please check your email for the correct link.
            </p>
          </div>
          <div className="text-center">
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Verify the token
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  // Token not found or expired
  if (!verificationToken || verificationToken.expires < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Link Expired</h2>
            <p className="text-red-700 mb-4">
              This verification link has expired. Please register again or request a new verification email.
            </p>
            <Link
              href="/register"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Register Again
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Update user's email verification
  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  })

  // Delete the used token
  await prisma.verificationToken.delete({
    where: { token },
  })

  // Success - redirect to login
  redirect("/login?verified=true")
}