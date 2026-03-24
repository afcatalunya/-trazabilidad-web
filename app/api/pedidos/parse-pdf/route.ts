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

    // Referencia producto: primer código alfanumérico de la línea de producto
    // Líneas de producto suelen empezar con código tipo "CHC0090003", "ALU00123", etc.
    const matchRef = text.match(/\n([A-Z]{2,}[0-9]{4,})\s+/m)
    if (matchRef) resultado.referenciaProducto = matchRef[1].trim()

    // Color: último segmento en la línea de producto (después de cantidades y medidas)
    // Ejemplo: "CHC0090003 CHAPA ... 12 1.000 12 7016 TEXT 2C"
    // El color suele ser los últimos tokens no-numéricos de la línea del producto
    if (matchRef) {
      // Buscar la línea completa del producto
      const lineaProductoRegex = new RegExp(matchRef[1] + '\\s+(.+)', 'i')
      const lineaMatch = text.match(lineaProductoRegex)
      if (lineaMatch) {
        const partes = lineaMatch[1].trim().split(/\s+/)
        // Buscar desde el final la secuencia de color (números + texto como "7016 TEXT 2C")
        // Saltamos cantidades numéricas puras al final y cogemos lo que sigue
        let colorTokens: string[] = []
        let i = partes.length - 1
        // Los últimos tokens con letras son probablemente el color
        while (i >= 0 && (isNaN(Number(partes[i])) || colorTokens.length > 0)) {
          if (isNaN(Number(partes[i])) || colorTokens.length > 0) {
            colorTokens.unshift(partes[i])
          }
          i--
          // Detener cuando encontramos un número puro precediendo al color
          if (i >= 0 && !isNaN(Number(partes[i])) && colorTokens.length >= 2) break
        }
        // Filtrar y limpiar
        const colorStr = colorTokens.join(' ').trim()
        if (colorStr && colorStr.length > 1 && colorStr.length < 30) {
          resultado.color = colorStr
        }
      }
    }

    // Inferir tipo salida desde descripción del producto
    const descLower = text.toLowerCase()
    if (descLower.includes('chapa')) {
      resultado.tipoSalida = 'CHAPAS'
      resultado.categoria = 'CHAPAS'
    } else if (descLower.includes('composite')) {
      resultado.tipoSalida = 'PANEL'
      resultado.categoria = 'COMPOSITE'
    }

    // Acabado: si el color contiene "TEXT" o "TEXTURA" → LACADO
    if (resultado.color) {
      const c = resultado.color.toUpperCase()
      if (c.includes('TEXT') || c.includes('MATE') || c.includes('BRILLO') || c.includes('2C') || c.includes('1C')) {
        resultado.acabado = 'LACADO'
      } else if (c === 'BRUTO' || c === 'S/A') {
        resultado.acabado = 'S/A'
      } else if (c.includes('PLATA') || c.includes('NATURAL') || c.includes('ANOD')) {
        resultado.acabado = 'ANODIZADO'
      }
    }

    return Response.json({ ok: true, campos: resultado })
  } catch (err: any) {
    console.error('Error parseando PDF:', err)
    return Response.json({ error: 'Error al procesar el PDF: ' + err.message }, { status: 500 })
  }
}
