import type { CTABlockProps } from '@strides/core/kids'

export function CTABlock({ label, href, variant }: CTABlockProps) {
  const base = 'inline-block font-bold text-base px-7 py-3.5 rounded-2xl transition-transform hover:scale-105 active:scale-95'
  const styles = {
    primary:   `${base} bg-violet-600 text-white shadow-lg`,
    secondary: `${base} bg-white/20 text-white border border-white/30`,
  }
  return (
    <div className="flex justify-center py-4">
      <a href={href} className={styles[variant]}>{label}</a>
    </div>
  )
}
