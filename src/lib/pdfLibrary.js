import { PDF_BUCKET, PDF_GUIDE_CATALOG, PDF_MAX_BYTES } from './pdfGuideCatalog'
import { isSupabaseConfigured, supabase } from './supabase'

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
  return supabase
}

function normalizeError(error, fallbackMessage) {
  if (error instanceof Error) {
    return error
  }
  return new Error(error?.message || fallbackMessage)
}

function getUploadTimestamp() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function buildStoragePath(slug) {
  return `${slug}_${getUploadTimestamp()}.pdf`
}

function getFileNameFromPath(storagePath) {
  if (!storagePath) return null
  return storagePath.split('/').pop()
}

export function validatePdfFile(file) {
  if (!file) {
    throw new Error('No file selected.')
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    throw new Error('Please select a PDF file (application/pdf).')
  }

  if (file.size > PDF_MAX_BYTES) {
    throw new Error('PDF must be 20 MB or smaller.')
  }
}

export async function fetchActivePdfGuides() {
  if (!isSupabaseConfigured || !supabase) {
    return PDF_GUIDE_CATALOG.map((guide) => ({
      ...guide,
      isActive: false,
      storagePath: null,
      fileName: null,
      uploadedAt: null,
      fileSize: null,
      publicUrl: null,
    }))
  }

  const { data, error } = await supabase
    .from('pdf_library')
    .select('id, title, storage_path, is_active, uploaded_at, file_size')
    .eq('is_active', true)

  if (error) {
    throw normalizeError(error, 'Could not load bonus guides.')
  }

  const recordMap = new Map((data ?? []).map((record) => [record.id, record]))

  return PDF_GUIDE_CATALOG.map((guide) => {
    const record = recordMap.get(guide.id)
    const storagePath = record?.storage_path ?? null
    const isActive = Boolean(record?.is_active && storagePath)

    return {
      ...guide,
      title: record?.title ?? guide.title,
      isActive,
      storagePath: isActive ? storagePath : null,
      fileName: getFileNameFromPath(storagePath),
      uploadedAt: record?.uploaded_at ?? null,
      fileSize: record?.file_size ?? null,
      publicUrl: isActive ? getPdfPublicUrl(storagePath) : null,
    }
  })
}

export async function fetchPdfLibraryRecords() {
  const client = ensureClient()
  const { data, error } = await client
    .from('pdf_library')
    .select('id, title, storage_path, is_active, uploaded_at, file_size')
    .in('id', PDF_GUIDE_CATALOG.map((guide) => guide.id))

  if (error) {
    throw normalizeError(error, 'Could not load PDF library.')
  }

  const recordMap = new Map((data ?? []).map((record) => [record.id, record]))

  return PDF_GUIDE_CATALOG.map((guide) => {
    const record = recordMap.get(guide.id)
    return {
      ...guide,
      record,
      isUploaded: Boolean(record?.storage_path),
      fileName: getFileNameFromPath(record?.storage_path),
      isActive: Boolean(record?.is_active),
      uploadedAt: record?.uploaded_at ?? null,
      fileSize: record?.file_size ?? null,
      storagePath: record?.storage_path ?? null,
    }
  })
}

export function getPdfPublicUrl(storagePath) {
  if (!storagePath || !isSupabaseConfigured || !supabase) {
    return null
  }

  const { data } = supabase.storage.from(PDF_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

async function removeStorageObject(storagePath) {
  if (!storagePath) return
  const client = ensureClient()
  const { error } = await client.storage.from(PDF_BUCKET).remove([storagePath])
  if (error) {
    throw normalizeError(error, 'Could not delete PDF from storage.')
  }
}

export async function uploadPdfGuide({ guide, file, onProgress }) {
  validatePdfFile(file)
  const client = ensureClient()

  onProgress?.(10)

  let storagePath = buildStoragePath(guide.slug)
  let uploadResult = await client.storage
    .from(PDF_BUCKET)
    .upload(storagePath, file, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadResult.error?.message?.toLowerCase().includes('already exists')) {
    storagePath = `${guide.slug}_${Date.now()}.pdf`
    uploadResult = await client.storage
      .from(PDF_BUCKET)
      .upload(storagePath, file, {
        contentType: 'application/pdf',
        upsert: false,
      })
  }

  if (uploadResult.error) {
    throw normalizeError(uploadResult.error, 'PDF upload failed.')
  }

  onProgress?.(75)

  if (guide.storagePath && guide.storagePath !== storagePath) {
    try {
      await removeStorageObject(guide.storagePath)
    } catch {
      // Keep going if old file cleanup fails.
    }
  }

  const { data, error } = await client
    .from('pdf_library')
    .upsert({
      id: guide.id,
      title: guide.title,
      storage_path: storagePath,
      is_active: guide.isActive ?? false,
      uploaded_at: new Date().toISOString(),
      file_size: file.size,
    })
    .select()
    .single()

  onProgress?.(100)

  if (error) {
    await client.storage.from(PDF_BUCKET).remove([storagePath])
    throw normalizeError(error, 'Could not save PDF metadata.')
  }

  return data
}

export async function deletePdfGuide(guide) {
  const client = ensureClient()

  if (guide.storagePath) {
    await removeStorageObject(guide.storagePath)
  }

  const { error } = await client
    .from('pdf_library')
    .delete()
    .eq('id', guide.id)

  if (error) {
    throw normalizeError(error, 'Could not delete PDF record.')
  }
}

export async function setPdfGuideActive(guide, isActive) {
  const client = ensureClient()

  if (!guide.storagePath) {
    throw new Error('Upload a PDF before making it visible to users.')
  }

  const { data, error } = await client
    .from('pdf_library')
    .upsert({
      id: guide.id,
      title: guide.title,
      storage_path: guide.storagePath,
      is_active: isActive,
      uploaded_at: guide.uploadedAt ?? new Date().toISOString(),
      file_size: guide.fileSize,
    })
    .select()
    .single()

  if (error) {
    throw normalizeError(error, 'Could not update visibility.')
  }

  return data
}
