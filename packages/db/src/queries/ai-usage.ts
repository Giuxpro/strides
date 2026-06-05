import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types.generated'

export interface AIUsagePeriod {
  requests: number
  byModel: Array<{
    model: string
    provider: string
    requests: number
    inputTokens: number
    outputTokens: number
    totalDurationMs: number
  }>
}

interface AILogRow {
  provider: string
  model: string
  input_tokens: number
  output_tokens: number
  duration_ms: number | null
}

function aggregateAIRows(rows: AILogRow[]): AIUsagePeriod {
  const byModel = Object.values(
    rows.reduce<Record<string, AIUsagePeriod['byModel'][number]>>((acc, r) => {
      const key = r.model
      if (!acc[key]) {
        acc[key] = { model: r.model, provider: r.provider, requests: 0, inputTokens: 0, outputTokens: 0, totalDurationMs: 0 }
      }
      acc[key]!.requests += 1
      acc[key]!.inputTokens += r.input_tokens
      acc[key]!.outputTokens += r.output_tokens
      acc[key]!.totalDurationMs += r.duration_ms ?? 0
      return acc
    }, {}),
  )
  return { requests: rows.length, byModel }
}

export async function logAIUsage(
  supabase: SupabaseClient<Database>,
  data: { provider: string; model: string; inputTokens: number; outputTokens: number; durationMs?: number },
) {
  await supabase.from('ai_usage_logs').insert({
    provider: data.provider,
    model: data.model,
    input_tokens: data.inputTokens,
    output_tokens: data.outputTokens,
    duration_ms: data.durationMs ?? null,
  })
}

export interface AIUsageSummary {
  requestsToday: number
  inputTokensToday: number
  outputTokensToday: number
  totalDurationMsToday: number
  byModel: Array<{ model: string; provider: string; requests: number; inputTokens: number; outputTokens: number; totalDurationMs: number }>
}

export async function getAIUsageForMonth(
  supabase: SupabaseClient<Database>,
  year: number,
  month: number,
): Promise<AIUsagePeriod> {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  const { data } = await supabase
    .from('ai_usage_logs')
    .select('provider, model, input_tokens, output_tokens, duration_ms')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
  return aggregateAIRows(data ?? [])
}

export async function getAIUsageAllTime(
  supabase: SupabaseClient<Database>,
): Promise<AIUsagePeriod> {
  const { data } = await supabase
    .from('ai_usage_logs')
    .select('provider, model, input_tokens, output_tokens, duration_ms')
  return aggregateAIRows(data ?? [])
}

export async function getAIUsageToday(
  supabase: SupabaseClient<Database>,
  model?: string,
): Promise<AIUsageSummary> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  let query = supabase
    .from('ai_usage_logs')
    .select('provider, model, input_tokens, output_tokens, duration_ms')
    .gte('created_at', todayStart.toISOString())

  if (model) query = query.eq('model', model)

  const { data } = await query

  const rows = data ?? []

  const byModel = Object.values(
    rows.reduce<Record<string, AIUsageSummary['byModel'][number]>>((acc, r) => {
      const key = r.model
      if (!acc[key]) {
        acc[key] = { model: r.model, provider: r.provider, requests: 0, inputTokens: 0, outputTokens: 0, totalDurationMs: 0 }
      }
      acc[key]!.requests += 1
      acc[key]!.inputTokens += r.input_tokens
      acc[key]!.outputTokens += r.output_tokens
      acc[key]!.totalDurationMs += r.duration_ms ?? 0
      return acc
    }, {}),
  )

  return {
    requestsToday: rows.length,
    inputTokensToday: rows.reduce((s, r) => s + r.input_tokens, 0),
    outputTokensToday: rows.reduce((s, r) => s + r.output_tokens, 0),
    totalDurationMsToday: rows.reduce((s, r) => s + (r.duration_ms ?? 0), 0),
    byModel,
  }
}
