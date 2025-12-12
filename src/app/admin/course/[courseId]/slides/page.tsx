import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"
import Image from "next/image"
import EditSlideButton from "@/components/admin/EditSlideButton"
import ReorderSlidesButton from "@/components/admin/ReorderSlidesButton"

const prisma = new PrismaClient()

export default async function ManageSlidesPage({
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

  // Get slides separately with proper ordering
  const slides = await prisma.courseSlide.findMany({
    where: { courseId },
    orderBy: { slideNumber: "asc" },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Slides</h1>
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
        {/* Reorder Button */}
        <div className="mb-6">
          <ReorderSlidesButton courseId={courseId} slides={slides} />
        </div>

        {/* Slides List */}
        <div className="space-y-4">
          {slides.map((slide) => (
            <div key={slide.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                      Slide {slide.slideNumber}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {slide.title}
                    </h3>
                  </div>
                  <div
                    className="text-gray-700 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: slide.content || "" }}
                  />
                  {slide.imageUrl && (
                    <div className="mt-4 relative w-full max-w-md h-64">
                      <Image
                        src={slide.imageUrl}
                        alt={slide.title || "Slide image"}
                        fill
                        className="object-contain rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  {slide.minViewTime && (
                    <p className="text-sm text-gray-500 mt-2">
                      Min view time: {slide.minViewTime} seconds
                    </p>
                  )}
                </div>
                <EditSlideButton slide={slide} courseId={courseId} />
              </div>
            </div>
          ))}

          {slides.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">No slides found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}