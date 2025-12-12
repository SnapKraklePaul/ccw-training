"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SuspendUserButton({
  userId,
  isActive,
}: {
  userId: string
  isActive: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggleSuspend = async () => {
    if (
      !confirm(
        `Are you sure you want to ${
          isActive ? "suspend" : "activate"
        } this user?`
      )
    ) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/admin/toggle-user-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !isActive }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert("Failed to update user status")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to update user status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggleSuspend}
      disabled={loading}
      className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
        isActive
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-green-600 text-white hover:bg-green-700"
      }`}
    >
      {loading ? "Loading..." : isActive ? "Suspend User" : "Activate User"}
    </button>
  )
}