const { CORS_HEADERS, getEnv, json, notionFetch } = require('./_notion')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  const { token, clientsDatabaseId } = getEnv()

  if (!token || !clientsDatabaseId) {
    return json(500, { error: 'Variables NOTION_TOKEN ou NOTION_DB_CLIENTS manquantes dans Netlify.' })
  }

  try {
    const data = await notionFetch(`/databases/${clientsDatabaseId}/query`, {
      token,
      method: 'POST',
      body: {
        sorts: [{ property: 'Nom', direction: 'ascending' }],
        filter: { property: 'Actif', checkbox: { equals: true } },
      },
    })

    const clients = (data.results || []).map((page) => ({
      id: page.id,
      url: page.url,
      nom: page.properties.Nom?.title?.[0]?.plain_text || '',
      telephone: page.properties.Téléphone?.phone_number || page.properties.Telephone?.phone_number || '',
      email: page.properties.Email?.email || '',
      adresse: page.properties.Adresse?.rich_text?.[0]?.plain_text || '',
      type: page.properties.Type?.select?.name || '',
    }))

    return json(200, clients)
  } catch (error) {
    return json(error.status || 500, { error: error.message })
  }
}
