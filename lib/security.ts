"use server"

import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { UAParser } from "ua-parser-js"

/**
 * Record a login attempt in the login history
 */
export async function recordLoginAttempt(
  userId: string,
  success: boolean,
  reason?: string
) {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for") || "0.0.0.0"
    const userAgent = headersList.get("user-agent") || ""
    
    // Parse device info from user agent
    const parser = new UAParser(userAgent)
    const result = parser.getResult()
    const device = `${result.browser.name || "Unknown"} on ${result.os.name || "Unknown"}`

    await prisma.loginHistory.create({
      data: {
        userId,
        ipAddress: ipAddress.split(",")[0].trim(),
        device,
        userAgent,
        success,
        reason: reason || undefined,
      },
    })

    if (success) {
      // Update last login info
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress.split(",")[0].trim(),
          lastLoginDevice: device,
          loginAttempts: 0,
          lockedUntil: null,
        },
      })
    }
  } catch (error) {
    console.error("Failed to record login attempt:", error)
  }
}

/**
 * Record failed login attempt and check for brute force
 */
export async function recordFailedLogin(
  email: string,
  reason: string
) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, loginAttempts: true },
    })

    if (!user) return

    const newAttempts = (user.loginAttempts || 0) + 1
    const lockThreshold = 5
    const lockDurationMinutes = 15

    let lockUntil = null
    if (newAttempts >= lockThreshold) {
      lockUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: newAttempts,
        lockedUntil: lockUntil,
      },
    })

    await recordLoginAttempt(user.id, false, reason)
  } catch (error) {
    console.error("Failed to record failed login:", error)
  }
}

/**
 * Check if user account is locked due to too many failed attempts
 */
export async function checkAccountLock(email: string): Promise<{ locked: boolean; remainingMinutes?: number }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { lockedUntil: true },
    })

    if (!user || !user.lockedUntil) {
      return { locked: false }
    }

    const now = new Date()
    if (user.lockedUntil > now) {
      const remainingTime = user.lockedUntil.getTime() - now.getTime()
      const remainingMinutes = Math.ceil(remainingTime / (60 * 1000))
      return { locked: true, remainingMinutes }
    }

    // Lock has expired, reset login attempts
    await prisma.user.update({
      where: { email },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
      },
    })

    return { locked: false }
  } catch (error) {
    console.error("Failed to check account lock:", error)
    return { locked: false }
  }
}

/**
 * Create a new active session
 */
export async function createSession(
  userId: string,
  expiryDays: number = 30
) {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for") || "0.0.0.0"
    const userAgent = headersList.get("user-agent") || ""
    
    // Parse device info
    const parser = new UAParser(userAgent)
    const result = parser.getResult()
    const device = `${result.browser.name || "Unknown"} on ${result.os.name || "Unknown"}`

    // Generate a simple session token
    const token = `session_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)

    const session = await prisma.activeSession.create({
      data: {
        userId,
        token,
        ipAddress: ipAddress.split(",")[0].trim(),
        device,
        userAgent,
        expiresAt,
      },
    })

    return session
  } catch (error) {
    console.error("Failed to create session:", error)
    return null
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions() {
  try {
    const result = await prisma.activeSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    console.log(`Cleaned up ${result.count} expired sessions`)
  } catch (error) {
    console.error("Failed to cleanup expired sessions:", error)
  }
}

/**
 * Record an audit log entry for user actions
 */
export async function recordAuditLog(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, any>,
  status: "success" | "failure" = "success"
) {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for") || "0.0.0.0"

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details: details ? JSON.stringify(details) : undefined,
        status,
        ipAddress: ipAddress.split(",")[0].trim(),
      },
    })
  } catch (error) {
    console.error("Failed to record audit log:", error)
  }
}

/**
 * Get recent audit logs for a user
 */
export async function getUserAuditLogs(userId: string, limit: number = 50) {
  try {
    return await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  } catch (error) {
    console.error("Failed to fetch audit logs:", error)
    return []
  }
}
