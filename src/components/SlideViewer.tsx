"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Slide {
  id: string
  slideNumber: number
  title: string | null
  content: string | null
  minViewTime: number
}

interface Progress {
  currentSlide: number
  completedSlides: number
  totalSlides: number
  isCompleted: boolean
}

interface SlideViewerProps {
  slides: Slide[]
  progress: Progress
  courseId: string
  userId: string
}

export default function SlideViewer({
  slides,
  progress: initialProgress,
  courseId,
  userId,
}: SlideViewerProps) {
  const router = useRouter()
  const [currentSlideIndex, setCurrentSlideIndex] = useState(
    initialProgress.currentSlide - 1
  )
  // const [timeRemaining, setTimeRemaining] = useState(
  //   slides[initialProgress.currentSlide - 1]?.minViewTime || 10
  // )

  const [timeRemaining, setTimeRemaining] = useState(0)

  const [canProceed, setCanProceed] = useState(true)
  const [loading, setLoading] = useState(false)

  const currentSlide = slides[currentSlideIndex]

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setCanProceed(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeRemaining])

  // Mark slide as viewed and proceed to next
  const handleNext = async () => {
    if (!canProceed) return

    setLoading(true)

    try {
      // Mark slide as viewed
      await fetch("/api/course/mark-slide-viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          slideId: currentSlide.id,
          courseId,
        }),
      })

      // Move to next slide
      // if (currentSlideIndex < slides.length - 1) {
      //   const nextIndex = currentSlideIndex + 1
      //   setCurrentSlideIndex(nextIndex)
      //   setTimeRemaining(slides[nextIndex].minViewTime)
      //   setCanProceed(false)

      if (currentSlideIndex < slides.length - 1) {
  const nextIndex = currentSlideIndex + 1
  setCurrentSlideIndex(nextIndex)
  setTimeRemaining(0)  // Changed from slides[nextIndex].minViewTime
  setCanProceed(true)  // Changed from false

      } else {
        // Course completed - mark as complete and redirect to quiz
        await fetch("/api/course/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, courseId }),
        })
        router.push(`/course/${courseId}/quiz`)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Go back to previous slide
  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      const prevIndex = currentSlideIndex - 1
      setCurrentSlideIndex(prevIndex)
      setTimeRemaining(0) // Already viewed, no wait time
      setCanProceed(true)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Slide Content */}
      <div className="p-8 min-h-[500px]">
        {/* Slide Number */}
        <div className="text-sm text-gray-500 mb-4">
          Slide {currentSlide.slideNumber} of {slides.length}
        </div>

        {/* Slide Title */}
        {currentSlide.title && (
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {currentSlide.title}
          </h2>
        )}

        {/* Slide Content */}
        <div className="prose max-w-none">
          <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
            {currentSlide.content}
          </p>
        </div>

        {/* Timer Notice */}
        {!canProceed && timeRemaining > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm">
              Please review this slide for at least{" "}
              <span className="font-bold">{timeRemaining} seconds</span> before
              continuing.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="border-t border-gray-200 bg-gray-50 px-8 py-4 flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentSlideIndex === 0}
          className="px-6 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        <div className="text-sm text-gray-600">
          {currentSlideIndex + 1} / {slides.length}
        </div>

        <button
          onClick={handleNext}
          disabled={!canProceed || loading}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            "Loading..."
          ) : currentSlideIndex === slides.length - 1 ? (
            "Complete & Take Quiz →"
          ) : (
            "Next →"
          )}
        </button>
      </div>
    </div>
  )
}