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

    const { courseId, title, description, price, isActive } = await request.json()

    // Update course settings
    await prisma.course.update({
      where: { id: courseId },
      data: {
        title,
        description,
        price,
        isActive,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating course settings:", error)
    return NextResponse.json(
      { error: "Failed to update course settings" },
      { status: 500 }
    )
  }
}