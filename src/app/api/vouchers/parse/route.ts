import { NextRequest, NextResponse } from 'next/server'
import { parseInvoiceImage } from 'src/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    // We expect multipart/form-data for the file upload
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'No se proveyó ningún archivo' }, { status: 400 })
    }
    
    // Enforce 2MB file size limit
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo excede el límite de 2MB' }, { status: 413 })
    }

    // Only allow common image/pdf MIME types if needed, but Gemini supports images and PDF
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64File = buffer.toString('base64')
    
    // Parse using Gemini
    const extractedData = await parseInvoiceImage(base64File, file.type)
    
    // Return extracted data (UI will handle mapping this to form fields)
    return NextResponse.json(extractedData)
  } catch (error: unknown) {
    console.error('Error parsing document:', error)
    return NextResponse.json({ error: 'Error procesando el documento' }, { status: 500 })
  }
}
