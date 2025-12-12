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

    const { updates } = await request.json()

    // Update all slides in a transaction
    await prisma.$transaction(
      updates.map((update: { id: string; slideNumber: number }) =>
        prisma.courseSlide.update({
          where: { id: update.id },
          data: { slideNumber: update.slideNumber },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering slides:", error)
    return NextResponse.json(
      { error: "Failed to reorder slides" },
      { status: 500 }
    )
  }
}