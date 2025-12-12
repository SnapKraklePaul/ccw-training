import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"
import Link from "next/link"

const prisma = new PrismaClient()

type OrderItem = {
  id: string
  courseId: string
  orderId: string
  courseName: string
  price: Decimal
  quantity: number
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const session = await auth()
  const { orderId } = await params

  // Must be logged in and admin
  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Get order with all related data
const order = await prisma.order.findUnique({
  where: { id: orderId },
  include: {
    user: true,
    items: true,
    promoCode: true,
  },
})

if (!order) {
  redirect("/admin/orders")
}

// Get enrollment if exists (via userId and items)
const enrollment = order.items.length > 0
  ? await prisma.enrollment.findFirst({
      where: {
        userId: order.userId,
        courseId: order.items[0].courseId,
      },
      include: {
        course: true,
      },
    })
  : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <Link
              href="/admin/orders"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              ← Back to Orders
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Order #{order.orderNumber}
              </h2>
              <p className="text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <span
              className={`px-4 py-2 text-sm font-semibold rounded-full ${
                order.status === "COMPLETED"
                  ? "bg-green-100 text-green-800"
                  : order.status === "PENDING"
                  ? "bg-yellow-100 text-yellow-800"
                  : order.status === "REFUNDED"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {order.status}
            </span>
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Customer Information
              </h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Name:</span> {order.user.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {order.user.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">User ID:</span> {order.user.id}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Payment Information
              </h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Stripe Payment ID:</span>{" "}
                  {order.stripePaymentId || "N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Stripe Session ID:</span>{" "}
                  {order.stripeSessionId || "N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Paid At:</span>{" "}
                  {order.paidAt
                    ? new Date(order.paidAt).toLocaleString()
                    : "Not paid"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Order Items
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items.map((item: OrderItem) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.courseName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${item.price.toString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order Totals */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    ${order.subtotal.toString()}
                  </span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Discount
                      {order.promoCode && (
                        <span className="text-green-600 ml-1">
                          ({order.promoCode.code})
                        </span>
                      )}
                      :
                    </span>
                    <span className="font-medium text-green-600">
                      -${order.discount.toString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">
                    ${order.total.toString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Promo Code Details */}
        {order.promoCode && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Promo Code Used
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Code</p>
                <p className="text-lg font-semibold text-gray-900">
                  {order.promoCode.code}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Discount</p>
                <p className="text-lg font-semibold text-gray-900">
                  {order.promoCode.discountType === "PERCENTAGE"
                    ? `${order.promoCode.discountValue}%`
                    : `$${order.promoCode.discountValue}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enrollment Info */}
        {enrollment && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Enrollment Created
            </h3>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">
                  {enrollment.course.title}
                </p>
                <p className="text-sm text-gray-600">
                  Enrolled on{" "}
                  {new Date(enrollment.enrolledAt).toLocaleDateString()}
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                Active
              </span>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Order Timeline
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="shrink-0 w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">Order Created</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {order.paidAt && (
              <div className="flex gap-4">
                <div className="shrink-0 w-2 h-2 mt-2 bg-green-600 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Payment Completed</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.paidAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            {enrollment && (
              <div className="flex gap-4">
                <div className="shrink-0 w-2 h-2 mt-2 bg-purple-600 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">User Enrolled</p>
                  <p className="text-sm text-gray-500">
                    {new Date(enrollment.enrolledAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}