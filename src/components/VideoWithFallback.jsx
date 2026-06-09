import { useEffect, useId, useMemo, useState } from 'react'
import { getYouTubeEmbedUrl } from '../lib/exerciseSettings'
import './VideoWithFallback.css'

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

function VideoWithFallback({
  exerciseName,
  youtubeUrl,
  mp4Url = null,
  anatomyImageUrl = null,
  steps = [],
}) {
  const titleId = useId()
  const stepsId = useId()
  const statusId = useId()
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine,
  )
  const [preferTextMode, setPreferTextMode] = useState(false)

  const embedUrl = useMemo(() => getYouTubeEmbedUrl(youtubeUrl), [youtubeUrl])
  const hasMp4 = Boolean(mp4Url)
  const hasYoutube = Boolean(embedUrl) && !hasMp4
  const hasVideoSource = hasMp4 || hasYoutube
  const safeSteps = useMemo(
    () => steps.filter((step) => typeof step === 'string' && step.trim()),
    [steps],
  )

  const showVideo = !preferTextMode && (hasMp4 || (isOnline && hasYoutube))
  const showText = !showVideo

  const statusMessage = preferTextMode
    ? 'Showing text instructions.'
    : hasMp4
      ? 'Showing uploaded demo video.'
      : !isOnline
        ? 'You are offline. Showing text instructions.'
        : !hasYoutube
          ? 'Video unavailable. Showing text instructions.'
          : 'Showing video.'

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => {
      setIsOnline(false)
      if (!hasMp4) {
        setPreferTextMode(false)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [hasMp4])

  useEffect(() => {
    if (hasVideoSource) {
      setPreferTextMode(false)
    }
  }, [exerciseName, hasVideoSource, mp4Url, embedUrl])

  const handleToggleMode = () => {
    setPreferTextMode((prev) => !prev)
  }

  const canShowVideoToggle = hasVideoSource && (hasMp4 || isOnline)

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

      {canShowVideoToggle && (
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
        <div className="video-fallback__media">
          {anatomyImageUrl && (
            <img
              className="video-fallback__anatomy"
              src={anatomyImageUrl}
              alt={`${exerciseName} anatomy reference`}
            />
          )}
          <div className="video-fallback__embed-wrapper">
            {hasMp4 ? (
              <video
                className="video-fallback__video"
                src={mp4Url}
                controls
                playsInline
                preload="metadata"
                title={`${exerciseName} exercise video`}
              />
            ) : (
              <iframe
                className="video-fallback__embed"
                src={embedUrl}
                title={`${exerciseName} exercise video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            )}
          </div>
        </div>
      ) : (
        <div
          className="video-fallback__instructions"
          role="region"
          aria-label={`${exerciseName} text instructions`}
        >
          {!isOnline && !hasMp4 && (
            <p className="video-fallback__offline-note">
              You are currently offline. Follow these steps until your connection
              returns.
            </p>
          )}
          {anatomyImageUrl && (
            <img
              className="video-fallback__anatomy video-fallback__anatomy--inline"
              src={anatomyImageUrl}
              alt={`${exerciseName} anatomy reference`}
            />
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
