import { Link } from 'react-router-dom'
import { useNotionDocuments } from '../hooks/useNotion'
import styles from './Historique.module.css'

function formatCurrency(value) {
  return (value || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' EUR'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'

  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function Historique() {
  const { documents, loading, error, refetch } = useNotionDocuments()

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          Chargement de l'historique Notion...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          <h2 style={{ color: 'var(--accent)', marginBottom: 8 }}>Historique indisponible</h2>
          <p style={{ color: '#666', marginBottom: 20 }}>{error}</p>
          <button className="btn btn-primary" onClick={refetch}>Reessayer</button>
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>Documents</div>
          <h2 style={{ color: 'var(--accent)', marginBottom: 8 }}>Aucun document dans Notion</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>
            Les devis et factures enregistres dans Notion apparaitront ici.
          </p>
          <Link to="/" className="btn btn-primary">Creer un nouveau devis</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 980, margin: '32px auto', padding: '0 24px 60px' }}>
      <div className="panel">
        <div className="panel-title">
          <span className="icon">Historique</span>
          {documents.length} document{documents.length > 1 ? 's' : ''}
        </div>

        <div className={styles.list}>
          {documents.map((doc) => (
            <div key={doc.id} className={styles.card}>
              <div className={styles.cardLeft}>
                <span className={`${styles.badge} ${doc.type === 'facture' ? styles.badgeFacture : styles.badgeDevis}`}>
                  {doc.type === 'facture' ? 'Facture' : 'Devis'}
                </span>
                <div className={styles.numero}>{doc.numero || '-'}</div>
                <div className={styles.client}>{doc.clientNom || 'Client non relie'}</div>
                {doc.intitule && <div className={styles.intitule}>{doc.intitule}</div>}
              </div>

              <div className={styles.cardRight}>
                <div className={styles.montant}>{formatCurrency(doc.total)}</div>
                <div className={styles.dateDoc}>{formatDate(doc.date)}</div>
                <div className={styles.status}>{doc.statut || 'Sans statut'}</div>
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline"
                    style={{ fontSize: 12, padding: '6px 12px', marginTop: 8 }}
                  >
                    Ouvrir dans Notion
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#777', marginTop: 16, textAlign: 'center' }}>
          Historique synchronise depuis la base Notion Devis & Factures.
        </p>
      </div>
    </div>
  )
}
