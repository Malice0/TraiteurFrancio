import { useCallback, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import LignePrest from '../components/LignePrest'
import ApercuDevis from '../components/ApercuDevis'
import { useNumerotation } from '../hooks/useNumerotation'
import { useNotionClients, useSaveDocument } from '../hooks/useNotion'
import { useModeles } from '../hooks/useModeles'
import styles from './Accueil.module.css'

function formatCurrency(value) {
  return (value || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' EUR'
}

function newLigne() {
  return { id: Date.now() + Math.random(), type: 'Plat', desc: '', qty: 1, price: 0 }
}

export default function Accueil() {
  const today = new Date().toISOString().slice(0, 10)

  const [docType, setDocType] = useState('devis')
  const [date, setDate] = useState(today)
  const [clientSelId, setClientSelId] = useState('')
  const [clientNom, setClientNom] = useState('')
  const [clientTelephone, setClientTelephone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [intitule, setIntitule] = useState('')
  const [lignes, setLignes] = useState([newLigne()])
  const [rib, setRib] = useState('')
  const [acompte, setAcompte] = useState('')
  const [solde, setSolde] = useState('')
  const [showWatermark, setShowWatermark] = useState(false)

  const { numero, increment, nextDocument } = useNumerotation(date, docType)
  const { clients, loading: clientsLoading, error: clientsError } = useNotionClients()
  const { saving, status, saveDocument } = useSaveDocument()
  const { modeles, appliquerModele } = useModeles()
  const printRef = useRef()

  const clientNotion = clients.find((client) => client.id === clientSelId)
  const clientPourApercu = {
    ...(clientNotion || {}),
    nom: clientNotion?.nom || clientNom,
    telephone: clientTelephone || clientNotion?.telephone || '',
    email: clientEmail || clientNotion?.email || '',
  }
  const clientActif = clientNotion?.nom || clientNom || 'Aucun client choisi'

  const total = lignes
    .filter((ligne) => ligne.type !== '---separator---')
    .reduce((sum, ligne) => sum + (parseFloat(ligne.qty) || 0) * (parseFloat(ligne.price) || 0), 0)

  const totalRecu = (parseFloat(acompte) || 0) + (parseFloat(solde) || 0)
  const reste = Math.max(0, total - totalRecu)

  const payStatut = totalRecu > 0 && total > 0
    ? reste <= 0
      ? { type: 'success', msg: `Entierement regle - ${formatCurrency(total)}` }
      : { type: 'warning', msg: `Acompte recu: ${formatCurrency(parseFloat(acompte) || 0)} - Reste: ${formatCurrency(reste)}` }
    : null

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${docType === 'facture' ? 'Facture' : 'Devis'}_${numero}`,
  })

  const handleSaveNotion = useCallback(async () => {
    const ok = await saveDocument({
      numero,
      type: docType,
      clientId: clientSelId || null,
      intitule,
      lignes,
      total,
      date,
    })

    if (ok) nextDocument()
  }, [numero, docType, clientSelId, intitule, lignes, total, date, saveDocument, nextDocument])

  const handleEmail = useCallback(() => {
    const nom = clientNotion?.nom || clientNom || ''
    const subject = encodeURIComponent(`${docType === 'facture' ? 'Facture' : 'Devis'} ${numero} - FCMA Ti Kaz Traiteur`)
    const body = encodeURIComponent(
      `Bonjour ${nom},\n\nVeuillez trouver votre ${docType === 'facture' ? 'facture' : 'devis'} ndeg ${numero}.\n\nMontant total : ${formatCurrency(total)}\n\nCordialement,\nFCMA Ti Kaz Traiteur\nTel : 0694 911 486`,
    )

    window.location.href = `mailto:${clientEmail || clientNotion?.email || ''}?subject=${subject}&body=${body}`
  }, [numero, docType, clientNom, clientNotion, clientEmail, total])

  const handleReset = useCallback(() => {
    nextDocument()
    setClientSelId('')
    setClientNom('')
    setClientTelephone('')
    setClientEmail('')
    setIntitule('')
    setLignes([newLigne()])
    setDate(new Date().toISOString().slice(0, 10))
    setAcompte('')
    setSolde('')
    setShowWatermark(false)
    setRib('')
  }, [nextDocument])

  const addLigne = () => setLignes((current) => [...current, newLigne()])
  const updateLigne = (id, updated) => setLignes((current) => current.map((ligne) => (ligne.id === id ? updated : ligne)))
  const removeLigne = (id) => setLignes((current) => current.filter((ligne) => ligne.id !== id))
  const handleClientSelect = (value) => {
    setClientSelId(value)

    if (!value) {
      setClientNom('')
      return
    }

    const selectedClient = clients.find((client) => client.id === value)

    if (selectedClient) {
      setClientNom(selectedClient.nom || '')
      setClientTelephone(selectedClient.telephone || '')
      setClientEmail(selectedClient.email || '')
    }
  }

  return (
    <div className="app-container">
      <section>
        <div className="status-banner no-print">
          <div className="status-card">
            <span className="status-label">Document en cours</span>
            <strong className="status-value">{docType === 'facture' ? 'Facture' : 'Devis'} {numero}</strong>
            <p className="status-hint">Un numero clair aide a rassurer le client et facilite le suivi.</p>
          </div>

          <div className="status-card">
            <span className="status-label">Client cible</span>
            <strong className="status-value">{clientActif}</strong>
            <p className="status-hint">Renseigne le client des le debut pour envoyer plus vite.</p>
          </div>

          <div className="status-card">
            <span className="status-label">Montant actuel</span>
            <strong className="status-value">{formatCurrency(total)}</strong>
            <p className="status-hint">Pense a proposer un acompte pour verrouiller la reservation.</p>
          </div>
        </div>

        <section className="panel no-print">
          <div className={styles.docTypeRow}>
            <div className="panel-title" style={{ marginBottom: 0 }}>
              <span className="icon">Devis</span>
              {docType === 'facture' ? 'Nouvelle facture' : 'Nouveau devis'}
            </div>

            <button
              className={`btn ${docType === 'facture' ? styles.btnFacture : styles.btnToggle}`}
              onClick={() => setDocType((current) => (current === 'devis' ? 'facture' : 'devis'))}
            >
              {docType === 'facture' ? 'Passer en devis' : 'Passer en facture'}
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Numero du document</label>
              <div className={styles.numeroRow}>
                <input type="text" value={numero} readOnly style={{ flex: 1 }} />
                <button className="btn-incr neg" onClick={() => increment(-5)}>-5</button>
                <button className="btn-incr neg" onClick={() => increment(-1)}>-1</button>
                <button className="btn-incr" onClick={() => increment(+1)}>+1</button>
                <button className="btn-incr" onClick={() => increment(+5)}>+5</button>
              </div>
            </div>

            <div className="form-group">
              <label>Date du document</label>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Client</label>
              {clientsLoading ? (
                <input type="text" disabled placeholder="Chargement des clients..." />
              ) : (
                <select
                  value={clientSelId}
                  onChange={(event) => handleClientSelect(event.target.value)}
                >
                  <option value="">Saisir manuellement</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nom}{client.type ? ` (${client.type})` : ''}
                    </option>
                  ))}
                </select>
              )}

              {!clientSelId && (
                <input
                  type="text"
                  placeholder="Nom du client"
                  value={clientNom}
                  onChange={(event) => setClientNom(event.target.value)}
                  style={{ marginTop: 8 }}
                />
              )}

              {clientsError && (
                <p style={{ marginTop: 8, color: 'var(--danger)', fontSize: 12 }}>
                  {clientsError === 'API_NOT_CONFIGURED'
                    ? "Clients Notion indisponibles: configure VITE_API_BASE_URL vers Netlify."
                    : clientsError === 'BACKEND_UNAVAILABLE'
                      ? 'Clients Notion indisponibles: backend Netlify injoignable.'
                      : clientsError}
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Intitule de la commande</label>
              <input
                type="text"
                placeholder="Ex : Cocktail dinatoire mariage 60 personnes"
                value={intitule}
                onChange={(event) => setIntitule(event.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Telephone</label>
              <input
                type="tel"
                placeholder="0694 00 00 00"
                value={clientTelephone}
                onChange={(event) => setClientTelephone(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="client@email.com"
                value={clientEmail}
                onChange={(event) => setClientEmail(event.target.value)}
              />
            </div>
          </div>

          {modeles.length > 0 && (
            <div className={styles.modelesRow}>
              <span className={styles.modelesLabel}>Modeles rapides</span>
              {modeles.map((modele) => (
                <button
                  key={modele.id}
                  className={`btn btn-outline ${styles.btnModele}`}
                  onClick={() => appliquerModele(modele.id, setLignes)}
                >
                  {modele.label}
                </button>
              ))}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>RIB (optionnel)</label>
            <textarea
              rows={3}
              value={rib}
              onChange={(event) => setRib(event.target.value)}
              placeholder={"Banque : Caisse d'Epargne\nIBAN : FR76 ...\nBIC : CEPAFRPP"}
              style={{ resize: 'vertical' }}
            />
          </div>

          <hr className={styles.sep} />

          <div className={styles.linesHeader}>
            <h3>Lignes de prestation</h3>
            <button className="btn btn-primary" onClick={addLigne}>+ Ajouter une ligne</button>
          </div>

          {lignes.map((ligne) => (
            <LignePrest
              key={ligne.id}
              ligne={ligne}
              onChange={(updated) => updateLigne(ligne.id, updated)}
              onRemove={() => removeLigne(ligne.id)}
            />
          ))}

          <div className={styles.totalBar}>
            <span>Total TTC</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          <hr className={styles.sep} />

          <div className={styles.paySection}>
            <div className={styles.payTitle}>Suivi du reglement</div>

            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>Acompte recu (EUR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={acompte}
                  onChange={(event) => setAcompte(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Solde recu (EUR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={solde}
                  onChange={(event) => setSolde(event.target.value)}
                />
              </div>
            </div>

            {payStatut && (
              <div className={`${styles.payStatut} ${styles[payStatut.type]}`}>{payStatut.msg}</div>
            )}

            <label className={styles.watermarkLabel}>
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={(event) => setShowWatermark(event.target.checked)}
              />
              Afficher le filigrane <span style={{ color: '#2f7d51', fontWeight: 700 }}>PAYE</span>
            </label>
          </div>

          <div className={styles.formActions}>
            <button className="btn btn-accent" onClick={handlePrint}>Imprimer en PDF</button>
            <button className="btn btn-notion" onClick={handleSaveNotion} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer dans Notion'}
            </button>
            <button className="btn btn-outline" onClick={handleEmail}>Envoyer par email</button>
            <button className="btn btn-outline" onClick={handleReset}>Nouveau</button>
          </div>

          {status && <div className={`toast ${status.type}`}>{status.msg}</div>}
        </section>

        <div className="helper-card no-print">
          <h3>Rassurer et convertir plus vite</h3>
          <p>Un devis efficace doit etre simple a lire, rapide a envoyer et clair sur le paiement.</p>
          <ul>
            <li>ajoute toujours la date, le lieu et le nombre de personnes dans l'intitule</li>
            <li>propose un acompte standard pour verrouiller la reservation</li>
            <li>envoie le devis le jour meme quand la demande est chaude</li>
          </ul>
        </div>
      </section>

      <section className="panel" style={{ position: 'sticky', top: 100, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
        <div className="panel-title no-print">
          <span className="icon">Apercu</span>
          {docType === 'facture' ? 'Apercu de la facture' : 'Apercu du devis'}
        </div>

        <ApercuDevis
          ref={printRef}
          numero={numero}
          docType={docType}
          date={date}
          client={clientPourApercu}
          intitule={intitule}
          lignes={lignes}
          rib={rib}
          paiement={{ acompte, solde }}
          showWatermark={showWatermark}
        />
      </section>
    </div>
  )
}
