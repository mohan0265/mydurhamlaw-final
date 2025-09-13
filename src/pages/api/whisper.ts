// /pages/api/whisper.ts - Server-side Whisper API endpoint for audio transcription

import type { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm, File } from 'formidable'
import fs from 'fs'
import FormData from 'form-data'
import fetch from 'node-fetch'

export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle file uploads
  },
}

interface WhisperResponse {
  text: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    console.log('🎤 Whisper API endpoint called')

    // Parse the multipart form data
    const form = new IncomingForm()
    const [fields, files] = await form.parse(req)
    
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio
    const language = Array.isArray(fields.language) ? fields.language[0] : fields.language

    if (!audioFile) {
      console.error('❌ No audio file provided')
      return res.status(400).json({ error: 'No audio file provided' })
    }

    console.log(`📦 Audio file received: ${audioFile.originalFilename}, size: ${audioFile.size} bytes`)

    // Create form data for OpenAI Whisper API
    const formData = new FormData()
    formData.append('file', fs.createReadStream(audioFile.filepath), {
      filename: audioFile.originalFilename || 'audio.webm',
      contentType: audioFile.mimetype || 'audio/webm',
    })
    formData.append('model', 'whisper-1')
    formData.append('language', language || 'en')
    formData.append('response_format', 'json')

    console.log('🚀 Sending to OpenAI Whisper API...')

    // Send to OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    })

    // Clean up temporary file
    fs.unlink(audioFile.filepath, (err) => {
      if (err) console.error('❌ Error deleting temp file:', err)
    })

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text()
      console.error('❌ Whisper API error:', whisperResponse.status, errorText)
      return res.status(whisperResponse.status).json({ 
        error: 'Whisper API error',
        details: errorText 
      })
    }

    const result = await whisperResponse.json() as WhisperResponse
    console.log('✅ Whisper API response:', result.text)

    // Return the transcription
    res.status(200).json({
      text: result.text,
      success: true
    })

  } catch (error) {
    console.error('❌ Whisper endpoint error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}