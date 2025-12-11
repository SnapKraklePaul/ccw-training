import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId } = await request.json()

    // Mark course as completed
    await prisma.courseProgress.update({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error completing course:", error)
    return NextResponse.json(
      { error: "Failed to complete course" },
      { status: 500 }
    )
  }
}