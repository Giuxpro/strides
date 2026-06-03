'use client'

import { createContext, useContext } from 'react'

export interface GameEventsValue {
  reportCorrect: () => void
  reportWrong: () => void
  isTerminated: boolean
}

const defaults: GameEventsValue = {
  reportCorrect: () => {},
  reportWrong: () => {},
  isTerminated: false,
}

export const GameEventsContext = createContext<GameEventsValue>(defaults)

export function useGameEvents(): GameEventsValue {
  return useContext(GameEventsContext)
}
