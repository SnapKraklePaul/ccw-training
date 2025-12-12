import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { PDFDocument, rgb, StandardFonts, PDFPage } from "pdf-lib"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Must be admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const reportType = searchParams.get("reportType") || "revenue"
    const periodType = searchParams.get("periodType") || "daily"
    const format = searchParams.get("format") || "csv"
    const startDate = new Date(searchParams.get("startDate") || "")
    const endDate = new Date(searchParams.get("endDate") || "")

    if (format === "pdf") {
  const pdfBytes = await generatePDFReport(reportType, startDate, endDate)
  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${reportType}-report.pdf"`,
    },
  })
}

    // Default: CSV
    let csvData = ""

    switch (reportType) {
      case "revenue":
        csvData = await generateRevenueReport(startDate, endDate, periodType)
        break
      case "orders":
        csvData = await generateOrdersReport(startDate, endDate)
        break
      case "users":
        csvData = await generateUsersReport(startDate, endDate)
        break
      case "enrollments":
        csvData = await generateEnrollmentsReport(startDate, endDate)
        break
      case "certificates":
        csvData = await generateCertificatesReport(startDate, endDate)
        break
      case "quiz":
        csvData = await generateQuizReport(startDate, endDate)
        break
      default:
        csvData = "Invalid report type"
    }

    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${reportType}-report.csv"`,
      },
    })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}

// PDF Generation with pdf-lib
async function generatePDFReport(
  reportType: string,
  startDate: Date,
  endDate: Date
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

  let page = pdfDoc.addPage([612, 792]) // Letter size
  const { height } = page.getSize()
  let yPosition = height - 50

  // Helper function to add text
  const addText = (text: string, fontSize: number, isBold = false) => {
    if (yPosition < 50) {
      page = pdfDoc.addPage([612, 792])
      yPosition = height - 50
    }
    page.drawText(text, {
      x: 50,
      y: yPosition,
      size: fontSize,
      font: isBold ? timesRomanBoldFont : timesRomanFont,
      color: rgb(0, 0, 0),
    })
    yPosition -= fontSize + 5
  }

  // Header
  addText("CCW Training Platform", 20, true)
  addText(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 16, true)
  addText(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 10)
  yPosition -= 10

  // Generate content based on report type
  switch (reportType) {
    case "revenue":
      await addRevenueContentToPDF(addText, startDate, endDate)
      break
    case "orders":
      await addOrdersContentToPDF(addText, startDate, endDate)
      break
    case "users":
      await addUsersContentToPDF(addText, startDate, endDate)
      break
    case "enrollments":
      await addEnrollmentsContentToPDF(addText, startDate, endDate)
      break
    case "certificates":
      await addCertificatesContentToPDF(addText, startDate, endDate)
      break
    case "quiz":
      await addQuizContentToPDF(addText, startDate, endDate)
      break
  }

  // Footer
  const pages = pdfDoc.getPages()
  pages.forEach((p: PDFPage) => {
    p.drawText(`Generated on ${new Date().toLocaleString()}`, {
      x: 50,
      y: 30,
      size: 8,
      font: timesRomanFont,
      color: rgb(0.5, 0.5, 0.5),
    })
  })

  return await pdfDoc.save()
}

async function addRevenueContentToPDF(
  addText: (text: string, size: number, bold?: boolean) => void,
  startDate: Date,
  endDate: Date
) {
  const orders = await prisma.order.findMany({
    where: {
      status: "COMPLETED",
      paidAt: { gte: startDate, lte: endDate },
    },
  })

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0)
  const totalDiscounts = orders.reduce((sum, order) => sum + Number(order.discount), 0)
  const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0

  addText("Revenue Summary", 12, true)
  addText(`Total Orders: ${orders.length}`, 10)
  addText(`Total Revenue: $${totalRevenue.toFixed(2)}`, 10)
  addText(`Total Discounts: $${totalDiscounts.toFixed(2)}`, 10)
  addText(`Average Order Value: $${avgOrder.toFixed(2)}`, 10)
}

async function addOrdersContentToPDF(
  addText: (text: string, size: number, bold?: boolean) => void,
  startDate: Date,
  endDate: Date
) {
  const orders = await prisma.order.findMany({
    where: { paidAt: { gte: startDate, lte: endDate } },
    include: { user: true },
    take: 30,
    orderBy: { paidAt: "desc" },
  })

  addText(`Orders (Showing ${Math.min(orders.length, 30)} most recent)`, 12, true)
  
  orders.forEach((order) => {
    addText(
      `${order.orderNumber} | ${order.user.name} | ${order.status} | $${order.total} | ${order.paidAt?.toLocaleDateString()}`,
      8
    )
  })
}

async function addUsersContentToPDF(
  addText: (text: string, size: number, bold?: boolean) => void,
  startDate: Date,
  endDate: Date
) {
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    take: 50,
    orderBy: { createdAt: "desc" },
  })

  addText(`New Users (${users.length})`, 12, true)
  
  users.forEach((user) => {
    addText(
      `${user.name} | ${user.email} | ${user.role} | ${user.createdAt.toLocaleDateString()}`,
      8
    )
  })
}

async function addEnrollmentsContentToPDF(
  addText: (text: string, size: number, bold?: boolean) => void,
  startDate: Date,
  endDate: Date
) {
  const enrollments = await prisma.enrollment.findMany({
    where: { enrolledAt: { gte: startDate, lte: endDate } },
    include: { user: true, course: true },
    take: 50,
    orderBy: { enrolledAt: "desc" },
  })

  addText(`Enrollments (${enrollments.length})`, 12, true)
  
  enrollments.forEach((enrollment) => {
    addText(
      `${enrollment.user.name} | ${enrollment.course.title} | ${enrollment.enrolledAt.toLocaleDateString()}`,
      8
    )
  })
}

