import { PrismaClient } from "@prisma/client"
import { notFound } from "next/navigation"
import Link from "next/link"
import PrintButton from "@/components/PrintButton"

const prisma = new PrismaClient()

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ certificateNumber: string }>
}) {
  const { certificateNumber } = await params

  // Get certificate
  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber },
    include: {
      user: true
    },
  })

  if (!certificate || certificate.status !== "ACTIVE") {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 print:py-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 print:px-0">
        {/* Actions Bar */}
        <div className="mb-6 flex justify-between items-center print:hidden">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
          <PrintButton />
        </div>

        {/* Certificate */}
        <div
          id="certificate"
          className="bg-white rounded-lg shadow-2xl p-12 border-8 border-double border-blue-900 print:shadow-none"
          style={{
            background: "linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)",
          }}
        >
          {/* Decorative Border */}
          <div className="border-4 border-blue-600 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎓</div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Certificate of Completion
              </h1>
              <div className="h-1 w-32 bg-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">
                This certifies that
              </p>
            </div>

            {/* Recipient Name */}
            <div className="text-center mb-8">
              <h2 className="text-5xl font-bold text-blue-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                {certificate.fullName}
              </h2>
              <p className="text-gray-600 text-lg">
                has successfully completed the course
              </p>
            </div>

            {/* Course Name */}
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-800 mb-6">
                {certificate.courseName}
              </h3>
              <p className="text-gray-600 text-lg">
                with a score of{" "}
                <span className="font-bold text-blue-600 text-2xl">
                  {certificate.score}%
                </span>
              </p>
            </div>

            {/* Date and Certificate Number */}
            <div className="flex justify-between items-end mt-12 pt-8 border-t-2 border-gray-300">
              <div className="text-left">
                <div className="border-t-2 border-gray-800 pt-2 w-48">
                  <p className="text-sm text-gray-600">Date Issued</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(certificate.issuedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="mb-2">
                  <svg
                    className="w-16 h-16 mx-auto text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-xs text-gray-500">Official Seal</p>
              </div>

              <div className="text-right">
                <div className="border-t-2 border-gray-800 pt-2 w-48">
                  <p className="text-sm text-gray-600">Certificate Number</p>
                  <p className="font-mono text-xs text-gray-900 break-all">
                    {certificate.certificateNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center print:hidden">
          <p className="text-sm text-blue-900">
            This certificate can be verified at:{" "}
            <span className="font-mono font-semibold">
              {process.env.NEXTAUTH_URL}/verify-certificate?code={certificate.certificateNumber}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}