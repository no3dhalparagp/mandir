import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Users can view their own sessions, admins can view any
    if (session.user.id !== id && !["SUPER_ADMIN", "COMMITTEE_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get active sessions
    const activeSessions = await prisma.activeSession.findMany({
      where: {
        userId: id,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        ipAddress: true,
        device: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
        lastActivityAt: true,
      },
      orderBy: { lastActivityAt: "desc" },
    })

    return NextResponse.json({
      sessions: activeSessions,
      count: activeSessions.length,
    })
  } catch (error) {
    console.error("Failed to fetch sessions:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { sessionId } = body

    // Users can revoke their own sessions, admins can revoke any
    if (session.user.id !== id && !["SUPER_ADMIN", "COMMITTEE_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    // Verify the session belongs to the user
    const activeSession = await prisma.activeSession.findUnique({
      where: { id: sessionId },
    })

    if (!activeSession || activeSession.userId !== id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Delete the session
    await prisma.activeSession.delete({
      where: { id: sessionId },
    })

    return NextResponse.json({
      message: "Session revoked successfully",
    })
  } catch (error) {
    console.error("Failed to revoke session:", error)
    return NextResponse.json({ error: "Failed to revoke session" }, { status: 500 })
  }
}
