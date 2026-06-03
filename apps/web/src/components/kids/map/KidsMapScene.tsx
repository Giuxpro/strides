import { KidsMapSceneMobile } from './KidsMapSceneMobile'
import { KidsMapSceneTablet } from './KidsMapSceneTablet'
import { KidsMapSceneDesktop } from './KidsMapSceneDesktop'
import type { Module } from '@strides/db'
import type { ModuleLockState } from '@strides/core'

interface Props {
  modules: Module[]
  childName: string | null
  childAvatar: string
  currentStreak: number
  moduleLockStates: Record<string, ModuleLockState>
}

export function KidsMapScene(props: Props) {
  return (
    <>
      <KidsMapSceneMobile {...props} />
      <KidsMapSceneTablet {...props} />
      <KidsMapSceneDesktop {...props} />
    </>
  )
}
