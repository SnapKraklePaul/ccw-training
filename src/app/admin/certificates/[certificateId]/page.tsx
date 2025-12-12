import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"
import RevokeCertificateButton from "@/components/admin/RevokeCertificateButton"

const prisma = new PrismaClient()

export default async function CertificateDetailsPage({
  params,
}: {
  params: Promise<{ certificateId: string }>
}) {
  const session = await auth()
  const { certificateId } = await params

  // Must be logged in and admin
  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Get certificate with all related data
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: {
      user: true,
      attempt: {
        include: {
          quiz: {
            include: {
              course: true,
            },
          },
          answers: {
            include: {
              question: true,
            },
          },
        },
      },
    },
  })

  if (!certificate) {
    redirect("/admin/certificates")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Certificate Details</h1>
            <Link
              href="/admin/certificates"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              ← Back to Certificates
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Certificate Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Certificate #{certificate.certificateNumber}
              </h2>
              <p className="text-gray-600">
                Issued on {new Date(certificate.issuedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <span
                className={`px-4 py-2 text-sm font-semibold rounded-full ${
                  certificate.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {certificate.status}
              </span>
              <RevokeCertificateButton
                certificateId={certificate.id}
                status={certificate.status}
              />
            </div>
          </div>

          {/* Certificate Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Certificate Holder
              </h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Name:</span> {certificate.fullName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {certificate.user.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">User ID:</span> {certificate.user.id}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Course Information
              </h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Course:</span> {certificate.courseName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Score:</span>{" "}
                  <span className="text-lg font-bold text-green-600">
                    {certificate.score}%
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Attempt ID:</span> {certificate.attemptId}
                </p>
              </div>
            </div>
          </div>

          {/* Revoked Info */}
          {certificate.status === "REVOKED" && certificate.revokedAt && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-semibold text-red-900 mb-2">
                Revocation Information
              </h3>
              <p className="text-sm text-red-800">
                <span className="font-medium">Revoked on:</span>{" "}
                {new Date(certificate.revokedAt).toLocaleDateString()}
              </p>
              {certificate.revokedReason && (
                <p className="text-sm text-red-800 mt-1">
                  <span className="font-medium">Reason:</span> {certificate.revokedReason}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Quiz Attempt Details */}
        {certificate.attempt && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quiz Attempt Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Attempt Number</p>
                <p className="text-2xl font-bold text-gray-900">
                  #{certificate.attempt.attemptNumber}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Questions Correct</p>
                <p className="text-2xl font-bold text-gray-900">
                  {certificate.attempt.correctAnswers} / {certificate.attempt.totalQuestions}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Completion Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {certificate.attempt.completedAt
                    ? new Date(certificate.attempt.completedAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Quiz Answers Summary */}
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Answer Breakdown
              </h4>
              <div className="space-y-2">
                {certificate.attempt.answers.map((answer, index) => (
                  <div
                    key={answer.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      answer.isCorrect ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Question {index + 1}: {answer.question.questionText}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Answer: {answer.selectedAnswer}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        answer.isCorrect
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {answer.isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
          <div className="flex gap-4">
            <Link
              href={`/certificate/${certificate.certificateNumber}`}
              target="_blank"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              View Certificate
            </Link>
            <Link
              href={`/admin/users/${certificate.user.id}`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              View User Profile
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}