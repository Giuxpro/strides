import Link from 'next/link'
import type { Module } from '@strides/db'

interface ModuleCardProps {
  module: Module
}

const MODULE_EMOJIS: Record<string, string> = {
  animals: '🐾',
  colors: '🎨',
  numbers: '🔢',
  family: '👨‍👩‍👧',
  food: '🍎',
  body: '🦾',
}

export function ModuleCard({ module }: ModuleCardProps) {
  const emoji = MODULE_EMOJIS[module.slug] ?? '📚'

  return (
    <Link href={`/kids/play/${module.slug}`}>
      <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-violet-200 group">
        <div className="text-4xl mb-3">{emoji}</div>
        <h3 className="font-bold text-gray-800 group-hover:text-violet-700 transition-colors">
          {module.title_es}
        </h3>
        <p className="text-xs text-gray-400 mt-1">{module.title_en}</p>
        {module.description_es && (
          <p className="text-sm text-gray-500 mt-2">{module.description_es}</p>
        )}
      </div>
    </Link>
  )
}
