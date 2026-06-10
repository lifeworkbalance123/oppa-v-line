import { useEffect, useState } from 'react'
import './PdfViewerModal.css'

function PdfViewerModal({ open, title, pdfUrl, onClose }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      setLoading(true)
    }
  }, [open, pdfUrl])

  if (!open || !pdfUrl) return null

  return (
    <div className="pdf-viewer-modal" role="dialog" aria-modal="true" aria-labelledby="pdf-viewer-title">
      <div className="pdf-viewer-modal__header">
        <h2 id="pdf-viewer-title" className="pdf-viewer-modal__title">
          {title}
        </h2>
        <button
          type="button"
          className="pdf-viewer-modal__close"
          onClick={onClose}
          aria-label="Close PDF viewer"
        >
          ×
        </button>
      </div>

      {loading && (
        <div className="pdf-viewer-modal__loading" role="status">
          <span className="pdf-viewer-modal__spinner" aria-hidden="true" />
          Loading PDF…
        </div>
      )}

      <iframe
        className="pdf-viewer-modal__frame"
        src={pdfUrl}
        title={title}
        onLoad={() => setLoading(false)}
      />
    </div>
  )
}

export default PdfViewerModal
