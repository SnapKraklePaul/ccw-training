"use client"

import { useState } from "react"

export default function DownloadReportButton() {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    reportType: "revenue",
    periodType: "daily",
    format: "csv",
    startDate: "",
    endDate: "",
  })

  const handleDownload = async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        reportType: formData.reportType,
        periodType: formData.periodType,
        format: formData.format,
        startDate: formData.startDate,
        endDate: formData.endDate,
      })

      const response = await fetch(`/api/admin/download-report?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const extension = formData.format === "csv" ? "csv" : "pdf"
        a.download = `${formData.reportType}-report-${formData.startDate}-to-${formData.endDate}.${extension}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setShowModal(false)
      } else {
        alert("Failed to download report")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to download report")
    } finally {
      setLoading(false)
    }
  }

  // Set default dates (last 30 days)
  const today = new Date().toISOString().split("T")[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  if (!formData.startDate) {
    setFormData((prev) => ({ ...prev, startDate: thirtyDaysAgo, endDate: today }))
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
      >
        📥 Download Custom Report
      </button>

      {/* Download Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Download Report
            </h3>
            <div className="space-y-4">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  value={formData.reportType}
                  onChange={(e) =>
                    setFormData({ ...formData, reportType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="revenue">Revenue Report</option>
                  <option value="orders">Orders Report</option>
                  <option value="users">Users Report</option>
                  <option value="enrollments">Enrollments Report</option>
                  <option value="certificates">Certificates Report</option>
                  <option value="quiz">Quiz Performance Report</option>
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  value={formData.format}
                  onChange={(e) =>
                    setFormData({ ...formData, format: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="csv">CSV (Excel/Sheets)</option>
                  <option value="pdf">PDF (Printable)</option>
                </select>
              </div>

              {/* Period Type - Only show for CSV */}
              {formData.format === "csv" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grouping
                  </label>
                  <select
                    value={formData.periodType}
                    onChange={(e) =>
                      setFormData({ ...formData, periodType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownload}
                  disabled={loading || !formData.startDate || !formData.endDate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Generating..." : `Download ${formData.format.toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}