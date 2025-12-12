import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"
import CourseSettingsForm from "@/components/admin/CourseSettingsForm"

const prisma = new PrismaClient()

export default async function CourseSettingsPage({
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Course Settings</h1>
            <Link
              href="/admin/course"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              ← Back to Course
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Edit Course Details
          </h2>
          <CourseSettingsForm course={course} />
        </div>
      </main>
    </div>
  )
}