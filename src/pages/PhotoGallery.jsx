import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addProgressPhoto,
  deleteProgressPhoto,
  loadProgressPhotos,
} from '../lib/progressPhotos'
import './PhotoGallery.css'

function PhotoGallery() {
  const fileInputRef = useRef(null)
  const [store, setStore] = useState(loadProgressPhotos)
  const [message, setMessage] = useState('')
  const [compareIds, setCompareIds] = useState([])

  const photos = store.photos
  const comparePhotos = photos.filter((photo) => compareIds.includes(photo.id))

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    try {
      const next = await addProgressPhoto(file)
      setStore(next)
      setMessage('Photo saved to your progress gallery.')
    } catch (error) {
      setMessage(error.message || 'Could not upload photo.')
    }
  }

  const handleDelete = (photoId) => {
    const next = deleteProgressPhoto(photoId)
    setStore(next)
    setCompareIds((prev) => prev.filter((id) => id !== photoId))
  }

  const toggleCompare = (photoId) => {
    setCompareIds((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId)
      }
      if (prev.length >= 2) {
        return [prev[1], photoId]
      }
      return [...prev, photoId]
    })
  }

  return (
    <section className="photo-gallery">
      <header className="photo-gallery__header">
        <Link to="/progress" className="photo-gallery__back">
          ← Back to Progress
        </Link>
        <h1 className="photo-gallery__title">Progress Photos</h1>
        <p className="photo-gallery__subtitle">
          Upload progress selfies to compare your 42-day transformation.
        </p>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        className="photo-gallery__file-input"
        onChange={handleUpload}
      />

      <button
        type="button"
        className="photo-gallery__upload"
        onClick={() => fileInputRef.current?.click()}
      >
        Add Progress Photo
      </button>

      {comparePhotos.length === 2 && (
        <section className="photo-gallery__compare" aria-label="Photo comparison">
          <h2 className="photo-gallery__compare-title">Compare</h2>
          <div className="photo-gallery__compare-grid">
            {comparePhotos.map((photo) => (
              <figure key={photo.id} className="photo-gallery__compare-item">
                <img src={photo.dataUrl} alt={`${photo.label} on ${photo.date}`} />
                <figcaption>{photo.label} · {photo.date}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {photos.length === 0 ? (
        <p className="photo-gallery__empty">No photos yet. Add your first progress photo.</p>
      ) : (
        <div className="photo-gallery__grid">
          {photos.map((photo) => {
            const isSelected = compareIds.includes(photo.id)

            return (
              <article key={photo.id} className="photo-gallery__card">
                <img src={photo.dataUrl} alt={`${photo.label} on ${photo.date}`} />
                <div className="photo-gallery__card-meta">
                  <p>{photo.label}</p>
                  <span>{photo.date}</span>
                </div>
                <div className="photo-gallery__card-actions">
                  <button
                    type="button"
                    className={`photo-gallery__compare-btn${isSelected ? ' photo-gallery__compare-btn--active' : ''}`}
                    onClick={() => toggleCompare(photo.id)}
                  >
                    {isSelected ? 'Selected' : 'Compare'}
                  </button>
                  <button
                    type="button"
                    className="photo-gallery__delete-btn"
                    onClick={() => handleDelete(photo.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {message && (
        <p className="photo-gallery__message" role="status">
          {message}
        </p>
      )}
    </section>
  )
}

export default PhotoGallery
