import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Must be admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code, discountType, discountValue, maxUses, validUntil } =
      await request.json()

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Promo code already exists" },
        { status: 400 }
      )
    }

    // Create promo code
    const promoCode = await prisma.promoCode.create({
      data: {
        code,
        discountType,
        discountValue,
        maxUses,
        validUntil,
        isActive: true,
        usedCount: 0,
      },
    })

    return NextResponse.json({ success: true, promoCode })
  } catch (error) {
    console.error("Error creating promo code:", error)
    return NextResponse.json(
      { error: "Failed to create promo code" },
      { status: 500 }
    )
  }
}