import { useState } from 'react'
import { MODELES } from '../data/modeles'

export function useModeles() {
  const [actif, setActif] = useState(null)

  const appliquerModele = (id, setLignes) => {
    const modele = MODELES.find(m => m.id === id)
    if (!modele) return
    setLignes(modele.lignes.map((l, i) => ({ ...l, id: Date.now() + i })))
    setActif(id)
  }

  return { modeles: MODELES, actif, appliquerModele }
}
