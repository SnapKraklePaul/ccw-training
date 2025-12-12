import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"
import CreatePromoCodeButton from "@/components/admin/CreatePromoCodeButton"
import TogglePromoCodeButton from "@/components/admin/TogglePromoCodeButton"

const prisma = new PrismaClient()

export default async function AdminPromoCodesPage() {
  const session = await auth()

  // Must be logged in and admin
  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Get all promo codes
  const promoCodes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  })

  // Calculate stats
  const activeCount = promoCodes.filter((code) => code.isActive).length
  const totalUsage = promoCodes.reduce((sum, code) => sum + code.usedCount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Manage Promo Codes</h1>
            <div className="flex gap-4">
              <CreatePromoCodeButton />
              <Link
                href="/admin"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Total Promo Codes</p>
            <p className="text-3xl font-bold text-gray-900">{promoCodes.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Active Codes</p>
            <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Total Uses</p>
            <p className="text-3xl font-bold text-blue-600">{totalUsage}</p>
          </div>
        </div>

        {/* Promo Codes Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promoCodes.map((code) => {
                  const isExpired = code.validUntil && new Date(code.validUntil) < new Date()
                  const usageLimitReached =
                    code.maxUses !== null && code.usedCount >= code.maxUses

                  return (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-bold text-gray-900">
                          {code.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {code.discountType === "PERCENTAGE"
                            ? `${code.discountValue}%`
                            : `$${code.discountValue}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {code.usedCount}
                          {code.maxUses && ` / ${code.maxUses}`}
                        </div>
                        {usageLimitReached && (
                          <span className="text-xs text-red-600">Limit reached</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {code.validUntil ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {new Date(code.validUntil).toLocaleDateString()}
                            </div>
                            {isExpired && (
                              <span className="text-xs text-red-600">Expired</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            code.isActive && !isExpired && !usageLimitReached
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {code.isActive && !isExpired && !usageLimitReached
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <TogglePromoCodeButton
                          promoCodeId={code.id}
                          isActive={code.isActive}
                        />
                      </td>
                    </tr>
                  )
                })}

                {promoCodes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <p className="text-lg font-medium mb-2">No promo codes yet</p>
                        <p className="text-sm">
                          Create your first promo code to get started
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}