import { type RoleType } from "@/lib/roles"

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
