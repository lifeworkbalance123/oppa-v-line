import { useState } from 'react'
import { ADMIN_EXERCISES } from '../lib/exerciseCatalog'
import {
  getYouTubeEmbedUrl,
  loadExerciseSettings,
  updateExerciseSetting,
  validateAndReadAnatomyImage,
  validateAndReadMp4,
} from '../lib/exerciseSettings'
import './AdminPanel.css'

function buildPreview(saved, exercise) {
  const youtubeUrl = saved.youtubeUrl?.trim() || exercise.defaultYoutubeUrl

  return {
    youtubeUrl,
    isCustomYoutube: Boolean(saved.youtubeUrl?.trim()),
    youtubeEmbedUrl: getYouTubeEmbedUrl(youtubeUrl),
    mp4DataUrl: saved.mp4DataUrl,
    mp4FileName: saved.mp4FileName,
    anatomyDataUrl: saved.anatomyDataUrl,
    anatomyFileName: saved.anatomyFileName,
    updatedAt: saved.updatedAt,
  }
}

function ExercisePreview({ exercise, preview }) {
  const hasMp4 = Boolean(preview.mp4DataUrl)
  const hasAnatomy = Boolean(preview.anatomyDataUrl)
  const hasCustomMedia = preview.isCustomYoutube || hasMp4 || hasAnatomy

  if (!hasCustomMedia) {
    return (
      <p className="admin-panel__preview-empty">
        No custom media saved yet. Defaults are used in the library.
      </p>
    )
  }

  return (
    <div className="admin-panel__preview">
      {preview.isCustomYoutube && (
        <div className="admin-panel__preview-block">
          <h4 className="admin-panel__preview-label">YouTube</h4>
          <p className="admin-panel__preview-meta">{preview.youtubeUrl}</p>
          {preview.youtubeEmbedUrl ? (
            <div className="admin-panel__preview-embed">
              <iframe
                src={preview.youtubeEmbedUrl}
                title={`${exercise.name} YouTube preview`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <p className="admin-panel__preview-warning">Link saved, but embed URL is invalid.</p>
          )}
        </div>
      )}

      {hasMp4 && (
        <div className="admin-panel__preview-block">
          <h4 className="admin-panel__preview-label">MP4</h4>
          <p className="admin-panel__preview-meta">{preview.mp4FileName || 'Uploaded video'}</p>
          <video
            className="admin-panel__preview-video"
            src={preview.mp4DataUrl}
            controls
            playsInline
            preload="metadata"
          />
        </div>
      )}

      {hasAnatomy && (
        <div className="admin-panel__preview-block">
          <h4 className="admin-panel__preview-label">Anatomy image</h4>
          <p className="admin-panel__preview-meta">{preview.anatomyFileName || 'Uploaded image'}</p>
          <img
            className="admin-panel__preview-image"
            src={preview.anatomyDataUrl}
            alt={`${exercise.name} anatomy`}
          />
        </div>
      )}

      {preview.updatedAt && (
        <p className="admin-panel__preview-updated">
          Last updated {new Date(preview.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}

function ExerciseAdminCard({ exercise, settings, onSettingsChange }) {
  const saved = settings[exercise.id]
  const preview = buildPreview(saved, exercise)
  const [youtubeDraft, setYoutubeDraft] = useState(
    saved.youtubeUrl || exercise.defaultYoutubeUrl,
  )
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const showMessage = (text) => {
    setMessage(text)
  }

  const handleSetYoutube = () => {
    const trimmed = youtubeDraft.trim()
    if (!trimmed) {
      showMessage('Enter a YouTube URL before saving.')
      return
    }

    onSettingsChange(
      updateExerciseSetting(exercise.id, { youtubeUrl: trimmed }),
    )
    showMessage('YouTube link saved.')
  }

  const handleMp4Upload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    try {
      setIsUploading(true)
      const dataUrl = await validateAndReadMp4(file)
      onSettingsChange(
        updateExerciseSetting(exercise.id, {
          mp4DataUrl: dataUrl,
          mp4FileName: file.name,
        }),
      )
      showMessage('MP4 uploaded and saved.')
    } catch (error) {
      showMessage(error.message || 'Could not upload MP4.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleAnatomyUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    try {
      setIsUploading(true)
      const dataUrl = await validateAndReadAnatomyImage(file)
      onSettingsChange(
        updateExerciseSetting(exercise.id, {
          anatomyDataUrl: dataUrl,
          anatomyFileName: file.name,
        }),
      )
      showMessage('Anatomy image uploaded and saved.')
    } catch (error) {
      showMessage(error.message || 'Could not upload anatomy image.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClearMp4 = () => {
    onSettingsChange(
      updateExerciseSetting(exercise.id, {
        mp4DataUrl: null,
        mp4FileName: null,
      }),
    )
    showMessage('MP4 removed.')
  }

  const handleClearAnatomy = () => {
    onSettingsChange(
      updateExerciseSetting(exercise.id, {
        anatomyDataUrl: null,
        anatomyFileName: null,
      }),
    )
    showMessage('Anatomy image removed.')
  }

  const handleResetYoutube = () => {
    setYoutubeDraft(exercise.defaultYoutubeUrl)
    onSettingsChange(
      updateExerciseSetting(exercise.id, { youtubeUrl: '' }),
    )
    showMessage('YouTube link reset to default.')
  }

  return (
    <article className="admin-panel__card">
      <header className="admin-panel__card-header">
        <h3 className="admin-panel__card-title">{exercise.name}</h3>
        <p className="admin-panel__card-id">{exercise.id}</p>
      </header>

      <div className="admin-panel__field">
        <label className="admin-panel__label" htmlFor={`${exercise.id}-youtube`}>
          YouTube link
        </label>
        <div className="admin-panel__input-row">
          <input
            id={`${exercise.id}-youtube`}
            type="url"
            className="admin-panel__input"
            value={youtubeDraft}
            onChange={(event) => setYoutubeDraft(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <button
            type="button"
            className="admin-panel__btn admin-panel__btn--primary"
            onClick={handleSetYoutube}
          >
            Set
          </button>
        </div>
        <button
          type="button"
          className="admin-panel__link-btn"
          onClick={handleResetYoutube}
        >
          Reset to default
        </button>
      </div>

      <div className="admin-panel__field">
        <label className="admin-panel__label" htmlFor={`${exercise.id}-mp4`}>
          MP4 upload
        </label>
        <div className="admin-panel__upload-row">
          <input
            id={`${exercise.id}-mp4`}
            type="file"
            accept="video/mp4,.mp4"
            className="admin-panel__file-input"
            onChange={handleMp4Upload}
            disabled={isUploading}
          />
          {saved.mp4FileName && (
            <button
              type="button"
              className="admin-panel__link-btn"
              onClick={handleClearMp4}
            >
              Remove MP4
            </button>
          )}
        </div>
        <p className="admin-panel__hint">
          {saved.mp4FileName ? `Current: ${saved.mp4FileName}` : 'No MP4 uploaded'}
        </p>
      </div>

      <div className="admin-panel__field">
        <label className="admin-panel__label" htmlFor={`${exercise.id}-anatomy`}>
          Anatomy image upload
        </label>
        <div className="admin-panel__upload-row">
          <input
            id={`${exercise.id}-anatomy`}
            type="file"
            accept="image/png,image/jpeg,.png,.jpg,.jpeg"
            className="admin-panel__file-input"
            onChange={handleAnatomyUpload}
            disabled={isUploading}
          />
          {saved.anatomyFileName && (
            <button
              type="button"
              className="admin-panel__link-btn"
              onClick={handleClearAnatomy}
            >
              Remove image
            </button>
          )}
        </div>
        <p className="admin-panel__hint">
          {saved.anatomyFileName ? `Current: ${saved.anatomyFileName}` : 'No anatomy image uploaded'}
        </p>
      </div>

      <div className="admin-panel__preview-section">
        <h4 className="admin-panel__preview-title">Current settings preview</h4>
        <ExercisePreview exercise={exercise} preview={preview} />
      </div>

      {message && (
        <p className="admin-panel__message" role="status">
          {message}
        </p>
      )}
    </article>
  )
}

function AdminPanel() {
  const [settings, setSettings] = useState(() => loadExerciseSettings())

  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <h1 className="admin-panel__title">Exercise Admin</h1>
        <p className="admin-panel__subtitle">
          Manage demo videos and anatomy images. Settings are stored in localStorage for now.
        </p>
      </header>

      <div className="admin-panel__list">
        {ADMIN_EXERCISES.map((exercise) => (
          <ExerciseAdminCard
            key={exercise.id}
            exercise={exercise}
            settings={settings}
            onSettingsChange={setSettings}
          />
        ))}
      </div>
    </section>
  )
}

export default AdminPanel
