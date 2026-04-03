import { forwardRef } from 'react'
import logo from '/logo.svg'
import styles from './ApercuDevis.module.css'

function formatCurrency(v) {
  return (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const ApercuDevis = forwardRef(function ApercuDevis(
  { numero, docType, date, client, intitule, lignes, rib, paiement, showWatermark },
  ref
) {
  const total = lignes
    .filter(l => l.type !== '---separator---')
    .reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.price) || 0), 0)

  const acompte = parseFloat(paiement?.acompte) || 0
  const solde   = parseFloat(paiement?.solde) || 0
  const totalRecu = acompte + solde
  const reste   = Math.max(0, total - totalRecu)

  return (
    <div ref={ref} className={styles.preview}>
      {/* Filigrane PAYÉ */}
      {showWatermark && <div className={styles.watermark}>PAYÉ</div>}

      {/* En-tête */}
      <div className={styles.header}>
        <div className={styles.company}>
          <img src={logo} alt="FCMA Ti Kaz Traiteur" style={{ height: 44, display: 'block', marginBottom: 6 }} />
          <span>11 rue des Grenadille, 97354 Rémire-Montjoly</span><br />
          <span>Tél : 0694 911 486</span>
        </div>
        <div className={styles.docnum}>
          <span className={styles.docLabel}>{docType === 'facture' ? 'Facture' : 'Devis'} n°</span>
          <span className={styles.docValue}>{numero || '—'}</span>
        </div>
      </div>

      {/* Méta */}
      <div className={styles.meta}>
        <div><span>Date :</span> <strong>{formatDate(date)}</strong></div>
        <div><span>Client :</span> <strong>{client?.nom || '—'}</strong></div>
      </div>

      {/* Intitulé */}
      {intitule && <div className={styles.intitule}>{intitule}</div>}

      {/* Tableau */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Désignation / Description</th>
            <th className={styles.center}>Qté</th>
            <th className={styles.center}>Prix unit.</th>
            <th className={styles.right}>Montant</th>
          </tr>
        </thead>
        <tbody>
          {lignes.length === 0 && (
            <tr><td colSpan={4} className={styles.empty}>Ajoutez des lignes pour voir l'aperçu</td></tr>
          )}
          {lignes.map(l => {
            if (l.type === '---separator---') {
              return <tr key={l.id} className={styles.sepRow}><td colSpan={4}></td></tr>
            }
            const m = (parseFloat(l.qty) || 0) * (parseFloat(l.price) || 0)
            const label = l.desc ? `${l.type} — ${l.desc}` : l.type
            return (
              <tr key={l.id}>
                <td>{label}</td>
                <td className={styles.center}>{l.qty}</td>
                <td className={styles.center}>{formatCurrency(parseFloat(l.price) || 0)}</td>
                <td className={styles.right + ' ' + styles.amount}>{formatCurrency(m)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Total */}
      {lignes.length > 0 && (
        <div className={styles.totalRow}>
          <span>Total TTC :</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      )}

      {/* Suivi paiement */}
      {(acompte > 0 || solde > 0) && total > 0 && (
        <div className={styles.payBlock}>
          {acompte > 0 && (
            <div className={styles.payRow}>
              <span>Acompte reçu</span><strong>{formatCurrency(acompte)}</strong>
            </div>
          )}
          {solde > 0 && (
            <div className={styles.payRow}>
              <span>Solde reçu</span><strong>{formatCurrency(solde)}</strong>
            </div>
          )}
          <div className={`${styles.payRow} ${styles.payFinal}`}>
            <span>Reste à percevoir</span>
            <strong className={reste <= 0 ? styles.payOk : styles.payReste}>
              {reste <= 0 ? '✅ Soldé' : formatCurrency(reste)}
            </strong>
          </div>
        </div>
      )}

      {/* RIB */}
      {rib && <div className={styles.rib}>{rib}</div>}

      {/* Mentions légales */}
      <div className={styles.mentions}>
        <p>Paiement : acompte de 50% à la commande, solde à la livraison.</p>
        <p>Toute modification doit être signalée au moins 48 heures avant la date prévue.</p>
        <p>Pour toute question ou ajustement n'hésitez pas à nous contacter — Tél : 0694 911 486.</p>
        <p style={{ marginTop: 6, fontSize: 10, color: '#999' }}>
          TVA non applicable — article 293 B du CGI (franchise en base)
        </p>
      </div>
    </div>
  )
})

export default ApercuDevis
