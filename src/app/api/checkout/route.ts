import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { stripe } from "@/lib/stripe"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  return handleCheckout(request)
}

export async function POST(request: NextRequest) {
  return handleCheckout(request)
}

async function handleCheckout(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Get courseId from URL or form data
    const { searchParams } = new URL(request.url)
    let courseId = searchParams.get("courseId")
    let promoCode = searchParams.get("promoCode")

    // If POST request, get from form data
    if (request.method === "POST") {
      const formData = await request.formData()
      courseId = formData.get("courseId") as string || courseId
      promoCode = formData.get("promoCode") as string || promoCode
    }

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID required" },
        { status: 400 }
      )
    }

    // Get course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course || !course.isActive) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      )
    }

    // Check if user already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        },
      },
    })

    if (existingEnrollment) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Calculate price with promo code if provided
    const coursePrice = Number(course.price)
    let finalPrice = coursePrice
    let discount = 0
    let promoCodeRecord = null

    if (promoCode) {
      promoCodeRecord = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
      })

      // Validate promo code
      if (
        promoCodeRecord &&
        promoCodeRecord.isActive &&
        (!promoCodeRecord.maxUses || promoCodeRecord.usedCount < promoCodeRecord.maxUses) &&
        (!promoCodeRecord.validFrom || promoCodeRecord.validFrom <= new Date()) &&
        (!promoCodeRecord.validUntil || promoCodeRecord.validUntil >= new Date())
      ) {
        // Calculate discount
        if (promoCodeRecord.discountType === "PERCENTAGE") {
          discount = coursePrice * (Number(promoCodeRecord.discountValue) / 100)
        } else {
          discount = Number(promoCodeRecord.discountValue)
        }
        finalPrice = coursePrice - discount
      }
    }

    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: course.title,
              description: "CCW Certification Course",
            },
            unit_amount: Math.round(finalPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/courses?cancelled=true`,
      metadata: {
        userId: session.user.id,
        courseId: courseId,
        promoCodeId: promoCodeRecord?.id || "",
      },
    })

    // Redirect to Stripe Checkout
    return NextResponse.redirect(stripeSession.url!)
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}