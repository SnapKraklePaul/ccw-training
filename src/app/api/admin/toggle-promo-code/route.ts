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

    const { promoCodeId, isActive } = await request.json()

    // Update promo code
    await prisma.promoCode.update({
      where: { id: promoCodeId },
      data: { isActive },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error toggling promo code:", error)
    return NextResponse.json(
      { error: "Failed to update promo code" },
      { status: 500 }
    )
  }
}