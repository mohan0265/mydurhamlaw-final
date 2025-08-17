// src/lib/supabase/storage.ts
import { supabase } from './client'

export interface UploadOptions {
  bucket: string
  path: string
  file: File | Buffer | ArrayBuffer
  contentType?: string
  cacheControl?: string
  upsert?: boolean
}

export interface UploadResult {
  success: boolean
  path?: string
  publicUrl?: string
  signedUrl?: string
  error?: string
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const {
    bucket,
    path,
    file,
    contentType = 'audio/mpeg',
    cacheControl = '3600',
    upsert = false
  } = options

  if (!supabase) {
    return {
      success: false,
      error: 'Supabase client not available'
    }
  }

  try {
    // Convert different file types to Uint8Array for consistent upload
    let fileData: Uint8Array

    if (file instanceof File) {
      fileData = new Uint8Array(await file.arrayBuffer())
    } else if (file instanceof Buffer) {
      fileData = new Uint8Array(file)
    } else if (file instanceof ArrayBuffer) {
      fileData = new Uint8Array(file)
    } else {
      throw new Error('Unsupported file type')
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileData, {
        contentType,
        cacheControl,
        upsert
      })

    if (error) {
      console.error('Supabase storage upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    if (!data?.path) {
      return {
        success: false,
        error: 'Upload succeeded but no path returned'
      }
    }

    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    console.log('✅ File uploaded successfully:', {
      bucket,
      path: data.path,
      size: `${(fileData.byteLength / 1024).toFixed(1)}KB`
    })

    return {
      success: true,
      path: data.path,
      publicUrl: publicUrlData.publicUrl
    }

  } catch (error) {
    console.error('Storage upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    }
  }
}

/**
 * Generate signed URL for private file access
 */
export async function getSignedUrl(
  bucket: string, 
  path: string, 
  expiresIn: number = 3600
): Promise<{ signedUrl: string | null; error?: string }> {
  if (!supabase) {
    return { signedUrl: null, error: 'Supabase client not available' }
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Error creating signed URL:', error)
      return { signedUrl: null, error: error.message }
    }

    return { signedUrl: data.signedUrl }

  } catch (error) {
    console.error('Signed URL error:', error)
    return { 
      signedUrl: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Upload podcast audio file
 */
export async function uploadPodcastAudio(
  userId: string,
  date: string,
  slot: 'pre' | 'post',
  audioBuffer: ArrayBuffer
): Promise<UploadResult> {
  // Create organized path: podcasts/{userId}/{YYYY-MM-DD}/{pre|post}.mp3
  const datePath = new Date(date).toISOString().split('T')[0] // YYYY-MM-DD format
  const fileName = `${slot}.mp3`
  const filePath = `${userId}/${datePath}/${fileName}`

  return uploadFile({
    bucket: 'podcasts',
    path: filePath,
    file: audioBuffer,
    contentType: 'audio/mpeg',
    cacheControl: '86400', // 24 hours cache
    upsert: true // Allow overwriting existing files
  })
}

/**
 * Upload Durmah conversation audio
 */
export async function uploadDurmahAudio(
  userId: string,
  conversationId: string,
  audioBuffer: ArrayBuffer,
  audioType: 'user' | 'ai' = 'ai'
): Promise<UploadResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `${audioType}_${timestamp}.mp3`
  const filePath = `${userId}/${conversationId}/${fileName}`

  return uploadFile({
    bucket: 'durmah',
    path: filePath,
    file: audioBuffer,
    contentType: 'audio/mpeg',
    cacheControl: '3600', // 1 hour cache
    upsert: false
  })
}

/**
 * Delete file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not available' }
  }

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Storage delete error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ File deleted successfully:', { bucket, path })
    return { success: true }

  } catch (error) {
    console.error('Delete file error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown delete error'
    }
  }
}

/**
 * List files in a directory
 */
export async function listFiles(
  bucket: string, 
  path?: string,
  options?: {
    limit?: number
    offset?: number
    sortBy?: { column: string; order?: 'asc' | 'desc' }
  }
) {
  if (!supabase) {
    return { files: [], error: 'Supabase client not available' }
  }

  try {
    const query = supabase.storage.from(bucket).list(path, options)
    const { data, error } = await query

    if (error) {
      console.error('Storage list error:', error)
      return { files: [], error: error.message }
    }

    return { files: data || [], error: null }

  } catch (error) {
    console.error('List files error:', error)
    return { 
      files: [], 
      error: error instanceof Error ? error.message : 'Unknown list error'
    }
  }
}

/**
 * Get file size and metadata
 */
export async function getFileInfo(bucket: string, path: string) {
  if (!supabase) {
    return { info: null, error: 'Supabase client not available' }
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop()
      })

    if (error) {
      return { info: null, error: error.message }
    }

    const file = data?.find(f => f.name === path.split('/').pop())
    return { info: file, error: null }

  } catch (error) {
    return { 
      info: null, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Cleanup old podcast files (for scheduled maintenance)
 */
export async function cleanupOldPodcasts(daysOld: number = 30): Promise<{ deleted: number; errors: string[] }> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // List all podcasts
    const { files, error } = await listFiles('podcasts')
    if (error || !files) {
      return { deleted: 0, errors: [error || 'Failed to list files'] }
    }

    let deleted = 0
    const errors: string[] = []

    // Filter and delete old files
    for (const file of files) {
      if (file.updated_at && new Date(file.updated_at) < cutoffDate) {
        const deleteResult = await deleteFile('podcasts', file.name)
        if (deleteResult.success) {
          deleted++
        } else {
          errors.push(`Failed to delete ${file.name}: ${deleteResult.error}`)
        }
      }
    }

    console.log(`🧹 Cleaned up ${deleted} old podcast files`)
    return { deleted, errors }

  } catch (error) {
    console.error('Cleanup error:', error)
    return { 
      deleted: 0, 
      errors: [error instanceof Error ? error.message : 'Unknown cleanup error']
    }
  }
}