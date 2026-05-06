"use server"

import { auth } from "@/auth"
import { Role } from "@prisma/client"

export type RoleType = Role

export const ROLE_HIERARCHY: Record<RoleType, number> = {
  SUPER_ADMIN: 5,
  COMMITTEE_ADMIN: 4,
  ACCOUNTANT: 3,
  DATA_ENTRY_OPERATOR: 2,
  VIEWER: 1,
}

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

export function hasRole(userRole: string, requiredRoles: RoleType | RoleType[]) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return roles.includes(userRole as RoleType)
}

export function hasMinRole(userRole: string, minRole: RoleType) {
  const userLevel = ROLE_HIERARCHY[userRole as RoleType] || 0
  const minLevel = ROLE_HIERARCHY[minRole]
  return userLevel >= minLevel
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

export const PERMISSIONS = {
  donations: {
    create: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT", "DATA_ENTRY_OPERATOR"],
    read: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT", "DATA_ENTRY_OPERATOR", "VIEWER"],
    edit: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"],
    delete: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
  },
  expenses: {
    create: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT", "DATA_ENTRY_OPERATOR"],
    read: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT", "DATA_ENTRY_OPERATOR", "VIEWER"],
    approve: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
    edit: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"],
    delete: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
  },
  collections: {
    create: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT", "DATA_ENTRY_OPERATOR"],
    read: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT", "DATA_ENTRY_OPERATOR", "VIEWER"],
    deposit: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT", "DATA_ENTRY_OPERATOR"],
    verify: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"],
  },
  bank: {
    create: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
    read: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"],
    edit: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
    transfer: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"],
    reconcile: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"],
  },
  journal: {
    create: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"],
    read: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"],
    edit: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT"],
  },
  members: {
    create: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
    read: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT", "DATA_ENTRY_OPERATOR", "VIEWER"],
    edit: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
    delete: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
  },
  events: {
    create: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
    read: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT", "DATA_ENTRY_OPERATOR", "VIEWER"],
    edit: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
    delete: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
  },
  reports: {
    read: ["SUPER_ADMIN", "COMMITTEE_ADMIN", "ACCOUNTANT", "DATA_ENTRY_OPERATOR", "VIEWER"],
  },
  users: {
    create: ["SUPER_ADMIN"],
    read: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
    edit: ["SUPER_ADMIN"],
    delete: ["SUPER_ADMIN"],
  },
  settings: {
    read: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
    edit: ["SUPER_ADMIN", "COMMITTEE_ADMIN"],
  },
} as const

export async function hasPermission(module: keyof typeof PERMISSIONS, action: string) {
  const user = await getCurrentUser()
  if (!user) return false
  const modulePerms = PERMISSIONS[module] as any
  const allowedRoles = modulePerms?.[action]
  if (!allowedRoles) return false
  return hasRole(user.role, allowedRoles)
}

export async function requirePermission(module: keyof typeof PERMISSIONS, action: string) {
  const user = await requireAuth()
  const modulePerms = PERMISSIONS[module] as any
  const allowedRoles = modulePerms?.[action]
  if (!allowedRoles || !hasRole(user.role, allowedRoles)) {
    throw new Error("Insufficient permissions")
  }
  return user
}
