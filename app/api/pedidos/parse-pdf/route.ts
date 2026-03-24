/**
 * POST /api/pedidos/parse-pdf
 * Recibe un PDF de "Orden de Trabajo" de Aluminios Franco,
 * extrae los campos y los devuelve como JSON para pre-rellenar el formulario.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('pdf') as File | null

    if (!file) {
      return Response.json({ error: 'No se ha enviado ningún PDF' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Importación dinámica para evitar problemas de compilación (igual que nodemailer)
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js' as string)).default
    const pdfData = await pdfParse(buffer)
    const text = pdfData.text

    // ─── Parseo con regex ────────────────────────────────────────────────────
    const resultado: Record<string, string> = {}

    // Número de pedido: "PED.V26-03407" → "V26-03407"
    const matchPedido = text.match(/Nº pedido\s+(?:PED\.)?([A-Z0-9-]+)/i)
    if (matchPedido) resultado.numeroPedido = matchPedido[1].trim()

    // Número cliente: "Número Cliente 0774"
    const matchNumCli = text.match(/Número Cliente\s+(\d+)/i)
    if (matchNumCli) resultado.numeroCliente = matchNumCli[1].trim()

    // Nombre cliente: "Nombre Cliente MARÍA LAURA..."
    const matchCli = text.match(/Nombre Cliente\s+(.+?)(?:\n|Fecha Pedido|Teléfono)/i)
    if (matchCli) resultado.cliente = matchCli[1].trim()

    // Fecha pedido: "18. Marzo 2026" o "18 de marzo de 2026"
    const MESES: Record<string, string> = {
      enero:'01', febrero:'02', marzo:'03', abril:'04', mayo:'05', junio:'06',
      julio:'07', agosto:'08', septiembre:'09', octubre:'10', noviembre:'11', diciembre:'12',
    }
    const matchFecha = text.match(/(\d{1,2})[.\s]+de?\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)[.\s,]+(\d{4})/i)
    if (matchFecha) {
      const dia = matchFecha[1].padStart(2, '0')
      const mes = MESES[matchFecha[2].toLowerCase()]
      const anyo = matchFecha[3]
      resultado.fechaPedido = `${anyo}-${mes}-${dia}`
    }

    // Solo se extraen los 4 campos seguros del PDF.
    // El resto (tipo salida, categoría, referencia, acabado, color, proveedor...)
    // se introduce manualmente porque un pedido puede tener varias referencias.

    return Response.json({ ok: true, campos: resultado })
  } catch (err: any) {
    console.error('Error parseando PDF:', err)
    return Response.json({ error: 'Error al procesar el PDF: ' + err.message }, { status: 500 })
  }
}
