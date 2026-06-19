// Catálogo de métodos de pago del checkout. Fuente de verdad de QUÉ métodos existen.
// La habilitación (on/off) vive en BD (setting `payment_methods`); aquí solo la metadata
// estructural, que está atada a código (cada método tiene su integración y su UI).
// Patrón equivalente a GAME_REGISTRY: catálogo en código, estado mutable en BD.

// 'card'/'wallet' se cobran vía Mercado Pago; 'yape'/'pagoefectivo' vía Culqi.
export type PaymentMethodId = 'card' | 'wallet' | 'yape' | 'pagoefectivo'

export interface PaymentMethodMeta {
  id: PaymentMethodId
  label: string
  provider: 'mercadopago' | 'culqi'
  // ¿Existe ya el flujo completo en código? Si no, el checkout lo muestra como "Próximamente".
  // Lo decide el desarrollador, no el admin.
  implemented: boolean
}

export const PAYMENT_METHOD_REGISTRY: PaymentMethodMeta[] = [
  { id: 'card', label: 'Tarjeta', provider: 'mercadopago', implemented: true },
  { id: 'wallet', label: 'Billetera Mercado Pago', provider: 'mercadopago', implemented: true },
  { id: 'yape', label: 'Yape', provider: 'culqi', implemented: true },
  { id: 'pagoefectivo', label: 'PagoEfectivo', provider: 'culqi', implemented: true },
]

// Estado por defecto cuando el setting `payment_methods` no existe en BD: Mercado Pago activo,
// Culqi apagado (no opera sin cuenta activa).
export const DEFAULT_PAYMENT_METHODS: Record<PaymentMethodId, boolean> = {
  card: true,
  wallet: true,
  yape: false,
  pagoefectivo: false,
}

// Estado de un método para la UI del checkout:
// - coming_soon: aún no implementado en código → "Próximamente".
// - disabled: implementado pero apagado por el admin → "No disponible por el momento".
// - active: implementado y habilitado → clickeable.
export type PaymentMethodStatus = 'active' | 'disabled' | 'coming_soon'

export function resolvePaymentMethodStatus(
  meta: PaymentMethodMeta,
  enabled: Partial<Record<PaymentMethodId, boolean>> | null | undefined,
): PaymentMethodStatus {
  if (!meta.implemented) return 'coming_soon'
  return enabled?.[meta.id] ? 'active' : 'disabled'
}
