import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"
import EditQuizQuestionButton from "@/components/admin/EditQuizQuestionButton"

const prisma = new PrismaClient()

export default async function ManageQuizPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const session = await auth()
  const { courseId } = await params

  // Must be logged in and admin
  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  })

  if (!course) {
    redirect("/admin/course")
  }

  // Get quiz with questions
  const quiz = await prisma.quiz.findUnique({
    where: { courseId },
    include: {
      questions: {
        orderBy: { questionNumber: "asc" },
      },
    },
  })

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Manage Quiz</h1>
              <Link
                href="/admin/course"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                ← Back to Course
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No quiz found for this course</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Quiz</h1>
              <p className="text-gray-600">{course.title}</p>
            </div>
            <Link
              href="/admin/course"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              ← Back to Course
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quiz Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quiz Settings</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Questions</p>
              <p className="text-xl font-bold text-gray-900">
                {quiz.questions.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Passing Score</p>
              <p className="text-xl font-bold text-gray-900">{course.passingScore}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Max Attempts</p>
              <p className="text-xl font-bold text-gray-900">{course.maxAttempts}</p>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {quiz.questions.map((question) => {
            const options = question.options as string[]
            return (
              <div key={question.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                        Question {question.questionNumber}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-4">
                      {question.questionText}
                    </p>

                    {/* Answer Options */}
                    <div className="space-y-2">
                      {["A", "B", "C", "D"].map((label, index) => (
                        <div
                          key={label}
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 ${
                            question.correctAnswer === label
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <span className="font-semibold text-gray-700 min-w-6">
                            {label}.
                          </span>
                          <span className="text-gray-900">{options[index]}</span>
                          {question.correctAnswer === label && (
                            <span className="ml-auto px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded">
                              Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-1">
                          Explanation:
                        </p>
                        <p className="text-sm text-blue-800">{question.explanation}</p>
                      </div>
                    )}
                  </div>

                  <EditQuizQuestionButton question={question} quizId={quiz.id} />
                </div>
              </div>
            )
          })}

          {quiz.questions.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">No questions found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}