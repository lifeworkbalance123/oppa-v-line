export const PHOTOS_STORAGE_KEY = 'oppa-v-line-progress-photos'
const MAX_PHOTO_BYTES = 2 * 1024 * 1024

function createDefaultStore() {
  return { photos: [] }
}

export function loadProgressPhotos() {
  try {
    const stored = localStorage.getItem(PHOTOS_STORAGE_KEY)
    if (!stored) return createDefaultStore()
    const parsed = JSON.parse(stored)
    return {
      photos: Array.isArray(parsed.photos) ? parsed.photos : [],
    }
  } catch {
    return createDefaultStore()
  }
}

export function saveProgressPhotos(store) {
  localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(store))
}

export async function addProgressPhoto(file, label = 'Progress') {
  if (!file) {
    throw new Error('No photo selected.')
  }

  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name)
  if (!isImage) {
    throw new Error('Please select an image file.')
  }

  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error('Photo must be 2 MB or smaller.')
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read photo.'))
    reader.readAsDataURL(file)
  })

  const store = loadProgressPhotos()
  store.photos.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString().slice(0, 10),
    label,
    dataUrl,
  })
  saveProgressPhotos(store)
  return store
}

export function deleteProgressPhoto(photoId) {
  const store = loadProgressPhotos()
  store.photos = store.photos.filter((photo) => photo.id !== photoId)
  saveProgressPhotos(store)
  return store
}
