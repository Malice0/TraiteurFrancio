const {
  CORS_HEADERS,
  getEnv,
  getRichTextValue,
  getTitleValue,
  json,
  notionFetch,
} = require('./_notion')

async function resolveClientNames(token, relationItems = []) {
  if (!relationItems.length) return []

  const names = await Promise.all(
    relationItems.map(async (item) => {
      try {
        const page = await notionFetch(`/pages/${item.id}`, { token })
        return getTitleValue(page.properties?.Nom) || getTitleValue(page.properties?.Name) || item.id
      } catch {
        return item.id
      }
    }),
  )

  return names.filter(Boolean)
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  const { token, devisDatabaseId } = getEnv()

  if (!token || !devisDatabaseId) {
    return json(500, { error: 'Variables NOTION_TOKEN ou NOTION_DB_DEVIS manquantes dans Netlify.' })
  }

  try {
    const data = await notionFetch(`/databases/${devisDatabaseId}/query`, {
      token,
      method: 'POST',
      body: {
        sorts: [{ property: 'Date', direction: 'descending' }],
        page_size: 20,
      },
    })

    const documents = await Promise.all(
      (data.results || []).map(async (page) => {
        const props = page.properties || {}
        const clientNames = await resolveClientNames(token, props.Client?.relation || [])

        return {
          id: page.id,
          url: page.url,
          numero: getTitleValue(props['Numéro']) || getTitleValue(props.Numero),
          type: props.Type?.select?.name?.toLowerCase() || 'devis',
          clientNom: clientNames.join(', '),
          intitule: getRichTextValue(props['Description commande']),
          total: props['Montant total (€)']?.number || props['Montant total (€)']?.number || 0,
          date: props.Date?.date?.start || '',
          statut: props.Statut?.select?.name || '',
        }
      }),
    )

    return json(200, documents)
  } catch (error) {
    return json(error.status || 500, { error: error.message })
  }
}
