'use client'

import { useRef } from 'react'
import Link from 'next/link'
import type { Lesson } from '@strides/db'
import { AnimatedStar } from './AnimatedStar'

function playAudio(url: string) {
  try { new Audio(url).play() } catch { /* ignore autoplay restrictions */ }
}

interface LessonCardProps {
  lesson: Lesson
  moduleSlug: string
  stars: number
  previousStars?: number  // undefined = no animation (normal nav)
  animationDelay: string
  audioUrl?: string
}

// Fallback temporal por slug — se elimina cuando todas las lecciones tengan cover_url en BD
const SLUG_FALLBACK: Record<string, string> = {
  'animales-granja': '/lesson-cards/granja.png',
  'mascotas': '/lesson-cards/mascotas.png',
  'animales-mar': '/lesson-cards/mar.png',
  'insectos': '/lesson-cards/insectos.png',
}

const IMG_W = 500
const CARD_W = 220
const CARD_H = Math.round(IMG_W * 752 / 1380)

export function LessonCard({ lesson, moduleSlug, stars, previousStars, animationDelay, audioUrl }: LessonCardProps) {
  const imageSrc = lesson.cover_url
    ?? SLUG_FALLBACK[lesson.slug]
    ?? '/lesson-cards/mar.png'

  return (
    <Link
      href={`/kids/play/${moduleSlug}/${lesson.slug}`}
      className="block group animate-pop-in select-none"
      style={{ animationDelay }}
      onPointerDown={() => audioUrl && playAudio(audioUrl)}
    >
      <div className="flex flex-col items-center gap-2" style={{ width: CARD_W }}>

        <div
          className="transition-all duration-150 group-hover:-translate-y-2 group-hover:scale-[1.04] active:translate-y-1 active:scale-[0.97]"
          style={{
            position: 'relative',
            width: CARD_W,
            height: CARD_H,
            overflow: 'hidden',
            borderRadius: 14,
            filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.30))',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={lesson.title_es}
            width={IMG_W}
            height={CARD_H}
            style={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 font-extrabold text-lg uppercase pointer-events-none"
            style={{
              bottom: 21,
              left: 119,
              color: '#7a541a',
              letterSpacing: '0.08em',
            }}
          >
            IR <span style={{ fontSize: '1.2rem' }}>🐾</span>
          </div>
        </div>

        <span
          className="font-extrabold text-sm uppercase leading-tight text-center px-3 py-1 rounded-full"
          style={{
            background: '#8A7A6A',
            color: '#fff',
            letterSpacing: '0.07em',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 3px 0 rgba(0,0,0,0.18), 0 4px 6px rgba(0,0,0,0.12)',
          }}
        >
          {lesson.title_es}
        </span>

        <div className="flex gap-1">
          {[0, 1, 2].map(i => {
            const isFilled = i < stars
            // animate only if this star is newly earned (above previousStars)
            const isNew = previousStars !== undefined && i >= previousStars && isFilled
            return (
              <AnimatedStar
                key={i}
                filled={isFilled}
                animate={isNew}
                index={i}
                delay={isNew ? (i - (previousStars ?? 0)) * 160 : 0}
                size={22}
              />
            )
          })}
        </div>


      </div>
    </Link>
  )
}
