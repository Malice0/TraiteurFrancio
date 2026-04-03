const { CORS_HEADERS, getEnv, json, notionFetch } = require('./_notion')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Methode non autorisee.' })
  }

  const { token, clientsDatabaseId } = getEnv()

  if (!token || !clientsDatabaseId) {
    return json(500, { error: 'Variables NOTION_TOKEN ou NOTION_DB_CLIENTS manquantes.' })
  }

  let payload

  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'JSON invalide.' })
  }

  const { nom, telephone, email, adresse, type, notes } = payload

  if (!nom) {
    return json(400, { error: 'Le nom du client est requis.' })
  }

  const properties = {
    Nom: { title: [{ text: { content: nom } }] },
    Actif: { checkbox: true },
    'Première commande': { date: { start: new Date().toISOString().slice(0, 10) } },
  }

  if (telephone) properties.Téléphone = { phone_number: telephone }
  if (email) properties.Email = { email }
  if (adresse) properties.Adresse = { rich_text: [{ text: { content: adresse } }] }
  if (type) properties.Type = { select: { name: type } }
  if (notes) properties.Notes = { rich_text: [{ text: { content: notes } }] }

  try {
    const data = await notionFetch('/pages', {
      token,
      method: 'POST',
      body: {
        parent: { database_id: clientsDatabaseId },
        properties,
      },
    })

    return json(200, {
      success: true,
      client: {
        id: data.id,
        nom,
        telephone: telephone || '',
        email: email || '',
        adresse: adresse || '',
        type: type || '',
      },
    })
  } catch (error) {
    return json(error.status || 500, { error: error.message })
  }
}
