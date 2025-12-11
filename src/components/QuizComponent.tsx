"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Question {
  id: string
  questionNumber: number
  questionText: string
  type: string
  options: string[]
  correctAnswer: string
  explanation: string | null
  points: number
}

interface Quiz {
  id: string
  title: string
  description: string | null
}

interface QuizComponentProps {
  quiz: Quiz
  questions: Question[]
  userId: string
  courseId: string
  passingScore: number
}

export default function QuizComponent({
  quiz,
  questions,
  userId,
  courseId,
  passingScore,
}: QuizComponentProps) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isReviewing, setIsReviewing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).length

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }))
  }

  // Navigation
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index)
    }
  }

  // Submit quiz
  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      alert(`Please answer all ${totalQuestions} questions before submitting.`)
      return
    }

    if (!confirm("Are you sure you want to submit your quiz? This cannot be undone.")) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          quizId: quiz.id,
          courseId,
          answers,
          questions,
        }),
      })

      const result = await response.json()

      if (result.attemptId) {
        router.push(`/course/${courseId}/quiz/results/${result.attemptId}`)
      } else {
        alert("Error submitting quiz. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting quiz:", error)
      alert("Error submitting quiz. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Question Navigator */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Question Progress</h3>
        <div className="grid grid-cols-10 gap-2">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => goToQuestion(index)}
              className={`w-10 h-10 rounded flex items-center justify-center font-medium transition-colors ${
                index === currentQuestionIndex
                  ? "bg-blue-600 text-white"
                  : answers[q.id]
                  ? "bg-green-100 text-green-800 border-2 border-green-500"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4">
          Answered: {answeredCount} / {totalQuestions}
        </p>
      </div>

      {/* Current Question */}
      {!isReviewing && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <span className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <h2 className="text-xl font-bold text-gray-900 mt-2">
              {currentQuestion.questionText}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  answers[currentQuestion.id] === option
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQuestion.id] === option
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {answers[currentQuestion.id] === option && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => goToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            {currentQuestionIndex === totalQuestions - 1 ? (
              <button
                onClick={() => setIsReviewing(true)}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
              >
                Review Answers
              </button>
            ) : (
              <button
                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Review Mode */}
      {isReviewing && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Review Your Answers
          </h2>

          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-200 pb-6">
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-gray-900">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">
                      {question.questionText}
                    </p>
                    <p className="text-gray-700">
                      Your answer:{" "}
                      <span className="font-semibold">
                        {answers[question.id] || "Not answered"}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsReviewing(false)
                      goToQuestion(index)
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              Ready to Submit?
            </h3>
            <p className="text-blue-800 text-sm mb-4">
              You have answered {answeredCount} out of {totalQuestions}{" "}
              questions. You need {passingScore}% to pass.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsReviewing(false)}
                className="px-6 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
              >
                Continue Editing
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || answeredCount < totalQuestions}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}