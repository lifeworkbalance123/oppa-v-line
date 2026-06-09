import { useEffect, useId, useMemo, useState } from 'react'
import './VideoWithFallback.css'

function getYouTubeEmbedUrl(url) {
  if (!url) return null

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace('www.', '')

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.slice(1)
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const videoId = parsed.searchParams.get('v')
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }

      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?]+)/)
      if (embedMatch?.[1]) {
        return `https://www.youtube.com/embed/${embedMatch[1]}`
      }
    }
  } catch {
    return null
  }

  return null
}

function TextInstructions({ exerciseName, steps, stepsId }) {
  if (!steps.length) {
    return (
      <p className="video-fallback__empty">
        No text instructions are available for {exerciseName}.
      </p>
    )
  }

  return (
    <ol className="video-fallback__steps" id={stepsId}>
      {steps.map((step, index) => (
        <li key={`${exerciseName}-step-${index}`} className="video-fallback__step">
          {step}
        </li>
      ))}
    </ol>
  )
}

function VideoWithFallback({ exerciseName, youtubeUrl, steps = [] }) {
  const titleId = useId()
  const stepsId = useId()
  const statusId = useId()
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine,
  )
  const [preferTextMode, setPreferTextMode] = useState(false)

  const embedUrl = useMemo(() => getYouTubeEmbedUrl(youtubeUrl), [youtubeUrl])
  const safeSteps = useMemo(
    () => steps.filter((step) => typeof step === 'string' && step.trim()),
    [steps],
  )

  const showVideo = isOnline && !preferTextMode && Boolean(embedUrl)
  const showText = !showVideo
  const statusMessage = !isOnline
    ? 'You are offline. Showing text instructions.'
    : preferTextMode
      ? 'Showing text instructions.'
      : !embedUrl
        ? 'Video unavailable. Showing text instructions.'
        : 'Showing video.'

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => {
      setIsOnline(false)
      setPreferTextMode(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (isOnline && embedUrl) {
      setPreferTextMode(false)
    }
  }, [exerciseName, isOnline, embedUrl])

  const handleToggleMode = () => {
    setPreferTextMode((prev) => !prev)
  }

  return (
    <section
      className="video-fallback"
      aria-labelledby={titleId}
      aria-describedby={statusId}
    >
      <div className="video-fallback__header">
        <h2 className="video-fallback__title" id={titleId}>
          {exerciseName}
        </h2>
        <p className="video-fallback__status" id={statusId} role="status">
          {statusMessage}
        </p>
      </div>

      {isOnline && embedUrl && (
        <div className="video-fallback__toolbar">
          <button
            type="button"
            className="video-fallback__toggle"
            onClick={handleToggleMode}
            aria-pressed={preferTextMode}
            aria-controls={showText ? stepsId : undefined}
          >
            {preferTextMode ? 'Switch to video' : 'Video not loading? View text'}
          </button>
        </div>
      )}

      {showVideo ? (
        <div className="video-fallback__embed-wrapper">
          <iframe
            className="video-fallback__embed"
            src={embedUrl}
            title={`${exerciseName} exercise video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className="video-fallback__instructions"
          role="region"
          aria-label={`${exerciseName} text instructions`}
        >
          {!isOnline && (
            <p className="video-fallback__offline-note">
              You are currently offline. Follow these steps until your connection
              returns.
            </p>
          )}
          <TextInstructions
            exerciseName={exerciseName}
            steps={safeSteps}
            stepsId={stepsId}
          />
        </div>
      )}
    </section>
  )
}

export default VideoWithFallback
