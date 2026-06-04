interface Props {
  text: string
  align?: 'left' | 'right' | 'center'
}

export function InfoTooltip({ text, align = 'left' }: Props) {
  const posClass =
    align === 'right'  ? 'right-0' :
    align === 'center' ? 'left-1/2 -translate-x-1/2' :
    'left-0'

  return (
    <div className="relative group cursor-help flex items-center shrink-0">
      <span className="text-[11px] leading-none select-none text-slate-500 hover:text-slate-300 transition-colors">ⓘ</span>
      <div
        className={`absolute bottom-full mb-2 w-64 bg-gray-900 border border-gray-700 rounded-xl p-3 text-[11px] text-gray-400 leading-relaxed opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[200] shadow-xl whitespace-normal ${posClass}`}
      >
        {text}
      </div>
    </div>
  )
}
