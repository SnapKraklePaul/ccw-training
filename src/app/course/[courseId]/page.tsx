import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { redirect } from "next/navigation"
import Link from "next/link"
import SlideViewer from "@/components/SlideViewer"

const prisma = new PrismaClient()

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const resolvedParams = await params
  const courseId = resolvedParams.courseId
  
  console.log("=== DEBUG ===")
  console.log("resolvedParams:", resolvedParams)
  console.log("courseId:", courseId)
  console.log("typeof courseId:", typeof courseId)
  
  const session = await auth()

  // Must be logged in
  if (!session?.user) {
    redirect("/login")
  }

  // Get user with enrollment
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
          slides: {
            orderBy: { slideNumber: "asc" },
          },
        },
      },
    },
  })

  // Not enrolled
  if (!enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">
              Access Denied
            </h2>
            <p className="text-red-700 mb-4">
              You must purchase this course to access it.
            </p>
            <Link
              href="/courses"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Courses
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Get or create course progress
  let progress = await prisma.courseProgress.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: courseId,
      },
    },
  })

  if (!progress) {
    progress = await prisma.courseProgress.create({
      data: {
        userId: session.user.id,
        courseId: courseId,
        currentSlide: 1,
        totalSlides: enrollment.course.slides.length,
        completedSlides: 0,
        isCompleted: false,
      },
    })
  }

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
                {enrollment.course.title}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Progress: {progress.completedSlides} / {progress.totalSlides} slides
              </p>
              <div className="mt-2 w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(progress.completedSlides / progress.totalSlides) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Slide Viewer */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SlideViewer
          slides={enrollment.course.slides}
          progress={progress}
          courseId={courseId}
          userId={session.user.id}
        />
      </main>
    </div>
  )
}