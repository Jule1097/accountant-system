import { ContentListUnion, GoogleGenAI } from "@google/genai";
import { GeminiParseOptions, GeminiRepairableField, RawGeminiParsedVoucher } from "src/types/gemini-parser";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

function buildSharedPromptParts(options: GeminiParseOptions): string[] {
  const promptParts = [
    "Extract accounting data from the invoice document and return JSON only.",
    "Use null for any missing scalar field and [] for any missing list.",
    "Do not guess values that are not visible on the document.",
    "Keep Credit Note amounts as positive values even if the source document shows them as negative.",
    "Extract the other party on the document as thirdPartyCuit and thirdPartyName.",
    "Return voucherType, voucherLetter, posNumber, number, date, currency, exchangeRate, subtotal, vatAmount, nonTaxableAmount, exemptAmount, otherTaxesAmount, totalAmount, concept, paymentMethod, status, comments, vatDetails, retentions, and perceptions.",
    "Do not return paymentDate or paidAmount.",
    "If the invoice currency is ARS or pesos, return currency as ARS or $ and exchangeRate as 1.",
    "If the invoice currency is foreign, return the exact exchangeRate shown on the document. If it is not visible, return null instead of guessing.",
    "vatDetails must contain vatRateName, subtotal, and vatAmount.",
    "retentions and perceptions must contain conceptName, amount, and province when visible.",
    "Keep sales retentions separate from purchase perceptions.",
    "When returning perception or retention conceptName, prefer normalized accounting labels such as 'Percepción de Ingresos Brutos' or 'Percepción de IVA' instead of abbreviations like 'IIBB' or 'Perc.'.",
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
      exchangeRate: { type: "number" },
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

function buildGeminiSchemaProperties() {
  return getGeminiResponseSchema().properties;
}

function buildRepairPrompt(fields: GeminiRepairableField[], options: GeminiParseOptions): string {
  return [
    "Extract accounting data from the invoice document and return JSON only.",
    `Repair only these fields: ${fields.join(", ")}.`,
    "Return only the requested fields.",
    "Preserve accents, tildes, and special characters exactly as visible on the document.",
    "Do not guess values that are not clearly visible.",
    "Use null for missing scalar fields and [] for missing list fields.",
    ...buildSharedPromptParts(options),
  ].join(" ");
}

function getGeminiRepairResponseSchema(fields: GeminiRepairableField[]) {
  const properties = buildGeminiSchemaProperties();

  return {
    type: "object",
    properties: fields.reduce<Record<string, unknown>>((currentValue, field) => {
      return {
        ...currentValue,
        [field]: properties[field],
      };
    }, {}),
  };
}

async function parseGeminiResponse(contents: ContentListUnion): Promise<RawGeminiParsedVoucher> {
  return parseGeminiResponseWithSchema(contents, getGeminiResponseSchema()) as Promise<RawGeminiParsedVoucher>;
}

async function parseGeminiResponseWithSchema(
  contents: ContentListUnion,
  responseSchema: Record<string, unknown>
): Promise<Partial<RawGeminiParsedVoucher>> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema,
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

export async function parseInvoiceVisualFieldRepair(
  base64Image: string,
  mimeType: string,
  fields: GeminiRepairableField[],
  options: GeminiParseOptions = {}
): Promise<Partial<RawGeminiParsedVoucher>> {
  return parseGeminiResponseWithSchema([
    {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    },
    buildRepairPrompt(fields, options),
  ], getGeminiRepairResponseSchema(fields));
}
