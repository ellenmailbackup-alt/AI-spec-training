// Security utilities and validation helpers
import type { Request, Response, NextFunction } from "express";

/**
 * Safely parse an integer parameter with validation
 * @throws Error if parameter is not a valid positive integer
 */
export function parseIdParam(param: string, paramName: string = "id"): number {
  const parsed = parseInt(param, 10);

  if (isNaN(parsed) || parsed < 1) {
    throw new Error(`Invalid ${paramName}: must be a positive integer`);
  }

  return parsed;
}

/**
 * Safely parse a year parameter with range validation
 */
export function parseYearParam(param: string): number {
  const parsed = parseInt(param, 10);

  if (isNaN(parsed) || parsed < 2000 || parsed > 2100) {
    throw new Error("Invalid year: must be between 2000 and 2100");
  }

  return parsed;
}

/**
 * Log security events (authentication failures, authorization denials, etc.)
 */
export function logSecurityEvent(
  event: string,
  req: Request,
  details?: Record<string, any>
) {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.socket.remoteAddress;
  const userAgent = req.get("user-agent");

  console.warn(`[SECURITY] ${timestamp} - ${event}`, {
    ip,
    userAgent,
    path: req.path,
    method: req.method,
    ...details,
  });
}

/**
 * Sanitize error for client response based on environment
 */
export function sanitizeError(error: any, isDevelopment: boolean = false): any {
  if (error instanceof Error) {
    return {
      message: error.message,
      ...(isDevelopment && { stack: error.stack }),
    };
  }
  return { message: String(error) };
}
