"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Slide = {
  id: string
  title: string | null
  content: string | null
  imageUrl: string | null
  slideNumber: number
  minViewTime: number | null
}

export default function EditSlideButton({
  slide,
  courseId,
}: {
  slide: Slide
  courseId: string
}) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: slide.title || "",
    content: slide.content || "",
    imageUrl: slide.imageUrl || "",
    minViewTime: slide.minViewTime?.toString() || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/update-slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slideId: slide.id,
          courseId,
          title: formData.title,
          content: formData.content,
          imageUrl: formData.imageUrl || null,
          minViewTime: formData.minViewTime
            ? parseInt(formData.minViewTime)
            : null,
        }),
      })

      if (response.ok) {
        setShowModal(false)
        router.refresh()
      } else {
        alert("Failed to update slide")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to update slide")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        Edit
      </button>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Slide {slide.slideNumber}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content (HTML supported)
                </label>
                <textarea
                  required
                  rows={10}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can use HTML tags like &lt;h1&gt;, &lt;p&gt;, &lt;strong&gt;,
                  &lt;ul&gt;, &lt;li&gt;, etc.
                </p>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Min View Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum View Time (seconds, optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minViewTime}
                  onChange={(e) =>
                    setFormData({ ...formData, minViewTime: e.target.value })
                  }
                  placeholder="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}