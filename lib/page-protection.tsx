"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect } from "react"
import { hasRole, type RoleType } from "@/lib/roles"

export function useRequireAuth() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login")
    }
  }, [status])

  return { session, status }
}

export function useRequireRole(requiredRoles: RoleType | RoleType[]) {
  const { session, status } = useRequireAuth()

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
      const hasAccess = hasRole(session.user.role, roles)
      if (!hasAccess) {
        redirect("/dashboard")
      }
    }
  }, [status, session, requiredRoles])

  return { session, status }
}

export function useHasRole(requiredRoles: RoleType | RoleType[]) {
  const { data: session } = useSession()
  if (!session?.user?.role) return false
  return hasRole(session.user.role, requiredRoles)
}
