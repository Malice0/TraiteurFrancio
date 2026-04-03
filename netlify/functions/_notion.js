const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function json(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }
}

function getEnv() {
  return {
    token: process.env.NOTION_TOKEN,
    clientsDatabaseId: process.env.NOTION_DB_CLIENTS,
    devisDatabaseId: process.env.NOTION_DB_DEVIS,
    commandesDatabaseId: process.env.NOTION_DB_COMMANDES,
  }
}

function getNotionHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  }
}

async function notionFetch(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: getNotionHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.message || 'Erreur Notion')
    error.status = response.status
    throw error
  }

  return data
}

module.exports = {
  CORS_HEADERS,
  json,
  getEnv,
  notionFetch,
}
