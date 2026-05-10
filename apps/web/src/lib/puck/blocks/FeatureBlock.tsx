import type { FeatureBlockProps } from '@strides/core/kids'

export function FeatureBlock({ emoji, title, description }: FeatureBlockProps) {
  return (
    <div className="flex items-start gap-4 p-6 bg-white/10 backdrop-blur rounded-2xl">
      <span className="text-4xl shrink-0">{emoji}</span>
      <div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/70">{description}</p>
      </div>
    </div>
  )
}
