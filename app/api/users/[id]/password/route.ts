import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import bcryptjs from "bcryptjs"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    // Users can only change their own password
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match" },
        { status: 400 }
      )
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    // Check for uppercase, lowercase, and number
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json(
        { error: "Password must contain uppercase, lowercase, and numeric characters" },
        { status: 400 }
      )
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const passwordMatch = await bcryptjs.compare(currentPassword, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      )
    }

    // Prevent reusing same password
    const sameAsNew = await bcryptjs.compare(newPassword, user.password)
    if (sameAsNew) {
      return NextResponse.json(
        { error: "New password cannot be the same as current password" },
        { status: 400 }
      )
    }

    // Hash and update password
    const hashedPassword = await bcryptjs.hash(newPassword, 10)
    
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("Failed to change password:", error)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
