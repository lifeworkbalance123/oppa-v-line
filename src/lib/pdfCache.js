const OFFLINE_META_KEY = 'oppa-vline-pdf-offline-meta'
const PDF_CACHE_NAME = 'oppa-vline-pdf-cache-v1'

function loadMeta() {
  try {
    const stored = localStorage.getItem(OFFLINE_META_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveMeta(meta) {
  localStorage.setItem(OFFLINE_META_KEY, JSON.stringify(meta))
}

export function isPdfAvailableOffline(guideId) {
  return Boolean(loadMeta()[guideId])
}

export function getOfflineMeta(guideId) {
  return loadMeta()[guideId] ?? null
}

export async function cachePdfForOffline(guideId, url) {
  const cache = await caches.open(PDF_CACHE_NAME)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Could not download PDF for offline access.')
  }

  await cache.put(url, response.clone())

  const meta = loadMeta()
  meta[guideId] = {
    url,
    cachedAt: new Date().toISOString(),
  }
  saveMeta(meta)

  return response.blob()
}

export async function getOfflinePdfBlobUrl(guideId) {
  const meta = loadMeta()[guideId]
  if (!meta?.url) return null

  const cache = await caches.open(PDF_CACHE_NAME)
  const match = await cache.match(meta.url)
  if (!match) return null

  const blob = await match.blob()
  return URL.createObjectURL(blob)
}

export async function fetchPdfBlob(url) {
  const cache = await caches.open(PDF_CACHE_NAME)
  const cached = await cache.match(url)
  if (cached) {
    return cached.blob()
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Could not load PDF.')
  }

  await cache.put(url, response.clone())
  return response.blob()
}
