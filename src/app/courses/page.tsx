import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

const prisma = new PrismaClient()

export default async function CoursesPage() {
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login")
  }

  // Check if user's email is verified
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      enrollments: {
        include: {
          course: true,
        },
      },
    },
  })

  // Email not verified
  if (!user?.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-yellow-900 mb-2">
              Email Verification Required
            </h2>
            <p className="text-yellow-700 mb-4">
              You must verify your email address before purchasing a course. 
              Please check your email for the verification link.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Get active course
  const course = await prisma.course.findFirst({
    where: { isActive: true },
  })

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No courses available</p>
      </div>
    )
  }

  // Check if user already enrolled
  const isEnrolled = user.enrollments.some(
    (enrollment) => enrollment.courseId === course.id
  )

  if (isEnrolled) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Course Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {course.title}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-bold text-blue-600">
                ${course.price.toString()}
              </span>
              <span className="text-gray-500">One-time payment</span>
            </div>

            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>

            {/* Course Details */}
<div className="bg-gray-50 rounded-lg p-6 mb-8">
  <h3 className="font-semibold text-gray-900 mb-4">
    Course Includes:
  </h3>
  <ul className="space-y-3">
    <li className="flex items-start gap-3">
      <svg className="w-6 h-6 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-gray-700">
        Complete training materials ({course.duration} minutes)
      </span>
    </li>
    <li className="flex items-start gap-3">
      <svg className="w-6 h-6 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-gray-700">
        Comprehensive final exam
      </span>
    </li>
    <li className="flex items-start gap-3">
      <svg className="w-6 h-6 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-gray-700">
        {course.maxAttempts} quiz attempts
      </span>
    </li>
    <li className="flex items-start gap-3">
      <svg className="w-6 h-6 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-gray-700">
        Instant certificate upon passing ({course.passingScore}% required)
      </span>
    </li>
    <li className="flex items-start gap-3">
      <svg className="w-6 h-6 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-gray-700">
        Lifetime access to course materials
      </span>
    </li>
  </ul>
</div>

            {/* Promo Code Form */}
            <form action="/api/checkout" method="GET" className="space-y-4">
              <input type="hidden" name="courseId" value={course.id} />
              
              <div>
                <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Have a promo code?
                </label>
                <input
                  id="promoCode"
                  name="promoCode"
                  type="text"
                  placeholder="Enter code (e.g., LAUNCH50)"
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Purchase Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 font-bold text-lg transition-colors shadow-lg"
              >
                Proceed to Checkout
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure payment powered by Stripe</span>
            </div>
          </div>
        </div>

        {/* Money-Back Guarantee */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h3 className="font-semibold text-green-900 mb-2">
            30-Day Money-Back Guarantee
          </h3>
          <p className="text-green-700 text-sm">
            If you're not satisfied with the course, contact us within 30 days for a full refund.
          </p>
        </div>
      </div>
    </div>
  )
}