import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { redirect } from "next/navigation"
import Link from "next/link"
import QuizComponent from "@/components/QuizComponent"

const prisma = new PrismaClient()

export default async function QuizPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const session = await auth()

  // Must be logged in
  if (!session?.user) {
    redirect("/login")
  }

  // Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: courseId,
      },
    },
    include: {
      course: {
        include: {
          quiz: {
            include: {
              questions: {
                orderBy: { questionNumber: "asc" },
              },
            },
          },
        },
      },
    },
  })

  if (!enrollment) {
    redirect("/courses")
  }

  // Check if course is completed
  const progress = await prisma.courseProgress.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: courseId,
      },
    },
  })

  if (!progress?.isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-yellow-900 mb-2">
              Complete the Course First
            </h2>
            <p className="text-yellow-700 mb-4">
              You must complete all course slides before taking the quiz.
            </p>
            <Link
              href={`/course/${courseId}`}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue Course
            </Link>
          </div>
        </div>
      </div>
    )
  }

 // Get previous quiz attempts
const attempts = await prisma.quizAttempt.findMany({
  where: {
    userId: session.user.id,
    quizId: enrollment.course.quiz!.id,
  },
  orderBy: { startedAt: "desc" },  // Changed from createdAt to startedAt
})

  // Check if max attempts reached
  const maxAttempts = enrollment.course.maxAttempts
  const attemptsUsed = attempts.length

  if (attemptsUsed >= maxAttempts) {
    const passedAttempt = attempts.find((a) => a.passed)

    if (passedAttempt) {
      redirect(`/course/${courseId}/quiz/results/${passedAttempt.id}`)
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">
              Maximum Attempts Reached
            </h2>
            <p className="text-red-700 mb-4">
              You've used all {maxAttempts} attempts for this quiz. Please
              contact support to retake the course.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const quiz = enrollment.course.quiz!

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                {quiz.title}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Attempt {attemptsUsed + 1} of {maxAttempts}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Quiz Instructions */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">
            Before You Begin:
          </h2>
          <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
            <li>You have {maxAttempts} attempts to pass this quiz</li>
            <li>Passing score: {enrollment.course.passingScore}%</li>
            <li>
              Total questions: {quiz.questions.length}
            </li>
            <li>There is no time limit</li>
            <li>You can review your answers before submitting</li>
          </ul>
        </div>

        {/* Previous Attempts */}
        {attempts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Previous Attempts
            </h3>
            <div className="space-y-2">
              {attempts.map((attempt, index) => (
                <div
                  key={attempt.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-medium">
                      Attempt {attempts.length - index}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">
                      {attempt.score}%
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        attempt.passed
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {attempt.passed ? "Passed" : "Failed"}
                    </span>
                    <Link
                      href={`/course/${courseId}/quiz/results/${attempt.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start Quiz */}
        <QuizComponent
          quiz={quiz}
          questions={quiz.questions}
          userId={session.user.id}
          courseId={courseId}
          passingScore={enrollment.course.passingScore}
        />
      </div>
    </div>
  )
}