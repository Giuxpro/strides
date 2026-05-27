'use client'

import { useRef } from 'react'
import Link from 'next/link'
import type { Lesson } from '@strides/db'
import { AnimatedStar } from './AnimatedStar'
import type { LessonLockState } from '@strides/core'
import { getStorageUrl } from '@strides/core'

function playAudio(url: string) {
  try { new Audio(url).play() } catch { /* ignore autoplay restrictions */ }
}

interface LessonCardProps {
  lesson: Lesson
  moduleSlug: string
  stars: number
  previousStars?: number
  animationDelay: string
  audioUrl?: string
  lockState?: LessonLockState
}

// Fallback temporal por slug — se elimina cuando todas las lecciones tengan cover_url en BD
const SLUG_FALLBACK: Record<string, string> = {
  'animales-granja': '/lesson-cards/granja.png',
  'mascotas': '/lesson-cards/mascotas.png',
  'animales-mar': '/lesson-cards/mar.png',
  'insectos': '/lesson-cards/insectos.png',
}

const IMG_W = 400
const IMG_H = 300
const CARD_W = 220
const CARD_H = Math.round(IMG_W * 752 / 1380)

export function LessonCard({ lesson, moduleSlug, stars, previousStars, animationDelay, audioUrl, lockState }: LessonCardProps) {
  const imageSrc = getStorageUrl(lesson.cover_url) ?? SLUG_FALLBACK[lesson.slug] ?? '/lesson-cards/mar.png'
  const isLocked = lockState !== undefined
  const isPreview = lockState === 'preview-locked'
  const href = isPreview ? '/upgrade' : isLocked ? undefined : `/kids/play/${moduleSlug}/${lesson.slug}`

  const cardContent = (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`transition-all duration-150 ${!isLocked ? 'group-hover:-translate-y-2 group-hover:scale-[1.04] active:translate-y-1 active:scale-[0.97]' : ''}`}
        style={{
          position: 'relative',
          width: CARD_W,
          height: CARD_H,
          overflow: 'hidden',
          borderRadius: 14,
          filter: isLocked ? undefined : 'drop-shadow(0 10px 22px rgba(0,0,0,0.30))',
        }}
      >
        <img
          src={imageSrc}
          alt={lesson.title_es}
          width={IMG_W}
          height={IMG_H}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: isLocked ? 'brightness(0.65) saturate(0.5)' : undefined,
          }}
        />

        {!isLocked && (
          <div
            className="absolute flex items-center gap-1 font-extrabold text-lg uppercase pointer-events-none"
            style={{
              bottom: 15,
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              color: '#7a541a',
              letterSpacing: '0.08em',
            }}
          >
            IR <span style={{ fontSize: '1.2rem' }}>🐾</span>
          </div>
        )}

        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span style={{ fontSize: '2.8rem', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>
              {isPreview ? '⭐' : '🔒'}
            </span>
            {isPreview && (
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                Desbloquear
              </span>
            )}
          </div>
        )}
      </div>

      <span
        className="font-extrabold text-sm uppercase leading-tight text-center px-3 py-1 rounded-full"
        style={{
          background: isLocked ? 'rgba(255,253,245,0.45)' : 'rgba(255,253,245,0.94)',
          color: isLocked ? '#9e8a77' : '#695240ff',
          letterSpacing: '0.07em',
          backdropFilter: 'blur(6px)',
          boxShadow: isLocked ? 'none' : '0 3px 0 rgba(0,0,0,0.18), 0 4px 6px rgba(0,0,0,0.12)',
        }}
      >
        {lesson.title_es}
      </span>

      <div className="flex gap-1">
        {[0, 1, 2].map(i => {
          const isFilled = !isLocked && i < stars
          const isNew = !isLocked && previousStars !== undefined && i >= previousStars && isFilled
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
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block shrink-0 group animate-pop-in select-none"
        style={{ animationDelay, width: CARD_W, flex: `0 0 ${CARD_W}px` }}
        onPointerDown={() => !isLocked && audioUrl && playAudio(audioUrl)}
      >
        {cardContent}
      </Link>
    )
  }

  return (
    <div
      className="block shrink-0 animate-pop-in select-none cursor-not-allowed"
      style={{ animationDelay, width: CARD_W, flex: `0 0 ${CARD_W}px` }}
    >
      {cardContent}
    </div>
  )
}
