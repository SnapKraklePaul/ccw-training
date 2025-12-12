import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Must be admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { certificateId, reason } = await request.json()

    // Revoke certificate
    await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedReason: reason,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error revoking certificate:", error)
    return NextResponse.json(
      { error: "Failed to revoke certificate" },
      { status: 500 }
    )
  }
}