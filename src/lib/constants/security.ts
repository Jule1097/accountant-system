export const securityHeaders = {
  contentTypeOptions: ["X-Content-Type-Options", "nosniff"],
  frameOptions: ["X-Frame-Options", "DENY"],
  referrerPolicy: ["Referrer-Policy", "strict-origin-when-cross-origin"],
} as const

export const rateLimitWindowMs = 60 * 1000
export const rateLimitWindowSeconds = 60
export const rateLimitMaxRequests = 100
