import {
  classifyPdfAsync,
  extractPagesMarkdownAsync,
} from "@firecrawl/pdf-inspector";
import { normalizeParserText } from "src/lib/helpers/parser-text";
import { ParserInputStrategy } from "src/types/parser-batch";

export interface ParserPdfStrategyResult {
  strategy: ParserInputStrategy;
  markdown: string | null;
  pdfType: string;
}

function buildPdfMarkdownValue(markdownPages: { markdown: string }[]): string {
  return markdownPages
    .map((page) => normalizeParserText(page.markdown).trim())
    .filter(Boolean)
    .join("\n\n");
}

export function hasParserMarkdownContent(markdown: string | null): boolean {
  if (!markdown) {
    return false;
  }

  const normalizedMarkdown = markdown.replace(/\s+/g, " ").trim();

  if (normalizedMarkdown.length < 80) {
    return false;
  }

  return /\d/.test(normalizedMarkdown);
}

export async function resolveParserPdfStrategy(buffer: Buffer): Promise<ParserPdfStrategyResult> {
  const classification = await classifyPdfAsync(buffer);

  if (classification.pdfType !== "TextBased") {
    return {
      strategy: "pdf-visual",
      markdown: null,
      pdfType: classification.pdfType,
    };
  }

  try {
    const extraction = await extractPagesMarkdownAsync(buffer);
    const markdown = buildPdfMarkdownValue(extraction.pages);

    if (!hasParserMarkdownContent(markdown)) {
      return {
        strategy: "pdf-visual",
        markdown: null,
        pdfType: classification.pdfType,
      };
    }

    return {
      strategy: "pdf-text",
      markdown,
      pdfType: classification.pdfType,
    };
  } catch {
    return {
      strategy: "pdf-visual",
      markdown: null,
      pdfType: classification.pdfType,
    };
  }
}
