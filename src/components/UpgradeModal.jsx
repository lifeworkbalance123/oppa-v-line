import './UpgradeModal.css'

function UpgradeModal({ open, onClose, onUpgrade, loading, error }) {
  if (!open) return null

  return (
    <div className="upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-modal-title">
      <button
        type="button"
        className="upgrade-modal__backdrop"
        onClick={onClose}
        aria-label="Close upgrade modal"
      />
      <div className="upgrade-modal__panel">
        <h2 id="upgrade-modal-title" className="upgrade-modal__title">
          Unlock Bonus Guides
        </h2>
        <p className="upgrade-modal__text">
          Get all 5 bonus guides + all exercises + trackers for $29
        </p>

        {error && (
          <p className="upgrade-modal__error" role="alert">
            {error}
          </p>
        )}

        <div className="upgrade-modal__actions">
          <button
            type="button"
            className="upgrade-modal__btn upgrade-modal__btn--primary"
            onClick={onUpgrade}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Upgrade Now'}
          </button>
          <button
            type="button"
            className="upgrade-modal__btn upgrade-modal__btn--ghost"
            onClick={onClose}
            disabled={loading}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpgradeModal
