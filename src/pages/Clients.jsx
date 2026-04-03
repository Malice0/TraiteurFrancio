import { useEffect, useMemo, useState } from 'react'
import { useNotionClients, useNotionHealth, useSaveClient } from '../hooks/useNotion'
import styles from './Clients.module.css'

const TYPES_CLIENT = ['Particulier', 'Professionnel', 'Entreprise']

function ErrorGuide({ error, refetch }) {
  const isTokenError = typeof error === 'string' && error.toLowerCase().includes('token notion invalide')

  if (error === 'API_NOT_CONFIGURED') {
    return (
      <div className={styles.noticeCard}>
        <h3>Connexion API a finaliser</h3>
        <p>GitHub Pages ne peut pas executer tes fonctions Netlify tout seul.</p>
        <ul>
          <li>renseigne `VITE_API_BASE_URL` avec l'URL de ton site Netlify</li>
          <li>redeploie ensuite le frontend GitHub Pages</li>
          <li>teste a nouveau la page Clients</li>
        </ul>
        <button className="btn btn-primary" onClick={refetch}>Reessayer</button>
      </div>
    )
  }

  if (error === 'BACKEND_UNAVAILABLE') {
    return (
      <div className={styles.noticeCard}>
        <h3>Backend Netlify injoignable</h3>
        <p>Le frontend essaie de parler au backend, mais Netlify ne repond pas.</p>
        <ul>
          <li>verifie que le site Netlify est bien en ligne</li>
          <li>verifie que `VITE_API_BASE_URL` pointe vers `/.netlify/functions`</li>
          <li>redeploie Netlify si besoin</li>
        </ul>
        <button className="btn btn-primary" onClick={refetch}>Reessayer</button>
      </div>
    )
  }

  if (isTokenError) {
    return (
      <div className={styles.noticeCard}>
        <h3>Token Notion invalide</h3>
        <p>Ton site Netlify fonctionne, mais le secret Notion stocke sur Netlify n'est pas reconnu par Notion.</p>
        <ol className={styles.orderedList}>
          <li>ouvre Notion puis `Settings & members` puis `Connections` ou la page des integrations</li>
          <li>genere un nouveau token interne si besoin</li>
          <li>dans Netlify, remplace `NOTION_TOKEN` par ce nouveau token</li>
          <li>verifie aussi que les bases `Clients`, `Devis` et `Commandes` sont partagees avec cette integration</li>
          <li>redeploie le site Netlify</li>
        </ol>
        <div className={styles.noticeActions}>
          <button className="btn btn-primary" onClick={refetch}>Reessayer</button>
          <a className="btn btn-outline" href="https://www.notion.so/profile/integrations" target="_blank" rel="noreferrer">
            Ouvrir les integrations Notion
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.noticeCard}>
      <h3>Connexion Notion a verifier</h3>
      <p>{error}</p>
      <ul>
        <li>controle `NOTION_TOKEN` dans Netlify</li>
        <li>controle `NOTION_DB_CLIENTS` et les partages de base Notion</li>
        <li>relance ensuite un deploy Netlify</li>
      </ul>
      <button className="btn btn-primary" onClick={refetch}>Reessayer</button>
    </div>
  )
}

