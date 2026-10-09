import { createHmac, timingSafeEqual } from "node:crypto"
import { parserHashAlgorithm } from "src/lib/constants/parser"
import { parserUploadEnvironmentVariables, parserUploadMessages, parserUploadTokenConfiguration } from "src/lib/constants/parser-upload"
import { parserUploadPlanTokenSchema } from "src/lib/schemas/parser/parser-upload-schemas"
import { ApplicationError } from "src/lib/errors/application-error"
import { applicationErrorCodes } from "src/lib/constants/application-error"
import { ParserUploadPlan } from "src/types/parser/parser-upload"

function getPlanSecret(): string {
  const secret = process.env[parserUploadEnvironmentVariables.planSecret]
  if (!secret) throw new Error(`Missing ${parserUploadEnvironmentVariables.planSecret}`)
  return secret
}

function encodePlanPayload(payload: string): string {
  return Buffer.from(payload).toString(parserUploadTokenConfiguration.payloadEncoding)
}

function decodePlanPayload(payload: string): string {
  return Buffer.from(payload, parserUploadTokenConfiguration.payloadEncoding).toString(parserUploadTokenConfiguration.textEncoding)
}

function signPlanPayload(payload: string): string {
  return createHmac(parserHashAlgorithm, getPlanSecret()).update(payload).digest(parserUploadTokenConfiguration.payloadEncoding)
}

function hasValidSignature(payload: string, signature: string): boolean {
  const expectedSignature = Buffer.from(signPlanPayload(payload))
  const receivedSignature = Buffer.from(signature)
  return expectedSignature.length === receivedSignature.length && timingSafeEqual(expectedSignature, receivedSignature)
}

function throwInvalidPlan(): never {
  throw new ApplicationError(applicationErrorCodes.validation, parserUploadMessages.invalidPlan, "Parser upload plan validation failed")
}

function parsePlanPayload(payload: string): ParserUploadPlan {
  try {
    const parsedPayload = parserUploadPlanTokenSchema.safeParse(JSON.parse(decodePlanPayload(payload)))
    if (!parsedPayload.success) throwInvalidPlan()
    return parsedPayload.data
  } catch {
    throwInvalidPlan()
  }
}

export function createParserUploadPlanToken(plan: ParserUploadPlan): string {
  const payload = encodePlanPayload(JSON.stringify(plan))
  return `${payload}${parserUploadTokenConfiguration.partSeparator}${signPlanPayload(payload)}`
}

export function verifyParserUploadPlanToken(token: string, now = Date.now()): ParserUploadPlan {
  const [payload, signature, ...extraParts] = token.split(parserUploadTokenConfiguration.partSeparator)
  if (!payload || !signature || extraParts.length || !hasValidSignature(payload, signature)) throwInvalidPlan()
  const plan = parsePlanPayload(payload)
  if (plan.expiresAt <= now) throwInvalidPlan()
  return plan
}
