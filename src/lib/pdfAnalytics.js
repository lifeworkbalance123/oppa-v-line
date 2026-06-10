const ANALYTICS_KEY = 'oppa-vline-pdf-analytics'

function loadEvents() {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function trackPdfEvent(action, guideId, metadata = {}) {
  try {
    const events = loadEvents()
    events.push({
      action,
      guideId,
      metadata,
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events.slice(-200)))
  } catch {
    // Ignore analytics storage errors.
  }
}
