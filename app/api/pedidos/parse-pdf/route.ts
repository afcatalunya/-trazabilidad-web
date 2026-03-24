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

    // Número cliente: código de 3-4 dígitos empezando por 0 (ej: 0774, 0095)
    // Estrategia 1: mismo línea — "Número Cliente 0774"
    // Estrategia 2: línea siguiente — "Número Cliente\n0774"
    // Estrategia 3: único código 0XXX en el documento
    const matchNumCliSL = text.match(/N[uú]mero\s+Cliente\s+(\d{3,4})\b/i)
    const matchNumCliNL = text.match(/N[uú]mero\s+Cliente[^\n]*\n\s*(\d{3,4})\b/i)
    const matchNumCliAny = text.match(/\b(0\d{3})\b/)
    const matchNumCli = matchNumCliSL || matchNumCliNL || matchNumCliAny
    if (matchNumCli) resultado.numeroCliente = matchNumCli[1].trim()

    // Nombre cliente: el PDF tiene 2 columnas y pdf-parse puede mezclar labels.
    // Estrategia robusta: buscar línea en MAYÚSCULAS con múltiples palabras
    // que no sea la empresa ni un label de campo.
    const LABELS_PDF = /^(N[uú]mero|Nombre|Tel[eé]f|Fecha|Dir|Su|Ord|P[aá]g|ALUMIN|CHC|SIN|EMAIL|Nº)/i
    const lines = text.split(/[\r\n]+/)
    for (const line of lines) {
      const l = line.trim()
      // Línea de nombre: >5 chars, contiene espacio (mínimo 2 palabras), no es un label conocido
      if (l.length > 5 && l.includes(' ') && !LABELS_PDF.test(l)) {
        // Solo letras mayúsculas españolas, espacios y algún guión/apóstrofe
        if (/^[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s\-'\.DE]+$/.test(l)) {
          resultado.cliente = l
          break
        }
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
