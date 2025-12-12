"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RevokeCertificateButton({
  certificateId,
  status,
}: {
  certificateId: string
  status: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [reason, setReason] = useState("")

  const handleRevoke = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for revocation")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/admin/revoke-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateId,
          reason: reason.trim(),
        }),
      })

      if (response.ok) {
        setShowReasonModal(false)
        router.refresh()
      } else {
        alert("Failed to revoke certificate")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to revoke certificate")
    } finally {
      setLoading(false)
    }
  }

  if (status === "REVOKED") {
    return null
  }

  return (
    <>
      <button
        onClick={() => setShowReasonModal(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
      >
        Revoke Certificate
      </button>

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revoke Certificate
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for revoking this certificate. This action cannot
              be undone.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for revocation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 mb-4"
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowReasonModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={loading || !reason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Revoking..." : "Revoke Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}