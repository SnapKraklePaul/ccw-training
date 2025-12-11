import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { userId, quizId, courseId, answers, questions } = await request.json()

    // Calculate score
    let correctAnswers = 0
    const questionResults: Record<string, boolean> = {}

    questions.forEach((question: any) => {
      const userAnswer = answers[question.id]
      const isCorrect = userAnswer === question.correctAnswer
      questionResults[question.id] = isCorrect
      if (isCorrect) correctAnswers++
    })

    const totalQuestions = questions.length
    const score = Math.round((correctAnswers / totalQuestions) * 100)

    // Get passing score from course
    const course = await prisma.course.findFirst({
      where: { id: courseId },
    })

    const passed = score >= (course?.passingScore || 80)

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        attemptNumber: await getNextAttemptNumber(userId, quizId),
        status: "COMPLETED",
        score,
        totalQuestions,
        correctAnswers,
        passed,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    })

    // Save individual answers
    for (const question of questions) {
      await prisma.quizAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: question.id,
          selectedAnswer: answers[question.id] || "",
          isCorrect: questionResults[question.id],
        },
      })
    }

   // If passed, generate certificate
if (passed) {
  await generateCertificate(userId, courseId, score, attempt.id)  // Add attempt.id
}

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      score,
      passed,
    })
  } catch (error) {
    console.error("Error submitting quiz:", error)
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    )
  }
}

// Helper function to get next attempt number
async function getNextAttemptNumber(userId: string, quizId: string) {
  const lastAttempt = await prisma.quizAttempt.findFirst({
    where: { userId, quizId },
    orderBy: { attemptNumber: "desc" },
  })

  return (lastAttempt?.attemptNumber || 0) + 1
}

// Helper function to generate certificate
async function generateCertificate(userId: string, courseId: string, score: number, attemptId: string) {
  try {
    console.log("=== GENERATING CERTIFICATE ===")
    console.log("userId:", userId)
    console.log("courseId:", courseId)
    console.log("score:", score)
    console.log("attemptId:", attemptId)

    // Get user and course info
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const course = await prisma.course.findUnique({ where: { id: courseId } })

    console.log("user found:", user ? "YES" : "NO")
    console.log("course found:", course ? "YES" : "NO")

    if (!user || !course) {
      console.log("ERROR: User or course not found")
      return
    }

    // Generate unique certificate number
    const certificateNumber = `CCW-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    console.log("Creating certificate with number:", certificateNumber)

    // Create certificate record
    const certificate = await prisma.certificate.create({
      data: {
        userId,
        courseId,
        attemptId,        // Add this required field
        certificateNumber,
        fullName: user.name || "Unknown",
        courseName: course.title,
        score,
        status: "ACTIVE",
        issuedAt: new Date(),
      },
    })

    console.log("Certificate created successfully:", certificate.id)
    return certificate
  } catch (error) {
    console.error("ERROR GENERATING CERTIFICATE:", error)
    throw error
  }
}