export default function Clients() {
  const { clients, loading, error, refetch } = useNotionClients()
  const { saving, status, saveClient } = useSaveClient()
  const { status: healthStatus, message: healthMessage, check } = useNotionHealth()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    type: 'Particulier',
    notes: '',
  })

  useEffect(() => {
    check()
  }, [check])

  const filtered = useMemo(() => (
    clients.filter((client) =>
      client.nom.toLowerCase().includes(search.toLowerCase()) ||
      (client.telephone || '').includes(search) ||
      (client.email || '').toLowerCase().includes(search.toLowerCase()),
    )
  ), [clients, search])

  async function handleSubmit(event) {
    event.preventDefault()
    const created = await saveClient(form)

    if (created) {
      setForm({ nom: '', telephone: '', email: '', adresse: '', type: 'Particulier', notes: '' })
      setShowForm(false)
      refetch()
      check()
    }
  }

  return (
    <div style={{ maxWidth: 1160, margin: '32px auto', padding: '0 24px 60px' }}>
      {status && <div className={`toast ${status.type}`}>{status.msg}</div>}

      <section className="status-banner">
        <div className="status-card">
          <span className="status-label">Base clients</span>
          <strong className="status-value">{loading ? 'Chargement...' : `${clients.length} actif(s)`}</strong>
          <p className="status-hint">Ton repertoire commercial doit rester a jour pour relancer vite.</p>
        </div>

        <div className="status-card">
          <span className="status-label">Connexion Notion</span>
          <strong className="status-value">
            {healthStatus === 'ok' ? 'Operationnelle' : healthStatus === 'loading' ? 'Verification...' : 'A controler'}
          </strong>
          <p className="status-hint">{healthMessage || 'Teste l acces a Notion et les variables Netlify.'}</p>
        </div>

        <div className="status-card">
          <span className="status-label">Priorite du jour</span>
          <strong className="status-value">Repondre vite</strong>
          <p className="status-hint">Un devis envoye rapidement augmente tes chances de signature.</p>
        </div>
      </section>

      <div className={styles.layout}>
        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div className="panel-title" style={{ marginBottom: 0 }}>
              <span className="icon">Clients</span>
              {!loading && ` (${clients.length})`}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => setShowForm((current) => !current)}>
                {showForm ? 'Annuler' : '+ Nouveau client'}
              </button>
              <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={() => { refetch(); check() }}>
                Actualiser
              </button>
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className={styles.newForm}>
              <div className={styles.formTitle}>Ajouter un client utile a relancer</div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    required
                    value={form.nom}
                    onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
                    placeholder="Ex : Marie Dupont"
                  />
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                  >
                    {TYPES_CLIENT.map((type) => <option key={type}>{type}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Telephone</label>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={(event) => setForm((current) => ({ ...current, telephone: event.target.value }))}
                    placeholder="0694 000 000"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="email@exemple.fr"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Adresse</label>
                <input
                  value={form.adresse}
                  onChange={(event) => setForm((current) => ({ ...current, adresse: event.target.value }))}
                  placeholder="Rue, ville"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Type d evenement, allergies, nombre de personnes, infos de suivi..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer dans Notion'}
              </button>
            </form>
          )}

          <div className="form-group" style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Rechercher un client, un telephone ou un email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: 32, color: '#888' }}>Chargement des clients...</div>
          )}

          {!loading && error && <ErrorGuide error={error} refetch={refetch} />}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: '#7a8488' }}>
              {clients.length === 0
                ? 'Aucun client actif. Ajoute ton premier contact pour demarrer le suivi.'
                : `Aucun resultat pour "${search}"`}
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className={styles.grid}>
              {filtered.map((client) => (
                <div key={client.id} className={styles.card}>
                  <div className={styles.avatar}>{client.nom.charAt(0).toUpperCase()}</div>
                  <div className={styles.info}>
                    <div className={styles.nom}>{client.nom}</div>
                    {client.type && (
                      <span className={`${styles.badge} ${styles[`badge${client.type}`]}`}>{client.type}</span>
                    )}
                    {client.telephone && <a href={`tel:${client.telephone}`} className={styles.contact}>{client.telephone}</a>}
                    {client.email && <a href={`mailto:${client.email}`} className={styles.contact}>{client.email}</a>}
                    {client.adresse && <span className={styles.adresse}>{client.adresse}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p style={{ fontSize: 12, color: '#6f7b80', marginTop: 20, textAlign: 'center' }}>
            Synchronise depuis Notion. Seuls les clients actifs sont affiches.
          </p>
        </div>

        <aside className={styles.sidebar}>
          <div className="helper-card">
            <h3>Faire pro des le premier contact</h3>
            <p>Voici le minimum qui aide a vendre plus vite quand on debute.</p>
            <ul>
              <li>repondre sous 24 h avec un devis simple et propre</li>
              <li>demander le nombre d'invites, le lieu et la date des le premier echange</li>
              <li>noter allergies, acompte et statut commercial pour chaque client</li>
            </ul>
          </div>

          <div className={styles.sidePanel}>
            <h3>Checklist Netlify + Notion</h3>
            <ul>
              <li>site Netlify detecte: `sprightly-starlight-393440`</li>
              <li>variables a verifier: `NOTION_TOKEN`, `NOTION_DB_CLIENTS`, `NOTION_DB_DEVIS`</li>
              <li>frontend GitHub Pages a lier avec `VITE_API_BASE_URL`</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
