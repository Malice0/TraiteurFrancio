import styles from './LignePrest.module.css'

const TYPES = ['Plat', "Main d'œuvre", 'Livraison', 'Supplément', '---separator---']

function formatCurrency(v) {
  return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export default function LignePrest({ ligne, onChange, onRemove }) {
  const isSep = ligne.type === '---separator---'
  const montant = (parseFloat(ligne.qty) || 0) * (parseFloat(ligne.price) || 0)

  function handleChange(field, value) {
    onChange({ ...ligne, [field]: value })
  }

  return (
    <div className={`${styles.ligne} ${isSep ? styles.separator : ''}`}>
      {/* Type */}
      <div className="form-group">
        <label>Type</label>
        <select value={ligne.type} onChange={e => handleChange('type', e.target.value)}>
          {TYPES.map(t => <option key={t} value={t}>{t === '---separator---' ? '── Saut de ligne ──' : t}</option>)}
        </select>
      </div>

      {/* Description */}
      {!isSep && (
        <div className={`form-group ${styles.descCol}`}>
          <label>Description</label>
          <input
            type="text"
            value={ligne.desc}
            placeholder="Ex : Colombo poulet, riz blanc"
            onChange={e => handleChange('desc', e.target.value)}
          />
        </div>
      )}

      {/* Quantité */}
      {!isSep && (
        <div className="form-group">
          <label>Qté</label>
          <input
            type="number" min="0"
            value={ligne.qty}
            onChange={e => handleChange('qty', e.target.value)}
          />
        </div>
      )}

      {/* Prix unitaire */}
      {!isSep && (
        <div className="form-group">
          <label>Prix unit. (€)</label>
          <input
            type="number" min="0" step="0.01"
            value={ligne.price}
            onChange={e => handleChange('price', e.target.value)}
          />
        </div>
      )}

      {/* Montant calculé */}
      {!isSep && (
        <div className="form-group">
          <label>Montant</label>
          <div className={styles.montant}>{formatCurrency(montant)}</div>
        </div>
      )}

      {/* Supprimer */}
      <button className={styles.btnRemove} onClick={onRemove} title="Supprimer">✕</button>
    </div>
  )
}
