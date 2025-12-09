import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Image from "next/image"

export default async function DashboardPage() {
  // Get the current user session
  const session = await auth()

  // If not logged in, redirect to login
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            CCW Training Dashboard
          </h1>
          
          {/* Sign Out Button */}
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            {/* Profile Picture */}
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={64}
                height={64}
                className="rounded-full"
              />
            )}
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back, {session.user.name}!
              </h2>
              <p className="text-gray-600">{session.user.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Role: <span className="font-medium">{session.user.role}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Course Access Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Your Courses
          </h3>
          
          {/* Placeholder */}
          <div className="text-center py-12 text-gray-500">
            <p className="mt-4 text-lg">No courses enrolled yet</p>
            <p className="mt-2">
              Purchase the CCW Training Course to get started
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}