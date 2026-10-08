import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { apiResponseMessages } from "src/lib/constants/api-response"
import { httpStatusCodes } from "src/lib/constants/http"

function isPublicValidationMessage(message: string): boolean {
  return !message.startsWith("Invalid input") && !message.startsWith("Invalid option")
}

export function resolveZodValidationResponse(error: ZodError): NextResponse {
  const message = error.issues.find((issue) => isPublicValidationMessage(issue.message))?.message ?? apiResponseMessages.common.invalidData
  return NextResponse.json({ error: message, details: error.format() }, { status: httpStatusCodes.badRequest })
}
