const { CORS_HEADERS, getEnv, json, notionFetch } = require('./_notion')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  const { token, clientsDatabaseId, devisDatabaseId, commandesDatabaseId } = getEnv()

  if (!token) {
    return json(500, { error: 'NOTION_TOKEN manquant.' })
  }

  const databases = [
    ['clients', clientsDatabaseId],
    ['devis', devisDatabaseId],
    ['commandes', commandesDatabaseId],
  ].filter(([, id]) => Boolean(id))

  if (databases.length === 0) {
    return json(500, { error: 'Aucune base Notion configuree.' })
  }

  try {
    const checks = await Promise.all(
      databases.map(async ([label, databaseId]) => {
        const data = await notionFetch(`/databases/${databaseId}`, { token })
        return { label, id: databaseId, title: data.title?.map((item) => item.plain_text).join('') || label }
      }),
    )

    return json(200, {
      ok: true,
      backend: 'netlify',
      databases: checks.length,
      checks,
    })
  } catch (error) {
    return json(error.status || 500, { error: error.message })
  }
}
