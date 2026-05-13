'use client'

import { createContext, useContext } from 'react'
import type { SpeechProvider } from '@strides/core/kids'

const SpeechConfigContext = createContext<SpeechProvider>('web-speech')

export function SpeechConfigProvider({
  provider,
  children,
}: {
  provider: SpeechProvider
  children: React.ReactNode
}) {
  return (
    <SpeechConfigContext.Provider value={provider}>
      {children}
    </SpeechConfigContext.Provider>
  )
}

export function useSpeechProvider(): SpeechProvider {
  return useContext(SpeechConfigContext)
}
