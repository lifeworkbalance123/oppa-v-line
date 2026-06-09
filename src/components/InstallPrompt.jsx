import { useEffect, useState } from 'react'
import './InstallPrompt.css'

const STORAGE_KEY = 'oppa-v-line-install-prompt-dismissed'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function getPlatform() {
  const userAgent = navigator.userAgent

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return 'ios'
  }

  if (/Android/i.test(userAgent)) {
    return 'android'
  }

  return 'other'
}

function wasDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState('other')

  useEffect(() => {
    const detectedPlatform = getPlatform()

    if (
      wasDismissed() ||
      isStandalone() ||
      (detectedPlatform !== 'ios' && detectedPlatform !== 'android')
    ) {
      return
    }

    setPlatform(detectedPlatform)
    setVisible(true)
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // Ignore storage errors and still hide the banner.
    }
    setVisible(false)
  }

  if (!visible) {
    return null
  }

  const instructions =
    platform === 'ios'
      ? 'Tap Share → Add to Home Screen'
      : 'Tap Menu (⋮) → Install App'

  return (
    <aside
      className="install-prompt"
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-instructions"
    >
      <button
        type="button"
        className="install-prompt__close"
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
      >
        ×
      </button>

      <div className="install-prompt__content">
        <p className="install-prompt__eyebrow">Install OPPA V-LINE</p>
        <h2 className="install-prompt__title" id="install-prompt-title">
          Add to your home screen
        </h2>
        <p className="install-prompt__instructions" id="install-prompt-instructions">
          {instructions}
        </p>
        <button
          type="button"
          className="install-prompt__dismiss"
          onClick={handleDismiss}
        >
          Got it
        </button>
      </div>
    </aside>
  )
}

export default InstallPrompt
