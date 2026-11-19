import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton client — se crea SOLO cuando alguien lo usa (lazy),
// nunca en build time. Esto evita el crash de next build si las
// env vars no están disponibles en el worker de prerender.
let _zyncDb: SupabaseClient<any, 'public', any> | null = null

export function getZyncDb(): SupabaseClient<any, 'public', any> {
  if (!_zyncDb) {
    _zyncDb = createClient(url, key, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 2 } }, // throttle realtime
    })
  }
  return _zyncDb
}

// Proxy que difiere la creación del cliente hasta el primer acceso real.
// En build time nadie accede a `zyncDb`, así que createClient nunca se ejecuta.
export const zyncDb = new Proxy({} as SupabaseClient<any, 'public', any>, {
  get(_target, prop) {
    const client = getZyncDb() as any
    const value = client[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DbInvEntry {
  id: number
  nombre: string
  qty: number
  fob_usd: number
  precio_venta_usd: number
  vendido: number
  merma_pct: number
  fecha: string
  imagen_url?: string
}

export interface DbVenta {
  id: number
  inv_id: number
  qty: number
  precio_usd: number
  metodo_pago: string
  fecha: string
}

export interface DbTasas {
  bcv: number
  usdt: number
  p2p: number
  updated_at: string
  updated_by: string
}

// ─── Inventario ───────────────────────────────────────────────────────────────
export async function sbUpsertInv(entry: DbInvEntry) {
  return (zyncDb.from('zync_inventario') as any).upsert(entry, { onConflict: 'id' })
}

export async function sbDeleteInv(id: number) {
  await (zyncDb.from('zync_ventas') as any).delete().eq('inv_id', id)
  return (zyncDb.from('zync_inventario') as any).delete().eq('id', id)
}

export async function sbLoadInv(): Promise<DbInvEntry[]> {
  const { data } = await (zyncDb.from('zync_inventario') as any)
    .select('*')
    .order('created_at', { ascending: false })
  return (data as DbInvEntry[]) ?? []
}

// ─── Ventas ───────────────────────────────────────────────────────────────────
export async function sbUpsertVenta(v: DbVenta) {
  return (zyncDb.from('zync_ventas') as any).upsert(v, { onConflict: 'id' })
}

export async function sbDeleteVenta(id: number) {
  return (zyncDb.from('zync_ventas') as any).delete().eq('id', id)
}

export async function sbLoadVentas(): Promise<DbVenta[]> {
  const { data } = await (zyncDb.from('zync_ventas') as any)
    .select('*')
    .order('created_at', { ascending: false })
  return (data as DbVenta[]) ?? []
}

// ─── Tasas ────────────────────────────────────────────────────────────────────
export async function sbPushTasas(bcv: number, usdt: number, p2p: number, by = 'suite') {
  return (zyncDb.from('zync_tasas') as any).upsert(
    { id: 1, bcv, usdt, p2p, updated_at: new Date().toISOString(), updated_by: by },
    { onConflict: 'id' }
  )
}

export async function sbLoadTasas(): Promise<DbTasas | null> {
  const { data } = await (zyncDb.from('zync_tasas') as any).select('*').eq('id', 1).single()
  return (data as DbTasas) ?? null
}

// ─── Carga paralela + cache TTL ───────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 min
let _cache: { data: AllData; ts: number } | null = null

export interface AllData {
  tasas: DbTasas | null
  inv: DbInvEntry[]
  ventas: DbVenta[]
}

async function loadAllFromSupabase(): Promise<AllData> {
  const [tasas, inv, ventas] = await Promise.all([
    sbLoadTasas(),
    sbLoadInv(),
    sbLoadVentas(),
  ])
  return { tasas, inv, ventas }
}

export async function sbLoadAll(force = false): Promise<AllData> {
  const now = Date.now()
  if (!force && _cache && now - _cache.ts < CACHE_TTL_MS) {
    return _cache.data
  }
  const data = await loadAllFromSupabase()
  _cache = { data, ts: now }
  return data
}

export function sbInvalidateCache() {
  _cache = null
}

// ─── Helpers de mapeo ─────────────────────────────────────────────────────────
export function invToDb(e: {
  id: number
  product: string
  qty: number
  fobCost: number
  sellingPrice: number
  sold: number
  mermaR: number
  date: string
  imageUrl?: string
}): DbInvEntry {
  return {
    id: e.id,
    nombre: e.product,
    qty: e.qty,
    fob_usd: e.fobCost,
    precio_venta_usd: e.sellingPrice,
    vendido: e.sold,
    merma_pct: e.mermaR,
    fecha: e.date,
    imagen_url: e.imageUrl,
  }
}

export function dbToInv(r: DbInvEntry) {
  return {
    id: r.id,
    product: r.nombre,
    qty: r.qty,
    fobCost: r.fob_usd,
    sellingPrice: r.precio_venta_usd,
    sold: r.vendido,
    mermaR: r.merma_pct,
    date: r.fecha,
    imageUrl: r.imagen_url,
  }
}