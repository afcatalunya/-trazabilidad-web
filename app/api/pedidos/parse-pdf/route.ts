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

    // ─── El PDF tiene 2 columnas: pdf-parse a veces mezcla labels en la misma línea
    // Ej: "Nombre Cliente    Fecha Pedido" — hay que manejar ambos casos ───────

    // Número de pedido: formato fijo "V26-03407" (letra + 2 dígitos + guión + 5 dígitos)
    const matchPedido = text.match(/(?:PED\.)?([A-Z]\d{2}-\d{5})/i)
    if (matchPedido) resultado.numeroPedido = matchPedido[1].toUpperCase().trim()

    // Número cliente: código de 4 dígitos empezando por 0 (ej: 0774)
    // Buscamos mismo línea O línea siguiente al label
    const matchNumCliSL = text.match(/N[uú]mero\s+Cliente\s+(\d{3,4})\b/i)
    const matchNumCliNL = text.match(/N[uú]mero\s+Cliente[^\n]*\n\s*(\d{3,4})\b/i)
    const matchNumCli = matchNumCliSL || matchNumCliNL
    if (matchNumCli) resultado.numeroCliente = matchNumCli[1].trim()

    // Nombre cliente: puede estar en la misma línea o en la siguiente
    // Si está en la misma línea, comprobamos que NO sea un label (Fecha, Nº, etc.)
    const matchCliSL = text.match(/Nombre\s+Cliente\s+([^\n]+)/i)
    if (matchCliSL) {
      const val = matchCliSL[1].trim()
      const esLabel = /^(Fecha|N[uú]mero|N[oº]|Tel[eé]|Dir|Ord|P[aá]g|ALUMIN)/i.test(val)
      if (!esLabel && val.length > 2) {
        resultado.cliente = val
      } else {
        // Valor está en la línea siguiente al label
        const matchCliNL = text.match(/Nombre\s+Cliente[^\n]*\n\s*([A-ZÁÉÍÓÚÜÑ][^\n]+)/i)
        if (matchCliNL) resultado.cliente = matchCliNL[1].trim()
      }
    }

    // Fecha pedido: "18. Marzo 2026" / "18 de marzo de 2026" / "18 marzo 2026"
    const MESES: Record<string, string> = {
      enero:'01', febrero:'02', marzo:'03', abril:'04', mayo:'05', junio:'06',
      julio:'07', agosto:'08', septiembre:'09', octubre:'10', noviembre:'11', diciembre:'12',
    }
    const matchFecha = text.match(/(\d{1,2})[.\s]+(?:de?\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?(\d{4})/i)
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
