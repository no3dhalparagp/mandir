import * as z from "zod"

/**
 * Voucher Validation Schemas
 */
export const voucherCreateSchema = z.object({
  voucherType: z.enum(["CASH_ENTRY", "PAYMENT", "COLLECTION", "JOURNAL", "BANK_TRANSFER"], {
    errorMap: () => ({ message: "Invalid voucher type" }),
  }),
  voucherDate: z.string().datetime("Invalid date format"),
  description: z.string().min(1, "Description is required").max(500),
  partyName: z.string().optional(),
  totalAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number",
  }),
  paymentMode: z.enum(["CASH", "CHECK", "BANK_TRANSFER", "ONLINE"]).default("CASH"),
  chequeNumber: z.string().optional(),
  chequeDate: z.string().datetime().optional(),
  bankName: z.string().optional(),
  accountId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  lineItems: z.array(
    z.object({
      accountId: z.string().min(1, "Account is required"),
      entryType: z.enum(["DEBIT", "CREDIT"]),
      amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Line item amount must be positive",
      }),
      description: z.string().optional(),
    })
  ).min(2, "At least 2 line items required (debit and credit)"),
})

/**
 * Devotee Validation Schemas
 */
export const devoteeCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits").optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "LIFETIME"]).default("ACTIVE"),
  dateOfBirth: z.string().datetime().optional(),
  anniversary: z.string().datetime().optional(),
  familyMembers: z.number().int().min(1).default(1),
  devotionType: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

/**
 * Puja Request Validation Schemas
 */
export const pujaRequestCreateSchema = z.object({
  devoteeId: z.string().min(1, "Devotee is required"),
  pujaType: z.enum([
    "DAILY",
    "WEEKLY",
    "FESTIVAL",
    "CUSTOM",
    "MARRIAGE",
    "DEATH_RITUAL",
    "YAGNA",
  ], {
    errorMap: () => ({ message: "Invalid puja type" }),
  }),
  deityName: z.string().optional(),
  requestedDate: z.string().datetime("Invalid date"),
  numberOfPeople: z.number().int().min(1).default(1),
  estimatedCost: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Cost must be a valid number",
  }).optional(),
  description: z.string().max(1000).optional(),
  specialRequests: z.string().max(1000).optional(),
})

/**
 * Mandir Donation Validation Schemas
 */
export const donationCreateSchema = z.object({
  devoteeId: z.string().optional(),
  donationType: z.enum(["CASH", "CHECK", "BANK_TRANSFER", "ONLINE", "KIND"], {
    errorMap: () => ({ message: "Invalid donation type" }),
  }),
  purpose: z.enum([
    "GENERAL",
    "MAINTENANCE",
    "DEITY",
    "PUJA",
    "PRASAD",
    "CHARITY",
    "EDUCATION",
    "MEDICAL",
    "SPECIAL_CAUSE",
  ], {
    errorMap: () => ({ message: "Invalid purpose" }),
  }),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number",
  }),
  donationDate: z.string().datetime("Invalid date"),
  chequeNumber: z.string().optional(),
  chequeDate: z.string().datetime().optional(),
  bankName: z.string().optional(),
  itemDescription: z.string().optional(),
  itemQuantity: z.string().optional(),
  itemUnit: z.string().optional(),
  donorName: z.string().optional(),
  donorPhone: z.string().optional(),
  donorEmail: z.string().email().optional(),
  notes: z.string().max(1000).optional(),
})

/**
 * Staff Validation Schemas
 */
export const staffDetailSchema = z.object({
  designation: z.string().min(1, "Designation is required"),
  department: z.string().optional(),
  employeeCode: z.string().min(1, "Employee code is required"),
  dateOfJoining: z.string().datetime().optional(),
  dateOfBirth: z.string().datetime().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code").optional(),
  accountHolderName: z.string().optional(),
  personalMobile: z.string().regex(/^\d{10}$/, "Invalid mobile number").optional(),
  panCard: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN").optional(),
  salary: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Salary must be positive",
  }).optional(),
  notes: z.string().max(1000).optional(),
})

/**
 * Party Ledger Validation Schemas
 */
export const partyCreateSchema = z.object({
  partyName: z.string().min(2, "Party name required").max(100),
  partyType: z.enum(["VENDOR", "CUSTOMER", "MEMBER", "PARTY"]),
  partyCode: z.string().min(1, "Party code required").max(20),
  email: z.string().email().optional(),
  mobile: z.string().regex(/^\d{10}$/, "Invalid mobile").optional(),
  address: z.string().max(500).optional(),
  paymentTerms: z.string().optional(),
  openingBalance: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Invalid amount",
  }).default("0"),
  notes: z.string().max(1000).optional(),
})

/**
 * Error Response Type
 */
export interface ApiErrorResponse {
  error: string
  code: string
  details?: Record<string, string[]>
  timestamp: string
}

/**
 * Success Response Type
 */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
  timestamp: string
}

/**
 * Validation error formatter
 */
export function formatValidationErrors(errors: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  errors.errors.forEach((error) => {
    const path = error.path.join(".")
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(error.message)
  })
  return formatted
}
