import { ADMIN_EXERCISES } from './exerciseCatalog'

export const EXERCISE_SETTINGS_KEY = 'oppa-v-line-exercise-settings'

const MAX_MP4_BYTES = 4 * 1024 * 1024
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export function getYouTubeEmbedUrl(url) {
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

function createEmptySettings() {
  return ADMIN_EXERCISES.reduce((acc, exercise) => {
    acc[exercise.id] = {
      youtubeUrl: '',
      mp4DataUrl: null,
      mp4FileName: null,
      anatomyDataUrl: null,
      anatomyFileName: null,
      updatedAt: null,
    }
    return acc
  }, {})
}

export function loadExerciseSettings() {
  try {
    const stored = localStorage.getItem(EXERCISE_SETTINGS_KEY)
    if (!stored) return createEmptySettings()

    const parsed = JSON.parse(stored)
    const base = createEmptySettings()

    ADMIN_EXERCISES.forEach((exercise) => {
      const saved = parsed[exercise.id]
      if (!saved || typeof saved !== 'object') return

      base[exercise.id] = {
        youtubeUrl: typeof saved.youtubeUrl === 'string' ? saved.youtubeUrl : '',
        mp4DataUrl: typeof saved.mp4DataUrl === 'string' ? saved.mp4DataUrl : null,
        mp4FileName: typeof saved.mp4FileName === 'string' ? saved.mp4FileName : null,
        anatomyDataUrl: typeof saved.anatomyDataUrl === 'string' ? saved.anatomyDataUrl : null,
        anatomyFileName: typeof saved.anatomyFileName === 'string' ? saved.anatomyFileName : null,
        updatedAt: typeof saved.updatedAt === 'string' ? saved.updatedAt : null,
      }
    })

    return base
  } catch {
    return createEmptySettings()
  }
}

export function saveExerciseSettings(settings) {
  localStorage.setItem(EXERCISE_SETTINGS_KEY, JSON.stringify(settings))
}

export function updateExerciseSetting(exerciseId, patch) {
  const settings = loadExerciseSettings()
  settings[exerciseId] = {
    ...settings[exerciseId],
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  saveExerciseSettings(settings)
  return settings
}

export function getEffectiveYoutubeUrl(exerciseId, fallback = '') {
  const settings = loadExerciseSettings()
  const saved = settings[exerciseId]?.youtubeUrl?.trim()
  return saved || fallback
}

export function getExercisePreview(exerciseId, fallbackYoutubeUrl = '') {
  const settings = loadExerciseSettings()[exerciseId] ?? {}
  const youtubeUrl = settings.youtubeUrl?.trim() || fallbackYoutubeUrl

  return {
    youtubeUrl,
    youtubeEmbedUrl: getYouTubeEmbedUrl(youtubeUrl),
    mp4DataUrl: settings.mp4DataUrl,
    mp4FileName: settings.mp4FileName,
    anatomyDataUrl: settings.anatomyDataUrl,
    anatomyFileName: settings.anatomyFileName,
    updatedAt: settings.updatedAt,
  }
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.readAsDataURL(file)
  })
}

export async function validateAndReadMp4(file) {
  if (!file) {
    throw new Error('No file selected.')
  }

  const isMp4 = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4')
  if (!isMp4) {
    throw new Error('Please select an MP4 video file.')
  }

  if (file.size > MAX_MP4_BYTES) {
    throw new Error('MP4 must be 4 MB or smaller for local storage.')
  }

  return readFileAsDataUrl(file)
}

export async function validateAndReadAnatomyImage(file) {
  if (!file) {
    throw new Error('No file selected.')
  }

  const allowedTypes = ['image/png', 'image/jpeg']
  const isImage = allowedTypes.includes(file.type)
    || /\.(png|jpe?g)$/i.test(file.name)

  if (!isImage) {
    throw new Error('Please select a PNG or JPG image.')
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Anatomy image must be 2 MB or smaller for local storage.')
  }

  return readFileAsDataUrl(file)
}
