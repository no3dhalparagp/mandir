"use server"

import { auth } from "@/auth"
import { hasRole, hasMinRole, type RoleType } from "@/lib/roles"
import { PERMISSIONS } from "@/lib/permissions"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireRole(requiredRoles: RoleType | RoleType[]) {
  const user = await requireAuth()
  if (!hasRole(user.role, requiredRoles)) {
    throw new Error("Insufficient permissions")
  }
  return user
}

export async function requireMinRole(minRole: RoleType) {
  const user = await requireAuth()
  if (!hasMinRole(user.role, minRole)) {
    throw new Error("Insufficient permissions")
  }
  return user
}

export async function checkRole(requiredRoles: RoleType | RoleType[]) {
  const user = await getCurrentUser()
  if (!user) return false
  return hasRole(user.role, requiredRoles)
}

export async function checkMinRole(minRole: RoleType) {
  const user = await getCurrentUser()
  if (!user) return false
  return hasMinRole(user.role, minRole)
}

type PermissionModule = keyof typeof PERMISSIONS
type PermissionAction = string

export async function hasPermission(module: PermissionModule, action: PermissionAction) {
  const user = await getCurrentUser()
  if (!user) return false
  const modulePerms = PERMISSIONS[module]
  const allowedRoles = modulePerms[action as keyof typeof modulePerms]
  if (!allowedRoles) return false
  // ✅ convert readonly array to mutable
  return hasRole(user.role, [...allowedRoles])
}

export async function requirePermission(module: PermissionModule, action: PermissionAction) {
  const user = await requireAuth()
  const modulePerms = PERMISSIONS[module]
  const allowedRoles = modulePerms[action as keyof typeof modulePerms]
  if (!allowedRoles || !hasRole(user.role, [...allowedRoles])) {
    throw new Error("Insufficient permissions")
  }
  return user
}
