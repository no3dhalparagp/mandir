import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { renderToStream } from "@react-pdf/renderer"
import { ReceiptDocument } from "@/components/receipt-pdf"
import QRCode from "qrcode"
import { format } from "date-fns"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const donation = await prisma.donation.findUnique({
      where: { id },
    })

    if (!donation) {
      return new NextResponse("Donation not found", { status: 404 })
    }

    // Generate QR Code containing verification data
    const verificationData = JSON.stringify({
      receiptNo: donation.receiptNo,
      amount: donation.amount,
      date: donation.date.toISOString(),
    })
    const qrCodeDataUrl = await QRCode.toDataURL(verificationData)

    const data = {
      receiptNo: donation.receiptNo,
      date: format(donation.date, "dd MMM yyyy"),
      donorName: donation.donorName,
      amount: donation.amount,
      category: donation.category,
      paymentMode: donation.paymentMode,
      qrCodeDataUrl,
    }

    const stream = await renderToStream(<ReceiptDocument data={data} />)

    // Convert NodeJS ReadableStream to Web ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk))
        stream.on("end", () => controller.close())
        stream.on("error", (err) => controller.error(err))
      },
    })

    return new NextResponse(readableStream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${donation.receiptNo}.pdf"`,
      },
    })
  } catch (error) {
    console.error("PDF Generation Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
