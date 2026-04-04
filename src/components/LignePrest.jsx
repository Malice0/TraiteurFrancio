import styles from './LignePrest.module.css'

const TYPES = ['Plat', "Main d'oeuvre", 'Livraison', 'Supplement', 'Commentaire', '---separator---']

function formatCurrency(value) {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' EUR'
}

export default function LignePrest({ ligne, onChange, onRemove }) {
  const isSeparator = ligne.type === '---separator---'
  const isComment = ligne.type === 'Commentaire'
  const montant = (parseFloat(ligne.qty) || 0) * (parseFloat(ligne.price) || 0)

  function handleChange(field, value) {
    onChange({ ...ligne, [field]: value })
  }

  return (
    <div className={`${styles.ligne} ${isSeparator ? styles.separator : ''} ${isComment ? styles.commentaire : ''}`}>
      <div className="form-group">
        <label>Type</label>
        <select value={ligne.type} onChange={(event) => handleChange('type', event.target.value)}>
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {type === '---separator---' ? '--- Saut de ligne ---' : type}
            </option>
          ))}
        </select>
      </div>

      {!isSeparator && (
        <div className={`form-group ${styles.descCol}`}>
          <label>{isComment ? 'Commentaire' : 'Description'}</label>
          <input
            type="text"
            value={ligne.desc}
            placeholder={isComment ? 'Ex : Allergies, remarques, modalites...' : 'Ex : Colombo poulet, riz blanc'}
            onChange={(event) => handleChange('desc', event.target.value)}
          />
        </div>
      )}

      {!isSeparator && !isComment && (
        <div className="form-group">
          <label>Qte</label>
          <input
            type="number"
            min="0"
            value={ligne.qty}
            onChange={(event) => handleChange('qty', event.target.value)}
          />
        </div>
      )}

      {!isSeparator && !isComment && (
        <div className="form-group">
          <label>Prix unit. (EUR)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={ligne.price}
            onChange={(event) => handleChange('price', event.target.value)}
          />
        </div>
      )}

      {!isSeparator && !isComment && (
        <div className="form-group">
          <label>Montant</label>
          <div className={styles.montant}>{formatCurrency(montant)}</div>
        </div>
      )}

      <button className={styles.btnRemove} onClick={onRemove} title="Supprimer">x</button>
    </div>
  )
}
