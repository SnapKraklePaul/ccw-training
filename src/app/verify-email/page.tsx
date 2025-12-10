import { PrismaClient } from "@prisma/client"
import { redirect } from "next/navigation"
import Link from "next/link"

const prisma = new PrismaClient()

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const token = params.token

  console.log("=== VERIFY EMAIL DEBUG ===")
  console.log("Token from URL:", token)

  // No token provided
  if (!token) {
    console.log("No token provided")
    return <InvalidLinkError />
  }

  let verificationResult: "success" | "expired" | "error" = "error"
  let errorMessage = ""

  try {
    // Verify the token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    console.log("Found token in database:", verificationToken ? "YES" : "NO")
    if (verificationToken) {
      console.log("Token identifier (email):", verificationToken.identifier)
      console.log("Token expires:", verificationToken.expires)
      console.log("Current time:", new Date())
      console.log("Is expired?", verificationToken.expires < new Date())
    }

    // Token not found or expired
    if (!verificationToken || verificationToken.expires < new Date()) {
      console.log("Token invalid or expired")
      verificationResult = "expired"
    } else {
      // Update user's email verification
      console.log("Updating user email verification for:", verificationToken.identifier)
      await prisma.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerified: new Date() },
      })
      console.log("User updated successfully")

      // Delete the used token
      console.log("Deleting used token")
      await prisma.verificationToken.delete({
        where: { token },
      })
      console.log("Token deleted successfully")

      verificationResult = "success"
    }
  } catch (error) {
    console.error("ERROR in verify-email:", error)
    verificationResult = "error"
    errorMessage = error instanceof Error ? error.message : "Unknown error"
  }

  // Success - redirect to login
  if (verificationResult === "success") {
    console.log("Redirecting to login with verified=true")
    redirect("/login?verified=true")
  }

  // Show error pages based on result
  if (verificationResult === "expired") {
    return <ExpiredLinkError />
  }

  return <GenericError message={errorMessage} />
}

// Error Components
function InvalidLinkError() {
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

function ExpiredLinkError() {
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

function GenericError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Verification Error</h2>
          <p className="text-red-700 mb-4">
            There was an error verifying your email. Please try again or contact support.
          </p>
          {message && (
            <p className="text-xs text-red-600 mb-4">Error: {message}</p>
          )}
          <Link
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}