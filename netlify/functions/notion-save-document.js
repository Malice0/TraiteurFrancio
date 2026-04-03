const { CORS_HEADERS, getEnv, json, notionFetch } = require('./_notion')

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

  const { numero, type, clientId, intitule, lignes, total, date } = payload

  const lignesText = (lignes || [])
    .filter((ligne) => ligne.type !== '---separator---')
    .map((ligne) => {
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

    return json(200, { success: true, pageId: data.id, url: data.url })
  } catch (error) {
    return json(error.status || 500, { error: error.message })
  }
}
