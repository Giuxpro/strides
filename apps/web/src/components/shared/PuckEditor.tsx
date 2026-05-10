'use client'

import { Puck, type Data } from '@measured/puck'
import { puckConfig } from '@/lib/puck/config'
import '@measured/puck/puck.css'

interface Props {
  data: Data
  onPublish: (data: Data) => void
}

export function PuckEditor({ data, onPublish }: Props) {
  return (
    <Puck
      config={puckConfig}
      data={data}
      onPublish={onPublish}
    />
  )
}
