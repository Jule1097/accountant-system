import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

export async function parseInvoiceImage(base64Image: string, mimeType: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `
    Please extract the following accounting information from this invoice image.
    Return the result as a valid JSON object with the following fields. If a field cannot be found, omit it or set it to null.
    - "posNumber": string (Point of sale number, e.g. "00002")
    - "number": string (Invoice number, e.g. "00000123")
    - "date": string (Format: YYYY-MM-DD)
    - "currency": string ("$" or "USD")
    - "subtotal": number
    - "vatAmount": number
    - "totalAmount": number
    - "cuit": string (The CUIT of the supplier or client on the invoice, formatted as XX-XXXXXXXX-X)
    - "supplierName": string (The name or business name of the supplier)
    - "retentions": array of objects [{"description": string, "amount": number}] (Any retentions or percepciones indicated on the invoice)

    Only output the raw JSON object, without markdown formatting.
  `

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Image,
        mimeType
      }
    }
  ])

  const response = await result.response
  const text = response.text()

  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(jsonStr)
  } catch (error: unknown) {
    const err = error as Error
    console.error('Failed to parse Gemini response as JSON:', err)
    throw new Error('Failed to parse invoice')
  }
}
