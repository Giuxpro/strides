import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

export async function logAIUsage(
  supabase: SupabaseClient<Database>,
  data: { provider: string; model: string; inputTokens: number; outputTokens: number },
) {
  await supabase.from('ai_usage_logs').insert({
    provider: data.provider,
    model: data.model,
    input_tokens: data.inputTokens,
    output_tokens: data.outputTokens,
  })
}

export interface AIUsageSummary {
  requestsToday: number
  inputTokensToday: number
  outputTokensToday: number
  byModel: Array<{ model: string; provider: string; requests: number; inputTokens: number; outputTokens: number }>
}

export async function getAIUsageToday(
  supabase: SupabaseClient<Database>,
  model?: string,
): Promise<AIUsageSummary> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  let query = supabase
    .from('ai_usage_logs')
    .select('provider, model, input_tokens, output_tokens')
    .gte('created_at', todayStart.toISOString())

  if (model) query = query.eq('model', model)

  const { data } = await query

  const rows = data ?? []

  const byModel = Object.values(
    rows.reduce<Record<string, AIUsageSummary['byModel'][number]>>((acc, r) => {
      const key = r.model
      if (!acc[key]) {
        acc[key] = { model: r.model, provider: r.provider, requests: 0, inputTokens: 0, outputTokens: 0 }
      }
      acc[key]!.requests += 1
      acc[key]!.inputTokens += r.input_tokens
      acc[key]!.outputTokens += r.output_tokens
      return acc
    }, {}),
  )

  return {
    requestsToday: rows.length,
    inputTokensToday: rows.reduce((s, r) => s + r.input_tokens, 0),
    outputTokensToday: rows.reduce((s, r) => s + r.output_tokens, 0),
    byModel,
  }
}
