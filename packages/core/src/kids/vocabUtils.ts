import { fluentEmojiUrl } from './fluentEmoji'

const FALLBACK_CDN = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg'

export function getVocabImageUrl(item: {
  image_url?: string | null
  emoji_unicode?: string | null
}): string | null {
  if (item.image_url) return item.image_url
  if (!item.emoji_unicode) return null

  const base =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_EMOJI_CDN_BASE) ||
    FALLBACK_CDN

  if (base === 'fluent') return fluentEmojiUrl(item.emoji_unicode.toLowerCase())

  return `${base}/${item.emoji_unicode.toLowerCase()}.svg`
}
