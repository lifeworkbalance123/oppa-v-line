import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../App'
import { isSupabaseConfigured } from '../lib/supabase'
import { PDF_MAX_BYTES } from '../lib/pdfGuideCatalog'
import {
  deletePdfGuide,
  fetchPdfLibraryRecords,
  getPdfPublicUrl,
  setPdfGuideActive,
  uploadPdfGuide,
} from '../lib/pdfLibrary'
import './PdfGuidesAdmin.css'

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function PdfGuideCard({ guide, onRefresh, canManage }) {
  const fileInputRef = useRef(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return
    if (!canManage) {
      setError('Sign in to upload PDFs.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')
    setUploadProgress(0)

    try {
      await uploadPdfGuide({
        guide,
        file,
        onProgress: setUploadProgress,
      })
      setMessage('PDF uploaded successfully.')
      onRefresh()
    } catch (uploadError) {
      setError(uploadError.message || 'Upload failed.')
    } finally {
      setBusy(false)
      window.setTimeout(() => setUploadProgress(null), 800)
    }
  }

  const handleDelete = async () => {
    if (!guide.isUploaded) return
    if (!window.confirm(`Delete "${guide.title}"? This cannot be undone.`)) return

    setBusy(true)
    setError('')
    setMessage('')

    try {
      await deletePdfGuide(guide)
      setMessage('PDF deleted.')
      onRefresh()
    } catch (deleteError) {
      setError(deleteError.message || 'Delete failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleToggleVisible = async () => {
    setBusy(true)
    setError('')
    setMessage('')

    try {
      await setPdfGuideActive(guide, !guide.isActive)
      setMessage(guide.isActive ? 'Hidden from users.' : 'Now visible to users.')
      onRefresh()
    } catch (toggleError) {
      setError(toggleError.message || 'Could not update visibility.')
    } finally {
      setBusy(false)
    }
  }

  const handlePreview = () => {
    const url = getPdfPublicUrl(guide.storagePath)
    if (!url) {
      setError('Preview URL unavailable. Check bucket public access.')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <article className="pdf-guides-admin__card">
      <header className="pdf-guides-admin__card-header">
        <div>
          <h3 className="pdf-guides-admin__card-title">{guide.title}</h3>
          <p className="pdf-guides-admin__card-status">
            {guide.isUploaded ? 'Uploaded' : 'Not uploaded'}
            {guide.fileName && ` · ${guide.fileName}`}
            {guide.fileSize ? ` · ${formatFileSize(guide.fileSize)}` : ''}
          </p>
        </div>
        <span
          className={`pdf-guides-admin__badge${guide.isActive ? ' pdf-guides-admin__badge--active' : ''}`}
        >
          {guide.isActive ? 'Visible' : 'Hidden'}
        </span>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="pdf-guides-admin__file-input"
        onChange={handleUpload}
        disabled={busy}
      />

      {uploadProgress != null && (
        <div className="pdf-guides-admin__progress" aria-live="polite">
          <div
            className="pdf-guides-admin__progress-bar"
            style={{ width: `${uploadProgress}%` }}
          />
          <span>Uploading… {uploadProgress}%</span>
        </div>
      )}

      <div className="pdf-guides-admin__actions">
        <button
          type="button"
          className="pdf-guides-admin__btn pdf-guides-admin__btn--primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy || !canManage}
        >
          {guide.isUploaded ? 'Replace PDF' : 'Upload PDF'}
        </button>

        {guide.isUploaded && (
          <>
            <button
              type="button"
              className="pdf-guides-admin__btn"
              onClick={handlePreview}
              disabled={busy}
            >
              Preview
            </button>
            <button
              type="button"
              className="pdf-guides-admin__btn"
              onClick={handleDelete}
              disabled={busy}
            >
              Delete
            </button>
          </>
        )}
      </div>

      <label className="pdf-guides-admin__toggle">
        <input
          type="checkbox"
          checked={guide.isActive}
          onChange={handleToggleVisible}
          disabled={busy || !guide.isUploaded || !canManage}
        />
        <span>Make visible to users</span>
      </label>

      {error && (
        <p className="pdf-guides-admin__error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="pdf-guides-admin__message" role="status">
          {message}
        </p>
      )}
    </article>
  )
}

function PdfGuidesAdmin() {
  const { user } = useAuth()
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadGuides = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoadError('Supabase is not configured for this build.')
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError('')

    try {
      const records = await fetchPdfLibraryRecords()
      setGuides(records)
    } catch (error) {
      setLoadError(error.message || 'Could not load PDF guides.')
      setGuides([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGuides()
  }, [loadGuides])

  return (
    <section className="pdf-guides-admin" aria-labelledby="pdf-guides-admin-title">
      <header className="pdf-guides-admin__header">
        <h2 id="pdf-guides-admin-title" className="pdf-guides-admin__title">
          Bonus PDF Guides
        </h2>
        <p className="pdf-guides-admin__subtitle">
          Upload guides to Supabase Storage (
          <code>bonus_guides</code>
          ) · Max {PDF_MAX_BYTES / (1024 * 1024)}MB · PDF only
        </p>
        {!user && isSupabaseConfigured && (
          <p className="pdf-guides-admin__auth-note">
            Sign in from Home to upload and manage PDFs.
          </p>
        )}
      </header>

      {loading && (
        <p className="pdf-guides-admin__loading" role="status">
          Loading PDF library…
        </p>
      )}

      {loadError && (
        <div className="pdf-guides-admin__alert" role="alert">
          <p>{loadError}</p>
          <p className="pdf-guides-admin__alert-hint">
            Run the SQL setup in
            {' '}
            <code>supabase/pdf_library_setup.sql</code>
            {' '}
            to create the bucket and table.
          </p>
        </div>
      )}

      {!loading && !loadError && (
        <div className="pdf-guides-admin__list">
          {guides.map((guide) => (
            <PdfGuideCard
              key={guide.id}
              guide={guide}
              onRefresh={loadGuides}
              canManage={Boolean(user)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default PdfGuidesAdmin
