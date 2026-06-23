import type { PreviewDevice } from './LessonPreviewControls'

const WIDTHS: Record<PreviewDevice, string> = {
  mobile:  '390px',
  tablet:  '768px',
  desktop: '100%',
}

// Altura fija del "dispositivo" para que scrollee por dentro (como un teléfono real).
const HEIGHTS: Record<PreviewDevice, string> = {
  mobile:  '844px',
  tablet:  '1024px',
  desktop: '',
}

const DEVICE_LABEL: Record<PreviewDevice, string> = {
  mobile:  'iPhone 14 Pro — 390px',
  tablet:  'iPad — 768px',
  desktop: 'Desktop — 1280px',
}

interface Props {
  device: PreviewDevice
  children: React.ReactNode
}

export function LessonPreviewFrame({ device, children }: Props) {
  const width = WIDTHS[device]
  const isConstrained = device !== 'desktop'

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-gray-900 flex flex-col items-center py-6 px-4">
      <p className="text-xs text-gray-600 mb-3">{DEVICE_LABEL[device]}</p>
      <div
        className={`relative bg-black ${isConstrained ? 'rounded-[2rem] shadow-2xl ring-1 ring-gray-700 overflow-y-auto scrollbar-hide' : 'w-full max-w-[1280px] overflow-hidden'}`}
        style={{
          width,
          height: isConstrained ? HEIGHTS[device] : undefined,
          minHeight: isConstrained ? undefined : '600px',
          maxHeight: isConstrained ? '85vh' : undefined,
          maxWidth: '100%',
        }}
      >
        {children}
      </div>
    </div>
  )
}
