import type { VideoBlockProps } from '@strides/core/kids'

export function VideoBlock({ thumbnailEmoji, title, subtitle, bgColor }: VideoBlockProps) {
  return (
    <div className="py-10 px-6" style={{ background: bgColor || '#0f0a1a' }}>
      <div className="max-w-sm mx-auto">
        {/* Thumbnail simulado */}
        <div
          className="relative w-full aspect-video rounded-2xl flex flex-col items-center justify-center mb-4 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)' }}
        >
          <div className="text-6xl mb-2">{thumbnailEmoji}</div>
          {/* Botón play */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.95)' }}
            >
              <div
                className="w-0 h-0 ml-1"
                style={{
                  borderTop: '10px solid transparent',
                  borderBottom: '10px solid transparent',
                  borderLeft: '18px solid #7c3aed',
                }}
              />
            </div>
          </div>
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-1">{title}</h3>
        <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>{subtitle}</p>
      </div>
    </div>
  )
}
