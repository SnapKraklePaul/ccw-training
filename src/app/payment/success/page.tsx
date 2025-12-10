import { PrismaClient } from "@prisma/client"
import { stripe } from "@/lib/stripe"
import { redirect } from "next/navigation"
import Link from "next/link"

const prisma = new PrismaClient()

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const params = await searchParams
  const sessionId = params.session_id

  if (!sessionId) {
    redirect("/courses")
  }

  try {
    // Retrieve the Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId)

    // Check if payment was successful
    if (stripeSession.payment_status !== "paid") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
          <div className="max-w-md w-full">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-bold text-red-900 mb-2">
                Payment Failed
              </h2>
              <p className="text-red-700 mb-4">
                Your payment was not successful. Please try again.
              </p>
              <Link
                href="/courses"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </Link>
            </div>
          </div>
        </div>
      )
    }

    // Get metadata from session
    const userId = stripeSession.metadata?.userId
    const courseId = stripeSession.metadata?.courseId
    const promoCodeId = stripeSession.metadata?.promoCodeId

    if (!userId || !courseId) {
      throw new Error("Missing metadata")
    }

    // Check if order already exists (prevent duplicate processing)
    const existingOrder = await prisma.order.findFirst({
      where: { stripeSessionId: sessionId },
    })

    if (!existingOrder) {
      // Get course details
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      })

      if (!course) {
        throw new Error("Course not found")
      }

      // Calculate amounts
      const subtotal = Number(course.price)
      const discount = (stripeSession.total_details?.amount_discount || 0) / 100
      const total = (stripeSession.amount_total || 0) / 100 // Convert from cents

      // Create order
      const order = await prisma.order.create({
        data: {
          userId: userId,
          orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          status: "COMPLETED",
          subtotal: subtotal,
          discount: discount / 100,
          total: total,
          stripePaymentId: stripeSession.payment_intent as string,
          stripeSessionId: sessionId,
          paymentMethod: "card",
          promoCodeId: promoCodeId || null,
          paidAt: new Date(),
          items: {
            create: {
              courseId: courseId,
              courseName: course.title,
              price: course.price,
              quantity: 1,
            },
          },
        },
      })

      // Create enrollment
      await prisma.enrollment.create({
        data: {
          userId: userId,
          courseId: courseId,
          orderId: order.id,
          grantedBy: "purchase",
          enrolledAt: new Date(),
        },
      })

      // Update promo code usage if applicable
      if (promoCodeId) {
        await prisma.promoCode.update({
          where: { id: promoCodeId },
          data: {
            usedCount: { increment: 1 },
          },
        })
      }
    }

    // Success!
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              You've been enrolled in the CCW Certification Course.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 font-medium mb-1">
                What's Next?
              </p>
              <p className="text-sm text-blue-700">
                Start your training by viewing the course slides, then take the final exam to earn your certificate.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              Go to Dashboard
            </Link>

            <p className="text-xs text-gray-500 mt-4">
              A receipt has been sent to your email
            </p>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Payment success error:", error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-900 mb-2">
              Something Went Wrong
            </h2>
            <p className="text-red-700 mb-4">
              There was an error processing your payment. Please contact support.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }
}