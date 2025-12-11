import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { redirect } from "next/navigation"
import Link from "next/link"

const prisma = new PrismaClient()

export default async function QuizResultsPage({
  params,
}: {
  params: Promise<{ courseId: string; attemptId: string }>
}) {
  const { courseId, attemptId } = await params
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Get quiz attempt with answers
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { questionNumber: "asc" },
          },
          course: true,
        },
      },
      answers: {
        include: {
          question: true,
        },
      },
    },
  })

  if (!attempt || attempt.userId !== session.user.id) {
    redirect("/dashboard")
  }

  // Get certificate if passed
  const certificate = attempt.passed
    ? await prisma.certificate.findFirst({
        where: {
          userId: session.user.id,
          courseId: courseId,
        },
        orderBy: { issuedAt: "desc" },
      })
    : null

  const passingScore = attempt.quiz.course.passingScore

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Quiz Results
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Summary */}
        <div
          className={`rounded-lg shadow-lg p-8 mb-8 ${
            attempt.passed
              ? "bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500"
              : "bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-500"
          }`}
        >
          <div className="text-center">
            {/* Pass/Fail Icon */}
            <div
              className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                attempt.passed ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {attempt.passed ? (
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>

            <h2
              className={`text-3xl font-bold mb-2 ${
                attempt.passed ? "text-green-900" : "text-red-900"
              }`}
            >
              {attempt.passed ? "Congratulations!" : "Not Quite There"}
            </h2>

            <p
              className={`text-lg mb-6 ${
                attempt.passed ? "text-green-800" : "text-red-800"
              }`}
            >
              {attempt.passed
                ? "You have successfully passed the quiz!"
                : `You need ${passingScore}% to pass. Keep studying and try again!`}
            </p>

            {/* Score Display */}
            <div className="bg-white rounded-lg p-6 inline-block shadow-lg">
              <div className="text-6xl font-bold text-gray-900 mb-2">
                {attempt.score}%
              </div>
              <p className="text-gray-600">
                {attempt.correctAnswers} out of {attempt.totalQuestions} correct
              </p>
            </div>

            {/* Attempt Info */}
            <div className="mt-6 text-sm text-gray-600">
              <p>Attempt #{attempt.attemptNumber}</p>
              <p>
                Completed on{" "}
                {attempt.completedAt
                  ? new Date(attempt.completedAt).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Section */}
        {attempt.passed && certificate && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  🎓 Your Certificate is Ready!
                </h3>
                <p className="text-gray-600">
                  Certificate Number: {certificate.certificateNumber}
                </p>
              </div>
              <Link
                href={`/certificate/${certificate.certificateNumber}`}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Certificate
              </Link>
            </div>
          </div>
        )}

        {/* Retry Section */}
        {!attempt.passed && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What's Next?
            </h3>
            <p className="text-gray-600 mb-4">
              Review the questions below to see what you got wrong, then try
              again when you're ready.
            </p>
            <Link
              href={`/course/${courseId}/quiz`}
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retake Quiz
            </Link>
          </div>
        )}

        {/* Question Review */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Question Review
          </h3>

          <div className="space-y-6">
            {attempt.answers.map((answer, index) => {
              const question = answer.question
              return (
                <div
                  key={answer.id}
                  className={`border-l-4 pl-6 py-4 ${
                    answer.isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }`}
                >
                  {/* Question Number and Status */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-semibold text-gray-900">
                      Question {index + 1}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        answer.isCorrect
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {answer.isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  {/* Question Text */}
                  <p className="font-medium text-gray-900 mb-3">
                    {question.questionText}
                  </p>

                  {/* Your Answer */}
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">Your answer: </span>
                    <span
                      className={`font-semibold ${
                        answer.isCorrect ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {answer.selectedAnswer}
                    </span>
                  </div>

                  {/* Correct Answer (if wrong) */}
                  {!answer.isCorrect && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-600">
                        Correct answer:{" "}
                      </span>
                      <span className="font-semibold text-green-700">
                        {question.correctAnswer}
                      </span>
                    </div>
                  )}

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Explanation: </span>
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </Link>
          {attempt.passed && certificate && (
            <Link
              href={`/certificate/${certificate.certificateNumber}`}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Certificate
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}