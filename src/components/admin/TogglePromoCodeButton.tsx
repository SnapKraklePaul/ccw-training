"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function TogglePromoCodeButton({
  promoCodeId,
  isActive,
}: {
  promoCodeId: string
  isActive: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/admin/toggle-promo-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCodeId, isActive: !isActive }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert("Failed to update promo code")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to update promo code")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
        isActive
          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
          : "bg-green-600 text-white hover:bg-green-700"
      }`}
    >
      {loading ? "..." : isActive ? "Deactivate" : "Activate"}
    </button>
  )
}