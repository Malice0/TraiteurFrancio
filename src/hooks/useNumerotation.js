import { useState, useCallback } from 'react'

const STORAGE_KEY = 'tikaz_counter'

// Récupère le compteur sauvegardé, sinon 1
function getSavedCounter() {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved ? parseInt(saved, 10) : 1
}

// Génère le numéro formaté selon la date et le type
function buildNumero(date, counter, type) {
  const d = date ? new Date(date) : new Date()
  const year = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  const prefix = type === 'facture' ? 'F' : 'D'
  return `${prefix}${year}-${mm}${dd}/${counter}`
}

export function useNumerotation(date, docType) {
  const [counter, setCounter] = useState(getSavedCounter)

  // Sauvegarde dans localStorage à chaque changement
  const updateCounter = useCallback((newVal) => {
    const safe = Math.max(1, newVal)
    setCounter(safe)
    localStorage.setItem(STORAGE_KEY, String(safe))
  }, [])

  const increment = useCallback((n) => updateCounter(counter + n), [counter, updateCounter])

  // Incrémente et sauvegarde après chaque nouveau document créé
  const nextDocument = useCallback(() => {
    updateCounter(counter + 1)
  }, [counter, updateCounter])

  const numero = buildNumero(date, counter, docType)

  return { counter, numero, increment, nextDocument }
}
