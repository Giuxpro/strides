'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const I = 'w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500'
const L = 'block text-sm text-gray-400 mb-1.5'

interface Props {
  name: string
  bucket: string
  defaultValue?: string
  label?: string
  accept?: string
}

export function ImageUploadField({ name, bucket, defaultValue = '', label = 'Imagen', accept = 'image/*' }: Props) {
  const [url, setUrl] = useState(defaultValue)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const supabase = createClient()

      // Delete previous file if it came from the same bucket
      if (url) {
        const marker = `/storage/v1/object/public/${bucket}/`
        const idx    = url.indexOf(marker)
        if (idx !== -1) {
          const oldPath = decodeURIComponent(url.slice(idx + marker.length).split('?')[0] ?? '')
          if (oldPath) await supabase.storage.from(bucket).remove([oldPath])
        }
      }

      const { error: uploadErr } = await supabase.storage.from(bucket).upload(file.name, file, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data } = supabase.storage.from(bucket).getPublicUrl(file.name)
      setUrl(data.publicUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className={L}>{label}</label>
      {url && (
        <div className="mb-2">
          {accept.startsWith('audio') ? (
            <audio src={url} controls className="h-8 w-full rounded" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="w-24 h-16 object-cover rounded-lg border border-gray-700" />
          )}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="url"
          name={name}
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://..."
          className={`${I} flex-1`}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="shrink-0 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 text-sm px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          {uploading ? '…' : 'Subir archivo'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
