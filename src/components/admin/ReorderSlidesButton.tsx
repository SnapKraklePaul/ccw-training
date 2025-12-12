"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Slide = {
  id: string
  title: string | null
  slideNumber: number
}

export default function ReorderSlidesButton({
  courseId,
  slides,
}: {
  courseId: string
  slides: Slide[]
}) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orderedSlides, setOrderedSlides] = useState(slides)

  const moveSlide = (index: number, direction: "up" | "down") => {
    const newSlides = [...orderedSlides]
    const targetIndex = direction === "up" ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newSlides.length) return

    const temp = newSlides[index]
    newSlides[index] = newSlides[targetIndex]
    newSlides[targetIndex] = temp

    setOrderedSlides(newSlides)
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const updates = orderedSlides.map((slide, index) => ({
        id: slide.id,
        slideNumber: index + 1,
      }))

      const response = await fetch("/api/admin/reorder-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, updates }),
      })

      if (response.ok) {
        setShowModal(false)
        router.refresh()
      } else {
        alert("Failed to reorder slides")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to reorder slides")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setOrderedSlides(slides)
          setShowModal(true)
        }}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
      >
        Reorder Slides
      </button>

      {/* Reorder Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reorder Slides
            </h3>
            <div className="space-y-2 mb-6">
              {orderedSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-semibold text-gray-500 w-8">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-900">
                    {slide.title || "Untitled Slide"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveSlide(index, "up")}
                      disabled={index === 0}
                      className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSlide(index, "down")}
                      disabled={index === orderedSlides.length - 1}
                      className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}