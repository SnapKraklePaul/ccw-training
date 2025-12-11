import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { userId, slideId, courseId } = await request.json()

    // Mark slide as viewed (upsert to prevent duplicates)
    await prisma.slideView.upsert({
      where: {
        userId_slideId: {
          userId,
          slideId,
        },
      },
      update: {},
      create: {
        userId,
        slideId,
      },
    })

    // Update course progress
    const completedSlides = await prisma.slideView.count({
      where: { userId },
    })

    const progress = await prisma.courseProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    })

    if (progress) {
      await prisma.courseProgress.update({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        data: {
          completedSlides,
          lastAccessedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking slide as viewed:", error)
    return NextResponse.json(
      { error: "Failed to mark slide as viewed" },
      { status: 500 }
    )
  }
}