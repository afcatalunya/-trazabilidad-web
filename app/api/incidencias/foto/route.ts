import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    if (!blobToken) {
      return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN no configurado' }, { status: 500 })
    }

    const extension = file.name.split('.').pop() || 'jpg'
    const nombreArchivo = `incidencias/foto-${Date.now()}.${extension}`

    const blob = await put(nombreArchivo, file, {
      access: 'public',
      contentType: file.type,
      token: blobToken,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('Error subiendo foto incidencia:', error)
    return NextResponse.json({ error: 'Error al subir la foto' }, { status: 500 })
  }
}
