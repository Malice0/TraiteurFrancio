import { forwardRef } from 'react'
import logo from '/logo.svg'
import styles from './ApercuDevis.module.css'

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
    month: 'long',
    year: 'numeric',
  })
}

const ApercuDevis = forwardRef(function ApercuDevis(
  { numero, docType, date, client, intitule, lignes, rib, paiement, showWatermark },
  ref,
) {
  const total = lignes
    .filter((ligne) => ligne.type !== '---separator---')
    .reduce((sum, ligne) => sum + (parseFloat(ligne.qty) || 0) * (parseFloat(ligne.price) || 0), 0)

  const acompte = parseFloat(paiement?.acompte) || 0
  const solde = parseFloat(paiement?.solde) || 0
  const totalRecu = acompte + solde
  const reste = Math.max(0, total - totalRecu)

  return (
    <div ref={ref} className={styles.preview}>
      {showWatermark && <div className={styles.watermark}>PAYE</div>}

      <div className={styles.header}>
        <div className={styles.company}>
          <img src={logo} alt="FCMA Ti Kaz Traiteur" style={{ height: 44, display: 'block', marginBottom: 6 }} />
          <span>11 rue des Grenadille, 97354 Remire-Montjoly</span>
          <br />
          <span>Tel : 0694 911 486</span>
        </div>

        <div className={styles.docnum}>
          <span className={styles.docLabel}>{docType === 'facture' ? 'Facture' : 'Devis'} no</span>
          <span className={styles.docValue}>{numero || '-'}</span>
        </div>
      </div>

      <div className={styles.meta}>
        <div><span>Date :</span> <strong>{formatDate(date)}</strong></div>
        <div><span>Client :</span> <strong>{client?.nom || '-'}</strong></div>
        <div><span>Telephone :</span> <strong>{client?.telephone || '-'}</strong></div>
        <div><span>Email :</span> <strong>{client?.email || '-'}</strong></div>
      </div>

      {intitule && <div className={styles.intitule}>{intitule}</div>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Designation / Description</th>
            <th className={styles.center}>Qte</th>
            <th className={styles.center}>Prix unit.</th>
            <th className={styles.right}>Montant</th>
          </tr>
        </thead>
        <tbody>
          {lignes.length === 0 && (
            <tr>
              <td colSpan={4} className={styles.empty}>Ajoute des lignes pour voir l'aperçu</td>
            </tr>
          )}

          {lignes.map((ligne) => {
            if (ligne.type === '---separator---') {
              return (
                <tr key={ligne.id} className={styles.sepRow}>
                  <td colSpan={4}></td>
                </tr>
              )
            }

            const montant = (parseFloat(ligne.qty) || 0) * (parseFloat(ligne.price) || 0)
            const label = ligne.desc ? `${ligne.type} - ${ligne.desc}` : ligne.type

            return (
              <tr key={ligne.id}>
                <td>{label}</td>
                <td className={styles.center}>{ligne.qty}</td>
                <td className={styles.center}>{formatCurrency(parseFloat(ligne.price) || 0)}</td>
                <td className={`${styles.right} ${styles.amount}`}>{formatCurrency(montant)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {lignes.length > 0 && (
        <div className={styles.totalRow}>
          <span>Total TTC :</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      )}

      {(acompte > 0 || solde > 0) && total > 0 && (
        <div className={styles.payBlock}>
          {acompte > 0 && (
            <div className={styles.payRow}>
              <span>Acompte recu</span>
              <strong>{formatCurrency(acompte)}</strong>
            </div>
          )}

          {solde > 0 && (
            <div className={styles.payRow}>
              <span>Solde recu</span>
              <strong>{formatCurrency(solde)}</strong>
            </div>
          )}

          <div className={`${styles.payRow} ${styles.payFinal}`}>
            <span>Reste a percevoir</span>
            <strong className={reste <= 0 ? styles.payOk : styles.payReste}>
              {reste <= 0 ? 'Solde' : formatCurrency(reste)}
            </strong>
          </div>
        </div>
      )}

      {rib && <div className={styles.rib}>{rib}</div>}

      <div className={styles.mentions}>
        <p>Paiement : acompte de 50% a la commande, solde a la livraison.</p>
        <p>Toute modification doit etre signalee au moins 48 heures avant la date prevue.</p>
        <p>Pour toute question ou ajustement, contacte FCMA Ti Kaz Traiteur au 0694 911 486.</p>
        <p style={{ marginTop: 6, fontSize: 10, color: '#999' }}>
          TVA non applicable - article 293 B du CGI (franchise en base)
        </p>
      </div>
    </div>
  )
})

export default ApercuDevis
