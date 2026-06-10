import { useCallback, useEffect, useState } from 'react'
import { PDF_GUIDE_CATALOG } from '../lib/pdfGuideCatalog'
import { trackPdfEvent } from '../lib/pdfAnalytics'
import {
  cachePdfForOffline,
  fetchPdfBlob,
  getOfflinePdfBlobUrl,
  isPdfAvailableOffline,
} from '../lib/pdfCache'
import { fetchActivePdfGuides } from '../lib/pdfLibrary'
import PdfViewerModal from './PdfViewerModal'
import UpgradeModal from './UpgradeModal'
import './BonusGuidesSection.css'

function formatFileSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function PdfActionModal({ guide, open, onClose, onRead, onDownload, loading }) {
  if (!open || !guide) return null

  return (
    <div className="bonus-guides__action-modal" role="dialog" aria-modal="true">
      <button type="button" className="bonus-guides__action-backdrop" onClick={onClose} aria-label="Close" />
      <div className="bonus-guides__action-panel">
        <h3 className="bonus-guides__action-title">{guide.title}</h3>
        <p className="bonus-guides__action-meta">
          {formatFileSize(guide.fileSize)} · Updated {formatDate(guide.uploadedAt)}
        </p>
        <div className="bonus-guides__action-buttons">
          <button
            type="button"
            className="bonus-guides__action-btn bonus-guides__action-btn--primary"
            onClick={onRead}
            disabled={loading}
          >
            Read Now
          </button>
          <button
            type="button"
            className="bonus-guides__action-btn"
            onClick={onDownload}
            disabled={loading}
          >
            {loading ? 'Downloading…' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BonusGuidesSection({ isPremium, onUpgrade, upgradeLoading, upgradeError, onClearUpgradeError }) {
  const [guides, setGuides] = useState(PDF_GUIDE_CATALOG)
  const [offlineMap, setOfflineMap] = useState({})
  const [loadingGuides, setLoadingGuides] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [selectedGuide, setSelectedGuide] = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [viewer, setViewer] = useState({ open: false, title: '', url: '' })

  const refreshOffline = useCallback(() => {
    const map = {}
    PDF_GUIDE_CATALOG.forEach((guide) => {
      map[guide.id] = isPdfAvailableOffline(guide.id)
    })
    setOfflineMap(map)
  }, [])

  const loadGuides = useCallback(async () => {
    if (!isPremium) {
      setGuides(PDF_GUIDE_CATALOG)
      return
    }

    setLoadingGuides(true)
    setLoadError('')

    try {
      const activeGuides = await fetchActivePdfGuides()
      setGuides(activeGuides)
    } catch (error) {
      setLoadError(error.message || 'Could not load bonus guides.')
    } finally {
      setLoadingGuides(false)
    }
  }, [isPremium])

  useEffect(() => {
    loadGuides()
    refreshOffline()
  }, [loadGuides, refreshOffline])

  const resolvePdfUrl = async (guide) => {
    const offlineUrl = await getOfflinePdfBlobUrl(guide.id)
    if (offlineUrl) return offlineUrl
    if (!guide.publicUrl) throw new Error('This guide is not available yet.')
    const blob = await fetchPdfBlob(guide.publicUrl)
    return URL.createObjectURL(blob)
  }

  const handleGuideTap = (guide) => {
    if (!isPremium) {
      onClearUpgradeError?.()
      setShowUpgrade(true)
      return
    }

    if (!guide.isActive || !guide.publicUrl) {
      setLoadError('This guide is not available yet. Check back soon.')
      return
    }

    setSelectedGuide(guide)
    setShowActions(true)
  }

  const handleRead = async () => {
    if (!selectedGuide) return
    setActionLoading(true)
    trackPdfEvent('read', selectedGuide.id)

    try {
      const url = await resolvePdfUrl(selectedGuide)
      if (selectedGuide.publicUrl && !isPdfAvailableOffline(selectedGuide.id)) {
        try {
          await cachePdfForOffline(selectedGuide.id, selectedGuide.publicUrl)
          refreshOffline()
        } catch {
          // Reading can still proceed without offline cache.
        }
      }
      setViewer({ open: true, title: selectedGuide.title, url })
      setShowActions(false)
    } catch (error) {
      setLoadError(error.message || 'Could not open PDF.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!selectedGuide?.publicUrl) return
    setActionLoading(true)
    trackPdfEvent('download', selectedGuide.id)

    try {
      const blob = await cachePdfForOffline(selectedGuide.id, selectedGuide.publicUrl)
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = selectedGuide.fileName || `${selectedGuide.slug}.pdf`
      link.click()
      URL.revokeObjectURL(blobUrl)
      refreshOffline()
      setShowActions(false)
    } catch (error) {
      setLoadError(error.message || 'Download failed.')
    } finally {
      setActionLoading(false)
    }
  }

  const closeViewer = () => {
    if (viewer.url?.startsWith('blob:')) {
      URL.revokeObjectURL(viewer.url)
    }
    setViewer({ open: false, title: '', url: '' })
  }

  return (
    <section className="bonus-guides" aria-labelledby="bonus-guides-title">
      <header className="bonus-guides__header">
        <h2 id="bonus-guides-title" className="bonus-guides__title">
          BONUS GUIDES
        </h2>
        {!isPremium && (
          <p className="bonus-guides__locked-note">
            🔒 Upgrade to unlock all 5 PDF guides
          </p>
        )}
      </header>

      {loadingGuides && (
        <p className="bonus-guides__loading" role="status">
          Loading guides…
        </p>
      )}

      {loadError && (
        <p className="bonus-guides__error" role="alert">
          {loadError}
        </p>
      )}

      <ul className="bonus-guides__list">
        {guides.map((guide) => {
          const isLocked = !isPremium
          const isOffline = offlineMap[guide.id]

          return (
            <li key={guide.id}>
              <button
                type="button"
                className={`bonus-guides__item${isLocked ? ' bonus-guides__item--locked' : ''}`}
                onClick={() => handleGuideTap(guide)}
              >
                <span className="bonus-guides__icon" aria-hidden="true">
                  {isLocked ? '🔒' : '📖'}
                </span>
                <span className="bonus-guides__info">
                  <span className="bonus-guides__name">{guide.title}</span>
                  {isPremium && guide.isActive && (
                    <span className="bonus-guides__meta">
                      {formatFileSize(guide.fileSize)} · {formatDate(guide.uploadedAt)}
                    </span>
                  )}
                  {!isPremium && (
                    <span className="bonus-guides__meta">Upgrade to unlock</span>
                  )}
                  {isPremium && !guide.isActive && (
                    <span className="bonus-guides__meta">Coming soon</span>
                  )}
                </span>
                {isOffline && (
                  <span className="bonus-guides__offline-badge">Available Offline</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={async () => {
          await onUpgrade()
        }}
        loading={upgradeLoading}
        error={upgradeError}
      />

      <PdfActionModal
        guide={selectedGuide}
        open={showActions}
        onClose={() => setShowActions(false)}
        onRead={handleRead}
        onDownload={handleDownload}
        loading={actionLoading}
      />

      <PdfViewerModal
        open={viewer.open}
        title={viewer.title}
        pdfUrl={viewer.url}
        onClose={closeViewer}
      />
    </section>
  )
}

export default BonusGuidesSection
