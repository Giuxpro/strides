'use client'

import { useState } from 'react'

export const AVATARS = [
  { emoji: '👨', label: 'Hombre' },
  { emoji: '🧔', label: 'Hombre barba' },
  { emoji: '👩', label: 'Mujer' },
  { emoji: '👩‍🦰', label: 'Mujer pelirroja' },
  { emoji: '👦', label: 'Niño' },
  { emoji: '👧', label: 'Niña' },
  { emoji: '🐸', label: 'Rana' },
  { emoji: '🐵', label: 'Mono' },
  { emoji: '🐶', label: 'Perro' },
  { emoji: '🐱', label: 'Gato' },
  { emoji: '🦊', label: 'Zorro' },
  { emoji: '🐻', label: 'Oso' },
  { emoji: '🐼', label: 'Panda' },
  { emoji: '🦁', label: 'León' },
]

interface Props {
  name: string
  defaultValue?: string | null
}

export function AvatarPicker({ name, defaultValue }: Props) {
  const [selected, setSelected] = useState(defaultValue ?? AVATARS[0].emoji)

  return (
    <div>
      <input type="hidden" name={name} value={selected} />
      <div className="mb-3 w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-4xl mx-auto">
        {selected}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {AVATARS.map(({ emoji, label }) => (
          <button
            key={emoji}
            type="button"
            title={label}
            onClick={() => setSelected(emoji)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-all
              ${selected === emoji
                ? 'ring-2 ring-violet-500 bg-violet-900'
                : 'hover:bg-gray-700'
              }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
