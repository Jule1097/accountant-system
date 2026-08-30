import { GoogleGenAI } from '@google/genai'

const apiKey = process.env.GEMINI_API_KEY || ''
const ai = new GoogleGenAI({ apiKey })

export async function parseInvoiceImage(base64Image: string, mimeType: string, activeCompanyCuit?: string) {
  const prompt = activeCompanyCuit
    ? `Extract the accounting information from the invoice document. The active company's CUIT is ${activeCompanyCuit}. Do not use this CUIT as the thirdPartyCuit. The thirdPartyCuit must represent the other party on the invoice. Keep Credit Note amounts as positive values even if the source document shows them as negative. Separate sales retentions from purchase perceptions.`
    : 'Extract the accounting information from the invoice document. Keep Credit Note amounts as positive values even if the source document shows them as negative. Separate sales retentions from purchase perceptions.'

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: [
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
      prompt,
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          posNumber: { type: 'string' },
          number: { type: 'string' },
          date: { type: 'string' },
          currency: { type: 'string' },
          subtotal: { type: 'number' },
          vatAmount: { type: 'number' },
          nonTaxableAmount: { type: 'number' },
          exemptAmount: { type: 'number' },
          otherTaxesAmount: { type: 'number' },
          totalAmount: { type: 'number' },
          concept: { type: 'string' },
          paymentMethod: { type: 'string' },
          status: { type: 'string' },
          paymentDate: { type: 'string' },
          paidAmount: { type: 'number' },
          comments: { type: 'string' },
          thirdPartyCuit: { type: 'string' },
          supplierName: { type: 'string' },
          voucherType: { type: 'string' },
          voucherLetter: { type: 'string' },
          vatDetails: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                vatRateName: { type: 'string' },
                subtotal: { type: 'number' },
                vatAmount: { type: 'number' },
              },
              required: ['vatRateName', 'subtotal', 'vatAmount'],
            },
          },
          retentions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                conceptName: { type: 'string' },
                amount: { type: 'number' },
                province: { type: 'string' },
              },
              required: ['conceptName', 'amount'],
            },
          },
          perceptions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                conceptName: { type: 'string' },
                amount: { type: 'number' },
                province: { type: 'string' },
              },
              required: ['conceptName', 'amount'],
            },
          },
        },
        required: [
          'posNumber',
          'number',
          'date',
          'currency',
          'subtotal',
          'vatAmount',
          'totalAmount',
          'thirdPartyCuit',
          'supplierName',
          'voucherType',
          'voucherLetter',
        ],
      },
    },
  })

  const text = response.text

  if (!text) {
    throw new Error('Empty response from Gemini')
  }

  try {
    return JSON.parse(text)
  } catch (error: unknown) {
    console.error('Failed to parse Gemini response as JSON:', error)
    throw new Error('Failed to parse invoice')
  }
}
