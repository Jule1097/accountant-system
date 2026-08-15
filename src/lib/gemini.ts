import { ContentListUnion, GoogleGenAI } from "@google/genai";
import { GeminiParseOptions, RawGeminiParsedVoucher } from "src/types/gemini-parser";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

function buildSharedPromptParts(options: GeminiParseOptions): string[] {
  const promptParts = [
    "Extract accounting data from the invoice document and return JSON only.",
    "Use null for any missing scalar field and [] for any missing list.",
    "Do not guess values that are not visible on the document.",
    "Keep Credit Note amounts as positive values even if the source document shows them as negative.",
    "Extract the other party on the document as thirdPartyCuit and thirdPartyName.",
    "Return voucherType, voucherLetter, posNumber, number, date, currency, subtotal, vatAmount, nonTaxableAmount, exemptAmount, otherTaxesAmount, totalAmount, concept, paymentMethod, status, comments, vatDetails, retentions, and perceptions.",
    "Do not return paymentDate or paidAmount.",
    "vatDetails must contain vatRateName, subtotal, and vatAmount.",
    "retentions and perceptions must contain conceptName, amount, and province when visible.",
    "Keep sales retentions separate from purchase perceptions.",
  ];

  if (options.voucherKind === "sale") {
    promptParts.push(
      "The document is being parsed from the sales workflow. Prioritize sales retentions and leave perceptions empty unless the document clearly shows them as separate data."
    );
  }

  if (options.voucherKind === "purchase") {
    promptParts.push(
      "The document is being parsed from the purchases workflow. Prioritize purchase perceptions and leave retentions empty unless the document clearly shows them as separate data."
    );
  }

  if (options.activeCompanyCuit) {
    promptParts.push(
      `The active company's CUIT is ${options.activeCompanyCuit}. Do not return this CUIT as the thirdPartyCuit.`
    );
  }

  return promptParts;
}

function buildVisualPrompt(options: GeminiParseOptions): string {
  return buildSharedPromptParts(options).join(" ");
}

function buildTextPrompt(options: GeminiParseOptions): string {
  return [
    ...buildSharedPromptParts(options),
    "The source is a markdown transcription extracted from a PDF.",
    "Use only the markdown content as evidence.",
    "If the markdown is ambiguous or incomplete, keep the affected fields as null instead of inferring them.",
  ].join(" ");
}

function getGeminiResponseSchema() {
  return {
    type: "object",
    properties: {
      posNumber: { type: "string" },
      number: { type: "string" },
      date: { type: "string" },
      currency: { type: "string" },
      subtotal: { type: "number" },
      vatAmount: { type: "number" },
      nonTaxableAmount: { type: "number" },
      exemptAmount: { type: "number" },
      otherTaxesAmount: { type: "number" },
      totalAmount: { type: "number" },
      concept: { type: "string" },
      paymentMethod: { type: "string" },
      status: { type: "string" },
      comments: { type: "string" },
      thirdPartyCuit: { type: "string" },
      thirdPartyName: { type: "string" },
      voucherType: { type: "string" },
      voucherLetter: { type: "string" },
      vatDetails: {
        type: "array",
        items: {
          type: "object",
          properties: {
            vatRateName: { type: "string" },
            subtotal: { type: "number" },
            vatAmount: { type: "number" },
          },
        },
      },
      retentions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            conceptName: { type: "string" },
            amount: { type: "number" },
            province: { type: "string" },
          },
        },
      },
      perceptions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            conceptName: { type: "string" },
            amount: { type: "number" },
            province: { type: "string" },
          },
        },
      },
    },
  };
}

async function parseGeminiResponse(contents: ContentListUnion): Promise<RawGeminiParsedVoucher> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: getGeminiResponseSchema(),
    },
  });
  const text = response.text;

  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  try {
    return JSON.parse(text) as RawGeminiParsedVoucher;
  } catch (error: unknown) {
    console.error("Failed to parse Gemini response as JSON:", error);
    throw new Error("Failed to parse invoice");
  }
}

export async function parseInvoiceImage(
  base64Image: string,
  mimeType: string,
  options: GeminiParseOptions = {}
): Promise<RawGeminiParsedVoucher> {
  return parseGeminiResponse([
    {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    },
    buildVisualPrompt(options),
  ]);
}

export async function parseInvoiceMarkdown(
  markdown: string,
  options: GeminiParseOptions = {}
): Promise<RawGeminiParsedVoucher> {
  return parseGeminiResponse([buildTextPrompt(options), markdown]);
}
