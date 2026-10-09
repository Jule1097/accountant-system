import { apiResponseMessages } from "src/lib/constants/api-response"
import { parserFileValidationMessages } from "src/lib/constants/parser"

export function resolveParserUploadInitializationValidationMessage(message: string | undefined): string {
  return message === parserFileValidationMessages.maxFilesExceeded ? message : apiResponseMessages.common.invalidRequestBody
}
