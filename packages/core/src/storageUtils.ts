const FALLBACK_BASE = 'https://ievftgzxiwtjocxnrmgv.supabase.co/storage/v1/object/public'

function storageBase(): string {
  return (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_STORAGE_BASE) || FALLBACK_BASE
}

export function getStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('/')) return path
  return `${storageBase()}/${path}`
}

export function toStoragePath(url: string | null | undefined): string | null {
  if (!url) return null
  const base = storageBase()
  if (url.startsWith(base)) return url.slice(base.length + 1)
  return url
}
