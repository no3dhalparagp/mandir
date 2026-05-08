import { NextResponse } from "next/server"
import { ApiErrorResponse, ApiSuccessResponse } from "./validation-schemas"

/**
 * API Response Utilities
 * Standardized response formatting for all API routes
 */

export class ApiResponse {
  /**
   * Success response
   */
  static success<T>(data: T, message?: string, statusCode = 200) {
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: statusCode })
  }

  /**
   * Created response (201)
   */
  static created<T>(data: T, message?: string) {
    return this.success(data, message || "Resource created successfully", 201)
  }

  /**
   * Validation error response
   */
  static validationError(errors: Record<string, string[]>, message = "Validation failed") {
    const response: ApiErrorResponse = {
      error: message,
      code: "VALIDATION_ERROR",
      details: errors,
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: 400 })
  }

  /**
   * Bad request response
   */
  static badRequest(message: string, details?: Record<string, string[]>) {
    const response: ApiErrorResponse = {
      error: message,
      code: "BAD_REQUEST",
      details,
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: 400 })
  }

  /**
   * Unauthorized response
   */
  static unauthorized(message = "Unauthorized access") {
    const response: ApiErrorResponse = {
      error: message,
      code: "UNAUTHORIZED",
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: 401 })
  }

  /**
   * Forbidden response
   */
  static forbidden(message = "Access forbidden") {
    const response: ApiErrorResponse = {
      error: message,
      code: "FORBIDDEN",
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: 403 })
  }

  /**
   * Not found response
   */
  static notFound(resource: string) {
    const response: ApiErrorResponse = {
      error: `${resource} not found`,
      code: "NOT_FOUND",
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: 404 })
  }

  /**
   * Conflict response
   */
  static conflict(message: string) {
    const response: ApiErrorResponse = {
      error: message,
      code: "CONFLICT",
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: 409 })
  }

  /**
   * Internal server error response
   */
  static internalError(message = "Internal server error", details?: any) {
    console.error("[v0] API Error:", details)
    const response: ApiErrorResponse = {
      error: message,
      code: "INTERNAL_SERVER_ERROR",
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: 500 })
  }

  /**
   * Service unavailable response
   */
  static serviceUnavailable(message = "Service temporarily unavailable") {
    const response: ApiErrorResponse = {
      error: message,
      code: "SERVICE_UNAVAILABLE",
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: 503 })
  }
}

/**
 * Catch-all error handler for API routes
 */
export function handleApiError(error: any) {
  if (error instanceof SyntaxError) {
    return ApiResponse.badRequest("Invalid request format")
  }

  if (error.message?.includes("Unique constraint failed")) {
    return ApiResponse.conflict("Resource with this data already exists")
  }

  if (error.message?.includes("not found")) {
    return ApiResponse.notFound("Resource")
  }

  console.error("[v0] Unhandled API error:", error)
  return ApiResponse.internalError("An unexpected error occurred")
}

/**
 * Wrapper for async API handlers with error handling
 */
export function withErrorHandling(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