async function addCertificatesContentToPDF(
  addText: (text: string, size: number, bold?: boolean) => void,
  startDate: Date,
  endDate: Date
) {
  const certificates = await prisma.certificate.findMany({
    where: { issuedAt: { gte: startDate, lte: endDate } },
    include: { user: true },
    take: 50,
    orderBy: { issuedAt: "desc" },
  })

  addText(`Certificates Issued (${certificates.length})`, 12, true)
  
  certificates.forEach((cert) => {
    addText(
      `${cert.certificateNumber} | ${cert.fullName} | Score: ${cert.score}% | ${cert.issuedAt.toLocaleDateString()}`,
      8
    )
  })
}

async function addQuizContentToPDF(
  addText: (text: string, size: number, bold?: boolean) => void,
  startDate: Date,
  endDate: Date
) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { startedAt: { gte: startDate, lte: endDate } },
    include: { user: true },
  })

  const passed = attempts.filter((a) => a.passed).length
  const passRate = attempts.length > 0 ? (passed / attempts.length) * 100 : 0

  addText("Quiz Performance Summary", 12, true)
  addText(`Total Attempts: ${attempts.length}`, 10)
  addText(`Passed: ${passed}`, 10)
  addText(`Pass Rate: ${passRate.toFixed(1)}%`, 10)
}

// CSV Generation Functions
async function generateRevenueReport(
  startDate: Date,
  endDate: Date,
  periodType: string
) {
  const orders = await prisma.order.findMany({
    where: {
      status: "COMPLETED",
      paidAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { paidAt: "asc" },
  })

  let csv = "Period,Revenue,Orders,Avg Order Value,Discounts\n"

  const grouped: { [key: string]: { revenue: number; count: number; discounts: number } } = {}

  orders.forEach((order) => {
    if (order.paidAt) {
      let period = ""
      const date = new Date(order.paidAt)

      switch (periodType) {
        case "daily":
          period = date.toISOString().split("T")[0]
          break
        case "weekly":
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          period = weekStart.toISOString().split("T")[0]
          break
        case "monthly":
          period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          break
        case "yearly":
          period = String(date.getFullYear())
          break
      }

      if (!grouped[period]) {
        grouped[period] = { revenue: 0, count: 0, discounts: 0 }
      }

      grouped[period].revenue += Number(order.total)
      grouped[period].count++
      grouped[period].discounts += Number(order.discount)
    }
  })

  Object.entries(grouped)
    .sort()
    .forEach(([period, data]) => {
      const avgOrderValue = data.revenue / data.count
      csv += `${period},${data.revenue.toFixed(2)},${data.count},${avgOrderValue.toFixed(2)},${data.discounts.toFixed(2)}\n`
    })

  return csv
}

async function generateOrdersReport(startDate: Date, endDate: Date) {
  const orders = await prisma.order.findMany({
    where: {
      paidAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: true,
      promoCode: true,
    },
    orderBy: { paidAt: "desc" },
  })

  let csv = "Order Number,Date,Customer Name,Customer Email,Status,Subtotal,Discount,Total,Promo Code\n"

  orders.forEach((order) => {
    csv += `${order.orderNumber},${order.paidAt?.toISOString()},${order.user.name},${order.user.email},${order.status},${order.subtotal},${order.discount},${order.total},${order.promoCode?.code || ""}\n`
  })

  return csv
}

async function generateUsersReport(startDate: Date, endDate: Date) {
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  let csv = "Name,Email,Role,Status,Email Verified,Auth Provider,Created At\n"

  users.forEach((user) => {
    csv += `${user.name},${user.email},${user.role},${user.isActive ? "Active" : "Suspended"},${user.emailVerified ? "Yes" : "No"},${user.authProvider},${user.createdAt.toISOString()}\n`
  })

  return csv
}

async function generateEnrollmentsReport(startDate: Date, endDate: Date) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      enrolledAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: true,
      course: true,
    },
    orderBy: { enrolledAt: "desc" },
  })

  let csv = "Date,User Name,User Email,Course,Granted By\n"

  enrollments.forEach((enrollment) => {
    csv += `${enrollment.enrolledAt.toISOString()},${enrollment.user.name},${enrollment.user.email},${enrollment.course.title},${enrollment.grantedBy}\n`
  })

  return csv
}

async function generateCertificatesReport(startDate: Date, endDate: Date) {
  const certificates = await prisma.certificate.findMany({
    where: {
      issuedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: true,
    },
    orderBy: { issuedAt: "desc" },
  })

  let csv = "Certificate Number,Issued Date,Holder Name,Email,Course,Score,Status\n"

  certificates.forEach((cert) => {
    csv += `${cert.certificateNumber},${cert.issuedAt.toISOString()},${cert.fullName},${cert.user.email},${cert.courseName},${cert.score},${cert.status}\n`
  })

  return csv
}

async function generateQuizReport(startDate: Date, endDate: Date) {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      startedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: true,
      quiz: {
        include: {
          course: true,
        },
      },
    },
    orderBy: { startedAt: "desc" },
  })

  let csv = "Date,User Name,User Email,Course,Attempt Number,Score,Passed,Total Questions,Correct Answers\n"

  attempts.forEach((attempt) => {
    csv += `${attempt.startedAt.toISOString()},${attempt.user.name},${attempt.user.email},${attempt.quiz.course.title},${attempt.attemptNumber},${attempt.score},${attempt.passed ? "Yes" : "No"},${attempt.totalQuestions},${attempt.correctAnswers}\n`
  })

  return csv
}