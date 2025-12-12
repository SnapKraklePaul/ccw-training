import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"
import DownloadReportButton from "@/components/admin/DownloadReportButton"

const prisma = new PrismaClient()

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const session = await auth()
  const params = await searchParams

  // Must be logged in and admin
  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const period = params.period || "30" // Default to last 30 days

  // Calculate date range
  const now = new Date()
  const startDate = new Date()
  
  switch (period) {
    case "7":
      startDate.setDate(now.getDate() - 7)
      break
    case "30":
      startDate.setDate(now.getDate() - 30)
      break
    case "90":
      startDate.setDate(now.getDate() - 90)
      break
    case "365":
      startDate.setDate(now.getDate() - 365)
      break
    case "all":
      startDate.setFullYear(2000) // Far back enough to get all data
      break
  }

  // Get revenue data
  const orders = await prisma.order.findMany({
    where: {
      status: "COMPLETED",
      paidAt: {
        gte: startDate,
      },
    },
    select: {
      total: true,
      discount: true,
      paidAt: true,
    },
  })

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0)
  const totalDiscounts = orders.reduce((sum, order) => sum + Number(order.discount), 0)
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

  // Get user registrations
  const newUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
  })

  // Get enrollments
  const enrollments = await prisma.enrollment.count({
    where: {
      enrolledAt: {
        gte: startDate,
      },
    },
  })

  // Get certificates issued
  const certificatesIssued = await prisma.certificate.count({
    where: {
      issuedAt: {
        gte: startDate,
      },
      status: "ACTIVE",
    },
  })

  // Get quiz attempts
  const quizAttempts = await prisma.quizAttempt.count({
    where: {
      startedAt: {
        gte: startDate,
      },
    },
  })

  const passedAttempts = await prisma.quizAttempt.count({
    where: {
      startedAt: {
        gte: startDate,
      },
      passed: true,
    },
  })

  const passRate = quizAttempts > 0 ? (passedAttempts / quizAttempts) * 100 : 0

  // Get promo code usage
  const promoCodeOrders = await prisma.order.count({
    where: {
      paidAt: {
        gte: startDate,
      },
      promoCodeId: {
        not: null,
      },
    },
  })

  const promoCodeUsageRate = orders.length > 0 ? (promoCodeOrders / orders.length) * 100 : 0

  // Top promo codes
  const topPromoCodes = await prisma.promoCode.findMany({
    take: 5,
    orderBy: { usedCount: "desc" },
    where: {
      orders: {
        some: {
          paidAt: {
            gte: startDate,
          },
        },
      },
    },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  })

  // Daily revenue breakdown (for charts - simplified)
  const dailyRevenue: { [key: string]: number } = {}
  orders.forEach((order) => {
    if (order.paidAt) {
      const date = order.paidAt.toISOString().split("T")[0]
      dailyRevenue[date] = (dailyRevenue[date] || 0) + Number(order.total)
    }
  })

  const revenueByDay = Object.entries(dailyRevenue)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <Link
              href="/admin"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Period</h3>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "7", label: "Last 7 Days" },
              { value: "30", label: "Last 30 Days" },
              { value: "90", label: "Last 90 Days" },
              { value: "365", label: "Last Year" },
              { value: "all", label: "All Time" },
            ].map((option) => (
              <Link
                key={option.value}
                href={`/admin/reports?period=${option.value}`}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === option.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Download Reports Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Download Reports
          </h3>
          <DownloadReportButton />
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">{orders.length} orders</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
            <p className="text-3xl font-bold text-gray-900">
              ${averageOrderValue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Total Discounts</p>
            <p className="text-3xl font-bold text-red-600">
              ${totalDiscounts.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Promo Usage</p>
            <p className="text-3xl font-bold text-blue-600">
              {promoCodeUsageRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {promoCodeOrders} of {orders.length} orders
            </p>
          </div>
        </div>

        {/* User & Enrollment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">New Users</p>
            <p className="text-3xl font-bold text-gray-900">{newUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">New Enrollments</p>
            <p className="text-3xl font-bold text-gray-900">{enrollments}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">Certificates Issued</p>
            <p className="text-3xl font-bold text-gray-900">{certificatesIssued}</p>
          </div>
        </div>

        {/* Quiz Performance */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quiz Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Attempts</p>
              <p className="text-3xl font-bold text-gray-900">{quizAttempts}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Passed</p>
              <p className="text-3xl font-bold text-green-600">{passedAttempts}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pass Rate</p>
              <p className="text-3xl font-bold text-blue-600">
                {passRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Daily Revenue Chart (Simple Table) */}
        {revenueByDay.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Daily Revenue
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueByDay.slice(-14).map((day) => (
                    <tr key={day.date}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(day.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${day.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Promo Codes */}
        {topPromoCodes.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Promo Codes
            </h3>
            <div className="space-y-3">
              {topPromoCodes.map((code) => (
                <div
                  key={code.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-mono font-semibold text-gray-900">
                      {code.code}
                    </p>
                    <p className="text-sm text-gray-500">
                      {code.discountType === "PERCENTAGE"
                        ? `${code.discountValue}%`
                        : `$${code.discountValue}`}{" "}
                      discount
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {code.usedCount}
                    </p>
                    <p className="text-sm text-gray-500">uses</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}