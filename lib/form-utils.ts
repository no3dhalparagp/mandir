import { toast } from "sonner"

/**
 * Form Utilities for enhanced user feedback
 */

export interface FormSubmitOptions {
  successMessage?: string
  errorMessage?: string
  redirectTo?: string
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

/**
 * Handle form submission with standardized feedback
 */
export async function handleFormSubmit(
  endpoint: string,
  data: any,
  options: FormSubmitOptions = {}
) {
  const {
    successMessage = "Operation completed successfully",
    errorMessage = "An error occurred",
    redirectTo,
    onSuccess,
    onError,
  } = options

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      const error = result.error || errorMessage
      const details = result.details

      if (details) {
        // Show validation errors as toast
        const firstError = Object.values(details)[0]?.[0] || error
        toast.error(firstError as string)
      } else {
        toast.error(error)
      }

      onError?.(result)
      throw new Error(error)
    }

    toast.success(successMessage)
    onSuccess?.(result.data)

    if (redirectTo) {
      setTimeout(() => {
        window.location.href = redirectTo
      }, 500)
    }

    return result.data
  } catch (error) {
    console.error("[v0] Form submission error:", error)
    throw error
  }
}

/**
 * Format field validation errors
 */
export function getFieldError(errors: Record<string, string[]>, fieldName: string): string | null {
  const fieldErrors = errors[fieldName]
  return fieldErrors?.[0] || null
}

/**
 * Get all validation errors for display
 */
export function getAllValidationErrors(errors: Record<string, string[]>): string[] {
  return Object.values(errors).flat()
}

/**
 * Format currency input
 */
export function formatCurrencyInput(value: string): string {
  const numValue = parseFloat(value.replace(/[^\d.]/g, ""))
  return isNaN(numValue) ? "" : numValue.toFixed(2)
}

/**
 * Parse currency value
 */
export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^\d.]/g, "")) || 0
}

/**
 * Validate amount is balanced (for vouchers)
 */
export function isAmountBalanced(debits: string[], credits: string[]): boolean {
  const debitSum = debits.reduce((sum, val) => sum + parseCurrency(val), 0)
  const creditSum = credits.reduce((sum, val) => sum + parseCurrency(val), 0)
  return Math.abs(debitSum - creditSum) < 0.01
}

/**
 * Format phone number input
 */
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10)
  if (digits.length === 0) return ""
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

/**
 * Validate GST number
 */
export function validateGST(gst: string): boolean {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstRegex.test(gst)
}

/**
 * Validate PAN number
 */
export function validatePAN(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan)
}

/**
 * Validate IFSC code
 */
export function validateIFSC(ifsc: string): boolean {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
  return ifscRegex.test(ifsc)
}

/**
 * Show success toast with standard formatting
 */
export function showSuccessToast(message: string, duration = 3000) {
  toast.success(message, { duration })
}

/**
 * Show error toast with standard formatting
 */
export function showErrorToast(message: string, duration = 4000) {
  toast.error(message, { duration })
}

/**
 * Show loading toast
 */
export function showLoadingToast(message: string) {
  return toast.loading(message)
}

/**
 * Update loading toast to success
 */
export function updateToastSuccess(toastId: string | number, message: string) {
  toast.success(message, { id: toastId as any })
}

/**
 * Update loading toast to error
 */
export function updateToastError(toastId: string | number, message: string) {
  toast.error(message, { id: toastId as any })
}

/**
 * Debounce form validation
 */
export function createDebounce<T extends any[]>(
  fn: (...args: T) => void,
  delay = 300
) {
  let timeoutId: NodeJS.Timeout
  return (...args: T) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Generate unique form ID
 */
export function generateFormId(prefix = "form"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
