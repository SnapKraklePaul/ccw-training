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

    const { questionId, questionText, options, correctAnswer, explanation } =
      await request.json()

    await prisma.quizQuestion.update({
      where: { id: questionId },
      data: {
        questionText,
        options,
        correctAnswer,
        explanation,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating quiz question:", error)
    return NextResponse.json(
      { error: "Failed to update quiz question" },
      { status: 500 }
    )
  }
}