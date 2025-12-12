import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"

const prisma = new PrismaClient()

const CERTIFICATES_PER_PAGE = 20

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const session = await auth()
  const params = await searchParams

  // Must be logged in and admin
  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const currentPage = parseInt(params.page || "1")
  const searchQuery = params.search || ""
  const statusFilter = params.status || "all"

  // Build where clause
  const whereClause: {
    OR?: Array<{
      certificateNumber?: { contains: string; mode: "insensitive" }
      fullName?: { contains: string; mode: "insensitive" }
      user?: {
        email?: { contains: string; mode: "insensitive" }
      }
    }>
    status?: "ACTIVE" | "REVOKED"
  } = {}

  if (searchQuery) {
    whereClause.OR = [
      { certificateNumber: { contains: searchQuery, mode: "insensitive" as const } },
      { fullName: { contains: searchQuery, mode: "insensitive" as const } },
      { user: { email: { contains: searchQuery, mode: "insensitive" as const } } },
    ]
  }

  if (statusFilter !== "all") {
    whereClause.status = statusFilter.toUpperCase() as "ACTIVE" | "REVOKED"
  }

  // Get total count
  const totalCertificates = await prisma.certificate.count({ where: whereClause })
  const totalPages = Math.ceil(totalCertificates / CERTIFICATES_PER_PAGE)

  // Get certificates for current page
  const certificates = await prisma.certificate.findMany({
    where: whereClause,
    orderBy: { issuedAt: "desc" },
    skip: (currentPage - 1) * CERTIFICATES_PER_PAGE,
    take: CERTIFICATES_PER_PAGE,
    include: {
      user: true,
    },
  })

  // Calculate stats
  const [activeCertificates, revokedCertificates] = await Promise.all([
    prisma.certificate.count({ where: { status: "ACTIVE" } }),
    prisma.certificate.count({ where: { status: "REVOKED" } }),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Manage Certificates</h1>
            <Link
              href="/admin"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Total Certificates</p>
            <p className="text-3xl font-bold text-gray-900">{totalCertificates}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Active</p>
            <p className="text-3xl font-bold text-green-600">{activeCertificates}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Revoked</p>
            <p className="text-3xl font-bold text-red-600">{revokedCertificates}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form action="/admin/certificates" method="GET" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  name="search"
                  defaultValue={searchQuery}
                  placeholder="Search by certificate number, name, or email..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  name="status"
                  defaultValue={statusFilter}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Apply Filters
              </button>
              {(searchQuery || statusFilter !== "all") && (
                <Link
                  href="/admin/certificates"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Clear All
                </Link>
              )}
            </div>
          </form>
        </div>

        {/* Certificates Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Holder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {cert.certificateNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cert.fullName}</div>
                      <div className="text-sm text-gray-500">{cert.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{cert.courseName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {cert.score}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          cert.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/certificate/${cert.certificateNumber}`}
                        className="text-blue-600 hover:text-blue-900"
                        target="_blank"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/certificates/${cert.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                {currentPage > 1 && (
                  <Link
                    href={`/admin/certificates?page=${currentPage - 1}${
                      searchQuery ? `&search=${searchQuery}` : ""
                    }${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link
                    href={`/admin/certificates?page=${currentPage + 1}${
                      searchQuery ? `&search=${searchQuery}` : ""
                    }${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * CERTIFICATES_PER_PAGE + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * CERTIFICATES_PER_PAGE, totalCertificates)}
                    </span>{" "}
                    of <span className="font-medium">{totalCertificates}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {currentPage > 1 && (
                      <Link
                        href={`/admin/certificates?page=${currentPage - 1}${
                          searchQuery ? `&search=${searchQuery}` : ""
                        }${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        Previous
                      </Link>
                    )}

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => {
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 &&
                            pageNum <= currentPage + 1)
                        ) {
                          return (
                            <Link
                              key={pageNum}
                              href={`/admin/certificates?page=${pageNum}${
                                searchQuery ? `&search=${searchQuery}` : ""
                              }${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pageNum === currentPage
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </Link>
                          )
                        } else if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return (
                            <span
                              key={pageNum}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                            >
                              ...
                            </span>
                          )
                        }
                        return null
                      }
                    )}

                    {currentPage < totalPages && (
                      <Link
                        href={`/admin/certificates?page=${currentPage + 1}${
                          searchQuery ? `&search=${searchQuery}` : ""
                        }${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        Next
                      </Link>
                    )}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}