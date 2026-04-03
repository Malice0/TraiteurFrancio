import { useState, useEffect, useCallback } from 'react'
import { apiBaseUrl, hasCustomApiBaseUrl, isGitHubPages, notionBackendMode } from '../config/runtime'

function buildEndpoint(path) {
  return `${apiBaseUrl}/${path}`
}

function getUnavailableMessage() {
  if (isGitHubPages && !hasCustomApiBaseUrl) {
    return 'API_NOT_CONFIGURED'
  }

  return 'BACKEND_UNAVAILABLE'
}

function parseNotionError(status, message) {
  if (message === 'API_NOT_CONFIGURED') {
    return "L'API Notion n'est pas configuree. Ajoutez VITE_API_BASE_URL avec l'URL de vos fonctions Netlify."
  }

  if (message === 'BACKEND_UNAVAILABLE') {
    return "Le backend Notion est indisponible. Verifiez l'URL VITE_API_BASE_URL ou le site Netlify."
  }

  if (status === 400) return message || 'Requete invalide.'
  if (status === 401) return 'Token Notion invalide. Verifiez NOTION_TOKEN dans Netlify.'
  if (status === 403) return "Acces refuse. Partagez chaque base Notion avec l'integration."
  if (status === 404) return "Base ou endpoint introuvable. Verifiez l'ID de la base et le partage Notion."
  if (status === 429) return 'Trop de requetes Notion. Reessayez dans quelques secondes.'
  if (status >= 500) return "Erreur serveur Notion. Verifiez les variables d'environnement cote Netlify."

  return message || `Erreur ${status}`
}

async function fetchJson(path, options = {}) {
  if (isGitHubPages && !hasCustomApiBaseUrl) {
    const error = new Error(getUnavailableMessage())
    error.code = getUnavailableMessage()
    throw error
  }

  let response

  try {
    response = await fetch(buildEndpoint(path), options)
  } catch {
    const error = new Error(getUnavailableMessage())
    error.code = getUnavailableMessage()
    throw error
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(parseNotionError(response.status, data.error))
    error.status = response.status
    throw error
  }

  return data
}

export function useNotionClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchJson('notion-clients')
      setClients(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.code || err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  return { clients, loading, error, refetch: fetchClients }
}

export function useNotionHealth() {
  const [status, setStatus] = useState(null)
  const [message, setMessage] = useState('')

  const check = useCallback(async () => {
    setStatus('loading')

    try {
      const data = await fetchJson('notion-health')
      setStatus('ok')
      setMessage(`Connecte a Notion via ${data.backend || notionBackendMode} - ${data.databases || 0} base(s) accessible(s)`)
    } catch (err) {
      setStatus('error')
      setMessage(err.message || parseNotionError(err.status, err.code))
    }
  }, [])

  return { status, message, check }
}

function useTransientStatus() {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (!status) return undefined

    const timeoutId = setTimeout(() => setStatus(null), 6000)
    return () => clearTimeout(timeoutId)
  }, [status])

  return [status, setStatus]
}

export function useSaveDocument() {
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useTransientStatus()

  const saveDocument = useCallback(async (payload) => {
    setSaving(true)
    setStatus(null)

    try {
      await fetchJson('notion-save-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const label = payload.type === 'facture' ? 'Facture' : 'Devis'
      setStatus({ type: 'success', msg: `${label} ${payload.numero} enregistre dans Notion.` })
      return true
    } catch (err) {
      setStatus({ type: 'error', msg: parseNotionError(err.status, err.code || err.message) })
      return false
    } finally {
      setSaving(false)
    }
  }, [setStatus])

  return { saving, status, saveDocument }
}

export function useSaveClient() {
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useTransientStatus()

  const saveClient = useCallback(async (clientData) => {
    setSaving(true)
    setStatus(null)

    try {
      const data = await fetchJson('notion-save-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      })

      setStatus({ type: 'success', msg: `Client "${clientData.nom}" enregistre dans Notion.` })
      return data.client
    } catch (err) {
      setStatus({ type: 'error', msg: parseNotionError(err.status, err.code || err.message) })
      return null
    } finally {
      setSaving(false)
    }
  }, [setStatus])

  return { saving, status, saveClient }
}
