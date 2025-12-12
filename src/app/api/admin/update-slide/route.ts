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

    const { slideId, title, content, imageUrl, minViewTime } =
      await request.json()

    await prisma.courseSlide.update({
      where: { id: slideId },
      data: {
        title,
        content,
        imageUrl,
        minViewTime,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating slide:", error)
    return NextResponse.json(
      { error: "Failed to update slide" },
      { status: 500 }
    )
  }
}