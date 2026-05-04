import Link from 'next/link'
import type { Lesson } from '@strides/db'

interface LessonCardProps {
  lesson: Lesson
  moduleSlug: string
  completed: boolean
  animationDelay: string
}

// Fallback temporal por slug — se elimina cuando todas las lecciones tengan cover_url en BD
const SLUG_FALLBACK: Record<string, string> = {
  'animales-granja': '/lesson-cards/granja.png',
  'mascotas': '/lesson-cards/mascotas.png',
  'animales-mar': '/lesson-cards/mar.png',
  'insectos': '/lesson-cards/insectos.png',
}

const CARD_W = 290
const CARD_H = Math.round(CARD_W * 752 / 1380)

export function LessonCard({ lesson, moduleSlug, completed, animationDelay }: LessonCardProps) {
  const imageSrc = lesson.cover_url
    ?? SLUG_FALLBACK[lesson.slug]
    ?? '/lesson-cards/mar.png'

  return (
    <Link
      href={`/kids/play/${moduleSlug}/${lesson.slug}`}
      className="block group animate-pop-in select-none"
      style={{ animationDelay }}
    >
      <div className="flex flex-col items-center gap-2">

        <div
          className="transition-all duration-150 group-hover:-translate-y-2 group-hover:scale-[1.04] active:translate-y-1 active:scale-[0.97]"
          style={{ filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.30))' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={lesson.title_es}
            width={CARD_W}
            height={CARD_H}
            style={{ objectFit: 'contain', display: 'block' }}
          />
        </div>

        <span
          className="font-extrabold text-base uppercase leading-tight text-center"
          style={{
            color: '#fff',
            letterSpacing: '0.07em',
            textShadow: '0 2px 6px rgba(0,0,0,0.22)',
          }}
        >
          {lesson.title_es}
        </span>

        <div className="flex gap-0.5">
          {[0, 1, 2].map(i => (
            <span key={i} className="text-lg" style={{ opacity: completed ? 1 : 0.28 }}>
              ⭐
            </span>
          ))}
        </div>

        <div
          className="flex items-center gap-1.5 px-5 py-2 rounded-full font-extrabold text-sm uppercase whitespace-nowrap transition-all duration-150 group-hover:scale-110 group-hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(180deg, #fffdf5 0%, #f5e4b0 100%)',
            boxShadow: '0 4px 0 #c49835, 0 7px 20px rgba(0,0,0,0.22)',
            color: '#7a541a',
            letterSpacing: '0.08em',
          }}
        >
          IR <span style={{ fontSize: '0.95rem' }}>🐾</span>
        </div>

      </div>
    </Link>
  )
}
