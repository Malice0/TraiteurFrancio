const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '')

const rawApiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '')
const rawAppBaseUrl = import.meta.env.VITE_APP_BASE_URL || '/'

export const isGitHubPages = window.location.hostname.includes('github.io')

export const appBaseUrl = rawAppBaseUrl
export const apiBaseUrl = rawApiBaseUrl || '/.netlify/functions'

export const hasCustomApiBaseUrl = Boolean(rawApiBaseUrl)
export const notionBackendMode = rawApiBaseUrl ? 'remote' : 'netlify-local'
