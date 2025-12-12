import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"

const prisma = new PrismaClient()

export default async function AdminCoursePage() {
  const session = await auth()

  // Must be logged in and admin
  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Get all courses
  const courses = await prisma.course.findMany({
    include: {
      _count: {
        select: {
          slides: true,
          enrollments: true,
        },
      },
      quiz: {
        include: {
          _count: {
            select: {
              questions: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Manage Course</h1>
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
        {/* Courses List */}
        <div className="space-y-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
                  <p className="text-gray-600 mt-1">{course.description}</p>
                </div>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    course.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {course.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${course.price.toString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Slides</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {course._count.slides}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Quiz Questions</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {course.quiz?._count.questions || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Enrollments</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {course._count.enrollments}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                <Link
                  href={`/admin/course/${course.id}/settings`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Edit Settings
                </Link>
                <Link
                  href={`/admin/course/${course.id}/slides`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Manage Slides ({course._count.slides})
                </Link>
                {course.quiz && (
                  <Link
                    href={`/admin/course/${course.id}/quiz`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Manage Quiz ({course.quiz._count.questions})
                  </Link>
                )}
              </div>
            </div>
          ))}

          {courses.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">No courses found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}