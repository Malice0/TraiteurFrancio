import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './Historique.module.css'

const STORAGE_KEY = 'tikaz_historique'
const MAX_DOCS = 10

// Utilitaire exporté pour sauvegarder un doc depuis Accueil
export function sauvegarderDoc(doc) {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  const updated = [doc, ...existing.filter(d => d.numero !== doc.numero)].slice(0, MAX_DOCS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

function formatCurrency(v) {
  return (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Historique() {
  const [docs, setDocs] = useState([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    setDocs(saved)
  }, [])

  function supprimerDoc(numero) {
    const updated = docs.filter(d => d.numero !== numero)
    setDocs(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  if (docs.length === 0) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h2 style={{ color: 'var(--accent)', marginBottom: 8 }}>Aucun document enregistré</h2>
          <p style={{ color: '#888', marginBottom: 24 }}>
            Les 10 derniers devis et factures apparaîtront ici automatiquement après impression.
          </p>
          <Link to="/" className="btn btn-primary">✏️ Créer un nouveau devis</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 24px 60px' }}>
      <div className="panel">
        <div className="panel-title">
          <span className="icon">📋</span>
          Historique — {docs.length} document{docs.length > 1 ? 's' : ''}
        </div>

        <div className={styles.list}>
          {docs.map(doc => (
            <div key={doc.numero} className={styles.card}>
              <div className={styles.cardLeft}>
                <span className={`${styles.badge} ${doc.type === 'facture' ? styles.badgeFacture : styles.badgeDevis}`}>
                  {doc.type === 'facture' ? 'Facture' : 'Devis'}
                </span>
                <div className={styles.numero}>{doc.numero}</div>
                <div className={styles.client}>{doc.clientNom || '—'}</div>
                {doc.intitule && <div className={styles.intitule}>{doc.intitule}</div>}
              </div>

              <div className={styles.cardRight}>
                <div className={styles.montant}>{formatCurrency(doc.total)}</div>
                <div className={styles.dateDoc}>{formatDate(doc.date)}</div>
                <div className={styles.actions}>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: 12, padding: '6px 12px' }}
                    onClick={() => supprimerDoc(doc.numero)}
                    title="Supprimer de l'historique"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#aaa', marginTop: 16, textAlign: 'center' }}>
          Les données sont stockées localement dans ce navigateur. Maximum {MAX_DOCS} documents.
        </p>
      </div>
    </div>
  )
}
