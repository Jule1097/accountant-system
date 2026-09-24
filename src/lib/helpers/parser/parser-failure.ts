import { parserFailureMessages } from "src/lib/constants/parser";
import { ParserFailureReason } from "src/types/parser/parser-batch";

export type ParserFailureStage = "download" | "preparation" | "execution" | "response" | "extraction";

export function resolveParserFailureReason(stage: ParserFailureStage, error: unknown): ParserFailureReason {
  if (stage === "download") {
    return "preparation_failed";
  }

  if (stage === "extraction") {
    return "insufficient_extraction";
  }

  if (error instanceof Error && /failed to parse invoice|empty response/i.test(error.message)) {
    return "unreadable_file";
  }

  if (stage === "preparation") {
    return "preparation_failed";
  }

  return "temporary_service";
}

export function resolveParserFailureMessage(reason: ParserFailureReason): string {
  return parserFailureMessages[reason];
}
