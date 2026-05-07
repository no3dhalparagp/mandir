"use server"

import { auth } from "@/auth"
import { hasRole, hasMinRole, type RoleType } from "@/lib/roles"
import { PERMISSIONS } from "@/lib/permissions"

/**
 * Gets the current session user.
 */
export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

/**
 * Ensures the user is authenticated. Throws an error otherwise.
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required. Please log in to continue.")
  }
  return user
}

/**
 * Ensures the user has one of the required roles.
 */
export async function requireRole(requiredRoles: RoleType | RoleType[]) {
  const user = await requireAuth()
  if (!hasRole(user.role, requiredRoles)) {
    throw new Error(`Access denied. This action requires one of the following roles: ${Array.isArray(requiredRoles) ? requiredRoles.join(", ") : requiredRoles}.`)
  }
  return user
}

/**
 * Ensures the user has at least the minimum required role.
 */
export async function requireMinRole(minRole: RoleType) {
  const user = await requireAuth()
  if (!hasMinRole(user.role, minRole)) {
    throw new Error(`Access denied. This action requires at least a ${minRole} role.`)
  }
  return user
}

/**
 * Checks if the current user has one of the required roles (returns boolean).
 */
export async function checkRole(requiredRoles: RoleType | RoleType[]) {
  const user = await getCurrentUser()
  if (!user) return false
  return hasRole(user.role, requiredRoles)
}

/**
 * Checks if the current user has at least the minimum required role (returns boolean).
 */
export async function checkMinRole(minRole: RoleType) {
  const user = await getCurrentUser()
  if (!user) return false
  return hasMinRole(user.role, minRole)
}

type PermissionModule = keyof typeof PERMISSIONS
type PermissionAction = string

/**
 * Checks if the current user has permission for a specific module and action.
 */
export async function hasPermission(module: PermissionModule, action: PermissionAction) {
  const user = await getCurrentUser()
  if (!user) return false
  const modulePerms = PERMISSIONS[module]
  const allowedRoles = (modulePerms as any)[action]
  if (!allowedRoles) return false
  return hasRole(user.role, [...allowedRoles])
}

/**
 * Ensures the user has permission for a specific module and action. Throws an error otherwise.
 */
export async function requirePermission(module: PermissionModule, action: PermissionAction) {
  const user = await requireAuth()
  const modulePerms = PERMISSIONS[module]
  const allowedRoles = (modulePerms as any)[action]
  
  if (!allowedRoles || !hasRole(user.role, [...allowedRoles])) {
    throw new Error(`Access denied. You do not have permission to ${action} in the ${module} module.`)
  }
  return user
}
