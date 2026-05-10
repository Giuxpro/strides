import { Render, type Data } from '@measured/puck'
import { puckConfig } from '@/lib/puck/config'

interface Props {
  data: Data
}

export function PuckRenderer({ data }: Props) {
  return <Render config={puckConfig} data={data} />
}
