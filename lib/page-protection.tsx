"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect } from "react"
import type { Role } from "@prisma/client"

export function useRequireAuth() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login")
    }
  }, [status])

  return { session, status }
}

export function useRequireRole(requiredRoles: Role | Role[]) {
  const { session, status } = useRequireAuth()
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const hasAccess = roles.includes(session.user.role as Role)
      if (!hasAccess) {
        redirect("/dashboard")
      }
    }
  }, [status, session, roles])

  return { session, status }
}

export function useHasRole(requiredRoles: Role | Role[]) {
  const { data: session } = useSession()
  if (!session?.user?.role) return false
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return roles.includes(session.user.role as Role)
}
