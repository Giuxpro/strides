'use client'

import { createContext, useContext } from 'react'
import type { ModifierState } from '@strides/core/kids'

export interface GameEventsValue {
  reportCorrect: () => void
  reportWrong: () => void
  isTerminated: boolean
  modifierState: ModifierState
}

const defaults: GameEventsValue = {
  reportCorrect: () => {},
  reportWrong: () => {},
  isTerminated: false,
  modifierState: { optionCount: 4 },
}

export const GameEventsContext = createContext<GameEventsValue>(defaults)

export function useGameEvents(): GameEventsValue {
  return useContext(GameEventsContext)
}
