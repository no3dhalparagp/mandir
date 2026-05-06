import { Role } from "@prisma/client"

export type RoleType = Role

export const ROLE_HIERARCHY: Record<RoleType, number> = {
  SUPER_ADMIN: 5,
  COMMITTEE_ADMIN: 4,
  ACCOUNTANT: 3,
  DATA_ENTRY_OPERATOR: 2,
  VIEWER: 1,
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
