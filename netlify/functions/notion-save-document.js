const { CORS_HEADERS, getEnv, json, notionFetch } = require('./_notion')

const FILES_API_VERSION = '2025-09-03'

function getFilesHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': FILES_API_VERSION,
  }
}

async function uploadPdfToNotion(token, pdf) {
  if (!pdf?.base64 || !pdf?.fileName) return null

  const createResponse = await fetch('https://api.notion.com/v1/file_uploads', {
    method: 'POST',
    headers: {
      ...getFilesHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'single_part',
      filename: pdf.fileName,
      content_type: pdf.mimeType || 'application/pdf',
    }),
  })

  const createData = await createResponse.json().catch(() => ({}))

  if (!createResponse.ok) {
    const error = new Error(createData.message || "Creation de l'upload PDF impossible.")
    error.status = createResponse.status
    throw error
  }

  const formData = new FormData()
  const buffer = Buffer.from(pdf.base64, 'base64')
  const blob = new Blob([buffer], { type: pdf.mimeType || 'application/pdf' })
  formData.append('file', blob, pdf.fileName)

  const sendResponse = await fetch(`https://api.notion.com/v1/file_uploads/${createData.id}/send`, {
    method: 'POST',
    headers: getFilesHeaders(token),
    body: formData,
  })

  const sendData = await sendResponse.json().catch(() => ({}))

  if (!sendResponse.ok) {
    const error = new Error(sendData.message || "Envoi du PDF vers Notion impossible.")
    error.status = sendResponse.status
    throw error
  }

  return createData.id
}

async function attachPdfToPage(token, pageId, fileUploadId, fileName) {
  if (!fileUploadId) return

  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      ...getFilesHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        'PDF généré': {
          files: [
            {
              name: fileName,
              type: 'file_upload',
              file_upload: {
                id: fileUploadId,
              },
            },
          ],
        },
      },
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.message || "Rattachement du PDF a la page Notion impossible.")
    error.status = response.status
    throw error
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Methode non autorisee.' })
  }

  const { token, devisDatabaseId } = getEnv()

  if (!token || !devisDatabaseId) {
    return json(500, { error: 'Variables NOTION_TOKEN ou NOTION_DB_DEVIS manquantes dans Netlify.' })
  }

  let payload

  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'JSON invalide.' })
  }

  const { numero, type, clientId, intitule, lignes, total, date, pdf } = payload

  const lignesText = (lignes || [])
    .filter((ligne) => ligne.type !== '---separator---')
    .map((ligne) => {
      if (ligne.type === 'Commentaire') {
        return `Commentaire | ${ligne.desc || ''}`
      }

      const lineTotal = (parseFloat(ligne.qty) || 0) * (parseFloat(ligne.price) || 0)
      return `${ligne.type}${ligne.desc ? ` - ${ligne.desc}` : ''} | ${ligne.qty} x ${ligne.price} EUR = ${lineTotal.toFixed(2)} EUR`
    })
    .join('\n')

  const properties = {
    'Numéro': { title: [{ text: { content: numero || '' } }] },
    Type: { select: { name: type === 'facture' ? 'Facture' : 'Devis' } },
    'Description commande': { rich_text: [{ text: { content: intitule || '' } }] },
    Lignes: { rich_text: [{ text: { content: lignesText || 'Sans ligne' } }] },
    'Montant total (€)': { number: parseFloat(total) || 0 },
    Date: { date: { start: date || new Date().toISOString().slice(0, 10) } },
    Statut: { select: { name: 'Brouillon' } },
  }

  if (clientId) {
    properties.Client = { relation: [{ id: clientId }] }
  }

  try {
    const data = await notionFetch('/pages', {
      token,
      method: 'POST',
      body: {
        parent: { database_id: devisDatabaseId },
        properties,
      },
    })

    let pdfUploaded = false
    let pdfWarning = null

    if (pdf?.base64) {
      try {
        const fileUploadId = await uploadPdfToNotion(token, pdf)
        await attachPdfToPage(token, data.id, fileUploadId, pdf.fileName)
        pdfUploaded = true
      } catch (error) {
        pdfWarning = error.message
      }
    }

    return json(200, {
      success: true,
      pageId: data.id,
      url: data.url,
      pdfUploaded,
      pdfWarning,
    })
  } catch (error) {
    return json(error.status || 500, { error: error.message })
  }
}
