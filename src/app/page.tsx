'use client'
import { useState, useMemo, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts'

// ============================================================
// TYPES
// ============================================================
interface Rates { bcv: number; usdt: number; p2p: number }
interface Form {
  productName: string
  costUSD: string; quantity: string; length: string; width: string; height: string; weight: string
  insuranceR: string; arancelR: string; iceR: string; ivaR: string
  cbmRate: string; fixedCosts: string
  galanetUsd: string; adUsd: string; packagingUsd: string; deliveryUsd: string
  marginR: string; mermaR: string; shippingBs: string; freightUsd: string; supplierShipping: string
}
interface InvEntry { id: number; product: string; qty: number; fobCost: number; sold: number; mermaR: number; date: string }
interface SaleRecord { id: number; invId: number; qty: number; priceUSD: number; date: string }

// ============================================================
// FORMATTERS
// ============================================================
const fUSD = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
const fBs = (v: number) => {
  const [i, d] = v.toFixed(2).split('.')
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + d + ' Bs'
}
const fNum = (v: number, dec = 2) => v.toFixed(dec)

// ============================================================
// COLORS
// ============================================================
const C = {
  gold: '#D4AF37', goldLight: '#E8CC6E', goldPale: '#F7E7CE', goldDark: '#B8962E',
  bgPrimary: '#06060a', bgSecondary: '#0e0e16', bgCard: '#111119', bgCardHover: '#16161f',
  bgInput: '#0b0b12', bgElevated: '#14141e',
  border: '#1c1c2c', borderActive: '#2a2a3e', borderGold: 'rgba(212,175,55,0.25)',
  text: '#eaeaf2', textSec: '#8a8aa4', textMuted: '#55556a',
  goldGlow: 'rgba(212,175,55,0.08)',
  green: '#4ADE80', blue: '#60A5FA', orange: '#FB923C', red: '#F87171', cyan: '#22D3EE', purple: '#A78BFA'
}

const inp: React.CSSProperties = {
  width: '100%', background: C.bgInput, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '10px 12px', color: C.text, fontSize: 14,
  fontWeight: 600, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'var(--font-body)'
}

const card: React.CSSProperties = {
  background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden'
}

const cardHead: React.CSSProperties = {
  padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex',
  alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.006)'
}

const cardBody: React.CSSProperties = { padding: 20 }

const label: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700, color: C.textMuted,
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.8px'
}

const secTitle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: 2, color: C.goldDark,
  textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8
}

const PIE_COLORS = [C.gold, C.blue, C.green, C.orange, C.red, C.cyan, C.purple]

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ZyncSuite() {
  const [tab, setTab] = useState<'calc' | 'inv' | 'dash'>('calc')

  // --- Rates ---
  const [rates, setRates] = useState<Rates>({
    bcv: parseFloat(typeof window !== 'undefined' ? localStorage.getItem('zync_r_bcv') || '78.50' : '78.50'),
    usdt: parseFloat(typeof window !== 'undefined' ? localStorage.getItem('zync_r_usdt') || '85.30' : '85.30'),
    p2p: parseFloat(typeof window !== 'undefined' ? localStorage.getItem('zync_r_p2p') || '681.69' : '681.69')
  })
  const [activeRate, setActiveRate] = useState<'bcv' | 'usdt' | 'p2p'>((typeof window !== 'undefined' ? localStorage.getItem('zync_ar') : null) as any || 'p2p')

  // --- Form ---
  const [f, setF] = useState<Form>({
    productName: '',
    costUSD: '', quantity: '1', length: '', width: '', height: '', weight: '',
    insuranceR: '0', arancelR: '0', iceR: '0', ivaR: '0',
    cbmRate: '250', fixedCosts: '0',
    galanetUsd: '0', adUsd: '0', packagingUsd: '0', deliveryUsd: '0',
    marginR: '30', mermaR: '0', shippingBs: '0', freightUsd: '0', supplierShipping: '0'
  })

  // --- Inventory ---
  const [inv, setInv] = useState<InvEntry[]>(JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('zync_inv') || '[]' : '[]'))
  const [sales, setSales] = useState<SaleRecord[]>(JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('zync_sales') || '[]' : '[]'))
  const [newProd, setNewProd] = useState({ name: '', qty: '', fob: '' })
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState({ name: '', qty: '', fob: '' })
  const [freightTab, setFreightTab] = useState<'fixed' | 'cbm'>('cbm')

  // --- Helpers ---
  const v = (k: keyof Form) => parseFloat(f[k]) || 0
  const chF = (k: keyof Form, val: string) => { if (val === '' || /^\d*\.?\d*$/.test(val)) setF(p => ({ ...p, [k]: val })) }
  const chRate = (k: keyof Rates, val: string) => {
    const n = parseFloat(val)
    if (!isNaN(n) && n >= 0) { setRates(p => ({ ...p, [k]: n })); localStorage.setItem(`zync_r_${k}`, val) }
  }
  const selRate = (k: 'bcv' | 'usdt' | 'p2p') => { setActiveRate(k); localStorage.setItem('zync_ar', k) }
  const rate = rates[activeRate]
  const p2p = rates.p2p

  // ============================================================
  // CBM
  // ============================================================
  const cbm = useMemo(() => {
    const l = v('length'), w = v('width'), h = v('height')
    return (l && w && h) ? (l * w * h) / 1000000 : 0
  }, [f.length, f.width, f.height])

  // ============================================================
  // BRECHA CAMBIARIA & FRICCION P2P
  // ============================================================
  const brecha = useMemo(() => {
    const spread = p2p * 0.015 // 1.5% spread
    const comisionUSDT = 2.5 // USD fijo approx por conversion USDT→Zinli
    const tasaNeta = p2p - spread
    const friccion = spread + (comisionUSDT * p2p / p2p) // simplificado
    return { spread, comisionUSDT, tasaNeta, friccion, tasaBruta: p2p }
  }, [p2p])

  // ============================================================
  // CALCULATION ENGINE
  // ============================================================
  const calc = useMemo(() => {
    const c = v('costUSD'), q = parseInt(f.quantity) || 1
    if (c <= 0) return null

    const cifUnit = c
    const insurance = cifUnit * (v('insuranceR') / 100)
    const arancel = cifUnit * (v('arancelR') / 100)
    const ice = cifUnit * (v('iceR') / 100)
    const ivaBase = cifUnit + arancel + ice
    const iva = ivaBase * (v('ivaR') / 100)
    const totalTaxes = insurance + arancel + ice + iva
    const freightFixed = v('freightUsd')
    const freight = freightTab === 'fixed'
      ? freightFixed / q
      : (cbm > 0 ? (cbm * v('cbmRate')) / q : 0)
    const freightMode: 'fixed' | 'cbm' = freightTab
    const supplierShippingPerUnit = v('supplierShipping') / q
    // OPEX — montos TOTALES mensuales/del lote, divididos entre cantidad
    const fixedTotal = v('fixedCosts')
    const galanetTotal = v('galanetUsd')
    const adTotal = v('adUsd')
    const packagingTotal = v('packagingUsd')
    const deliveryTotal = v('deliveryUsd')
    const opexMonthly = galanetTotal + adTotal + packagingTotal + deliveryTotal + fixedTotal
    const fixedPerUnit = fixedTotal / q
    const galanetPerUnit = galanetTotal / q
    const adPerUnit = adTotal / q
    const packagingPerUnit = packagingTotal / q
    const deliveryPerUnit = deliveryTotal / q
    const totalOpex = opexMonthly / q

    // costBase = suma limpia de todos los costos antes del margen
    const costBase = cifUnit + totalTaxes + freight + supplierShippingPerUnit + totalOpex
    const mermaR = v('mermaR')
    const mermaAmount = costBase * (mermaR / 100)
    const costWithMerma = costBase + mermaAmount
    const margin = v('marginR')
    const finalPrice = costWithMerma * (1 + margin / 100)
    const profitPerUnit = finalPrice - costWithMerma
    const profitPct = costWithMerma > 0 ? (profitPerUnit / costWithMerma) * 100 : 0

    return {
      cifUnit, insurance, arancel, ice, iva, totalTaxes,
      freight, freightFixed, freightMode, supplierShippingPerUnit,
      fixedPerUnit, galanetPerUnit, adPerUnit, packagingPerUnit, deliveryPerUnit, totalOpex,
      fixedTotal, galanetTotal, adTotal, packagingTotal, deliveryTotal, opexMonthly,
      costBase, mermaAmount, mermaR, costWithMerma,
      finalPrice, profitPerUnit, profitPct,
      sellingBs: finalPrice * rate,
      sellingBsP2P: finalPrice * p2p,
      gap: ((p2p - rate) / rate) * 100,
      q
    }
  }, [f, rates, activeRate, cbm, freightTab])

  // ============================================================
  // INVENTORY LOGIC
  // ============================================================
  const addInv = () => {
    const name = newProd.name.trim()
    const qty = parseInt(newProd.qty) || 0
    const fob = parseFloat(newProd.fob) || 0
    if (!name || qty <= 0 || fob <= 0) return
    const entry: InvEntry = {
      id: Date.now(), product: name, qty, fobCost: fob, sold: 0, mermaR: 3,
      date: new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
    }
    const updated = [entry, ...inv]
    setInv(updated)
    localStorage.setItem('zync_inv', JSON.stringify(updated))
    setNewProd({ name: '', qty: '', fob: '' })
  }

  const startEdit = (e: InvEntry) => {
    setEditId(e.id)
    setEditData({ name: e.product, qty: e.qty.toString(), fob: e.fobCost.toString() })
  }

  const saveEdit = () => {
    if (editId === null) return
    const name = editData.name.trim()
    const qty = parseInt(editData.qty) || 0
    const fob = parseFloat(editData.fob) || 0
    if (!name || qty <= 0 || fob <= 0) { toast('Completa todos los campos correctamente', 'err'); return }
    const updated = inv.map(e => e.id === editId ? { ...e, product: name, qty, fobCost: fob } : e)
    setInv(updated)
    localStorage.setItem('zync_inv', JSON.stringify(updated))
    setEditId(null)
    toast('Producto actualizado correctamente')
  }

  const deleteInv = (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar "${name}" del inventario?\nEsta accion no se puede deshacer.`)) return
    const updated = inv.filter(e => e.id !== id)
    setInv(updated)
    localStorage.setItem('zync_inv', JSON.stringify(updated))
    toast('Producto eliminado del inventario')
  }

  const recordSale = (invId: number) => {
    const qty = parseInt(prompt('Cantidad vendida:') || '0')
    if (qty <= 0) return
    const price = parseFloat(prompt('Precio de venta USD por unidad:') || '0')
    if (price <= 0) return

    setInv(prev => prev.map(e => {
      if (e.id === invId) {
        const newSold = e.sold + qty
        if (newSold > e.qty) return e
        return { ...e, sold: newSold }
      }
      return e
    }))

    const sale: SaleRecord = {
      id: Date.now(), invId, qty, priceUSD: price,
      date: new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    }
    const updatedSales = [sale, ...sales]
    setSales(updatedSales)
    localStorage.setItem('zync_sales', JSON.stringify(updatedSales))
  }

  // ============================================================
  // DASHBOARD DATA
  // ============================================================
  const dashData = useMemo(() => {
    // OPEX breakdown pie
    const opexPie = [
      { name: 'Internet Galanet', value: v('galanetUsd'), color: C.gold },
      { name: 'Publicidad', value: v('adUsd'), color: C.blue },
      { name: 'Empaques', value: v('packagingUsd'), color: C.green },
      { name: 'Delivery', value: v('deliveryUsd'), color: C.orange },
    ].filter(x => x.value > 0)

    // Cost breakdown bar
    const costBar = calc ? [
      { name: 'CIF', value: calc.cifUnit },
      ...(calc.totalTaxes > 0 ? [{ name: 'Impuestos', value: calc.totalTaxes }] : []),
      { name: 'Flete', value: calc.freight + calc.supplierShippingPerUnit },
      ...(calc.totalOpex > 0 ? [{ name: 'OPEX', value: calc.totalOpex }] : []),
      ...(calc.mermaAmount > 0 ? [{ name: 'Merma', value: calc.mermaAmount }] : []),
      { name: 'Ganancia', value: calc.profitPerUnit },
    ] : []

    // Inventory summary
    const totalInvCost = inv.reduce((s, e) => s + (e.qty * e.fobCost), 0)
    const totalSold = inv.reduce((s, e) => s + e.sold, 0)
    const totalRevenue = sales.reduce((s, r) => s + (r.qty * r.priceUSD), 0)
    const totalCOGS = sales.reduce((s, r) => {
      const entry = inv.find(e => e.id === r.invId)
      return s + (r.qty * (entry?.fobCost || 0))
    }, 0)
    const grossProfit = totalRevenue - totalCOGS
    const totalMerma = inv.reduce((s, e) => {
      const mermaQty = Math.round(e.qty * (e.mermaR / 100))
      return s + mermaQty
    }, 0)

    // Brecha chart
    const brechaBar = [
      { name: 'BCV', value: rates.bcv },
      { name: 'USDT', value: rates.usdt },
      { name: 'P2P Efectivo', value: rates.p2p },
    ]

    return { opexPie, costBar, totalInvCost, totalSold, totalRevenue, grossProfit, totalMerma, brechaBar }
  }, [f, calc, inv, sales, rates])

  // ============================================================
  // TABS
  // ============================================================
  const tabs = [
    { key: 'calc' as const, label: 'Calculadora', icon: '🧮' },
    { key: 'inv' as const, label: 'Inventario', icon: '📦' },
    { key: 'dash' as const, label: 'Dashboard', icon: '📊' },
  ]

  // ============================================================
  // TOAST HELPER
  // ============================================================
  const toast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    // Simple toast via native notification
    if (typeof window !== 'undefined') {
      const el = document.createElement('div')
      el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;background:${type === 'ok' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)'};border:1px solid ${type === 'ok' ? C.green : C.red};border-radius:12px;padding:14px 20px;color:${type === 'ok' ? C.green : C.red};font-size:13px;font-weight:600;font-family:var(--font-body);box-shadow:0 8px 32px rgba(0,0,0,0.5);animation:fadeUp 0.3s ease-out;max-width:360px`
      el.textContent = msg
      document.body.appendChild(el)
      setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300) }, 2500)
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ minHeight: '100vh', background: C.bgPrimary, position: 'relative', zIndex: 1 }}>

      {/* ============ A2K DIGITAL STUDIO MEMBRETE ============ */}
      <header style={{
        background: 'linear-gradient(180deg, rgba(212,175,55,0.06) 0%, transparent 100%)',
        borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72
        }}>
          {/* LEFT: A2K Logo + Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, overflow: 'hidden',
              border: `2px solid ${C.gold}`, boxShadow: `0 0 16px ${C.goldDark}40`,
              flexShrink: 0
            }}>
              <img src="/a2k-logo.jpeg" alt="A2K Digital Studio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
                letterSpacing: 3,
                background: `linear-gradient(135deg, ${C.goldPale}, ${C.gold}, ${C.goldDark})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                lineHeight: 1.1
              }}>A2K DIGITAL STUDIO</div>
              <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2, fontWeight: 600 }}>
                Desarrollo &amp; Innovacion Digital
              </div>
            </div>
          </div>

          {/* CENTER: ZYNC ELECTRONICS */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, color: C.text, textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
              ZYNC ELECTRONICS
            </div>
            <div style={{
              fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: C.goldDark,
              textTransform: 'uppercase', marginTop: 1,
              background: C.goldGlow,
              padding: '2px 10px', borderRadius: 4, display: 'inline-block'
            }}>Suite Financiera v3.0</div>
          </div>

          {/* RIGHT: Tasa P2P Badge */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '10px 16px', textAlign: 'center',
            boxShadow: '0 0 20px rgba(212,175,55,0.1)'
          }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: C.textMuted, textTransform: 'uppercase' }}>Tasa P2P Real</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
              color: C.goldLight, lineHeight: 1.2
            }}>{p2p.toFixed(2)}</div>
            <div style={{ fontSize: 9, color: C.textMuted }}>Bs/$</div>
          </div>
        </div>
      </header>

      {/* ============ TAB NAV ============ */}
      <nav style={{
        maxWidth: 1200, margin: '0 auto', padding: '20px 24px 0',
        display: 'flex', gap: 6, borderBottom: `1px solid ${C.border}`
      }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 20px', border: 'none', borderRadius: `${12}px 12px 0 0`,
            background: tab === t.key ? C.bgCard : 'transparent',
            color: tab === t.key ? C.goldLight : C.textMuted,
            fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)',
            borderBottom: tab === t.key ? `2px solid ${C.gold}` : '2px solid transparent',
            marginBottom: -1
          }}>{t.icon} {t.label}</button>
        ))}
      </nav>

      {/* ============ MAIN CONTENT ============ */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>

        {/* ==================== TAB: CALCULADORA ==================== */}
        {tab === 'calc' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, animation: 'fadeUp 0.4s ease-out' }}>

            {/* --- LEFT: FORM --- */}
            <div style={{ ...card, animation: 'fadeUp 0.4s ease-out' }}>
              <div style={cardHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>📦</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>Datos del Producto</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: C.goldDark, background: 'rgba(212,175,55,0.1)', padding: '3px 8px', borderRadius: 5 }}>FORM</span>
              </div>
              <div style={cardBody}>

                {/* Rate Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
                  {([['bcv', 'BCV Oficial'], ['usdt', 'USDT'], ['p2p', 'P2P Efectivo']] as const).map(([k, lb]) => (
                    <div key={k} onClick={() => selRate(k)} style={{
                      background: activeRate === k ? 'rgba(212,175,55,0.06)' : C.bgInput,
                      border: `1px solid ${activeRate === k ? C.gold : C.border}`,
                      borderRadius: 8, padding: '10px 8px', textAlign: 'center', cursor: 'pointer',
                      transition: 'all 0.2s', boxShadow: activeRate === k ? `0 0 12px rgba(212,175,55,0.1)` : 'none'
                    }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: C.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>{lb}</div>
                      <input type="number" value={rates[k]} onChange={e => chRate(k, e.target.value)} onClick={e => e.stopPropagation()}
                        style={{ ...inp, padding: '4px 2px', color: activeRate === k ? C.goldLight : C.text, fontSize: 15, textAlign: 'center' }}
                        step="0.01" min="0" />
                      <div style={{ fontSize: 8, color: C.textMuted, marginTop: 2 }}>Bs/$</div>
                    </div>
                  ))}
                </div>

                {/* Brecha Info */}
                <div style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.12)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', fontSize: 11, color: C.orange, fontWeight: 500 }}>
                  <span style={{ fontSize: 16 }}>⚡</span>
                  <span>Tasa Base <b>681.69</b> incluye spread 1.5%, comisiones USDT→Zinli y recargas. Brecha vs BCV: <b>{((p2p - rates.bcv) / rates.bcv * 100).toFixed(1)}%</b></span>
                </div>

                {/* Product Name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ ...label, color: C.goldDark }}>Nombre del Producto</label>
                  <input
                    type="text"
                    value={f.productName}
                    onChange={e => setF(p => ({ ...p, productName: e.target.value }))}
                    placeholder="Ej: Micrófono Lavalier x30 uds"
                    style={{ ...inp, borderColor: f.productName ? 'rgba(212,175,55,0.35)' : C.border, color: f.productName ? C.goldLight : C.text }}
                  />
                </div>

                {/* Cost + Qty */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={label}>Costo Unitario (USD)</label>
                    <input type="number" value={f.costUSD} onChange={e => chF('costUSD', e.target.value)} placeholder="0.00" style={inp} step="0.01" min="0" />
                  </div>
                  <div>
                    <label style={label}>Cantidad (unidades)</label>
                    <input type="number" value={f.quantity} onChange={e => chF('quantity', e.target.value)} placeholder="1" style={inp} step="1" min="1" />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '16px 0' }} />

                {/* FREIGHT MODULE */}
                <div style={secTitle}><span>🚢</span> Modulo de Flete Maritimo</div>

                {/* MODE TOGGLE BUTTONS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  {([
                    { key: 'fixed' as const, icon: '⚡', title: 'FLETE FIJO', sub: 'Ya sé cuánto pagué', activeColor: C.gold, activeBg: 'rgba(212,175,55,0.1)', activeBorder: C.gold },
                    { key: 'cbm' as const, icon: '📐', title: 'POR MEDIDAS CBM', sub: 'Cálculo por volumen', activeColor: C.blue, activeBg: 'rgba(96,165,250,0.1)', activeBorder: C.blue },
                  ]).map(({ key, icon, title, sub, activeColor, activeBg, activeBorder }) => (
                    <button key={key} onClick={() => setFreightTab(key)} style={{
                      padding: '14px 10px', border: `2px solid ${freightTab === key ? activeBorder : C.border}`,
                      borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                      background: freightTab === key ? activeBg : C.bgInput,
                      fontFamily: 'var(--font-body)', textAlign: 'center' as const,
                      outline: 'none'
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 5 }}>{icon}</div>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: freightTab === key ? activeColor : C.textMuted }}>{title}</div>
                      <div style={{ fontSize: 9, marginTop: 3, color: freightTab === key ? activeColor : C.textMuted, opacity: 0.75 }}>{sub}</div>
                    </button>
                  ))}
                </div>

                {/* FLETE FIJO FIELDS */}
                {freightTab === 'fixed' && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={label}>Flete Total Cerrado (USD)</label>
                    <input
                      type="number"
                      value={f.freightUsd}
                      onChange={e => chF('freightUsd', e.target.value)}
                      placeholder="Ej: 57.00"
                      style={{ ...inp, borderColor: v('freightUsd') > 0 ? 'rgba(212,175,55,0.4)' : C.border, color: v('freightUsd') > 0 ? C.goldLight : C.text }}
                      step="0.01" min="0"
                    />
                    <div style={{
                      marginTop: 8, padding: '9px 13px', borderRadius: 7,
                      background: v('freightUsd') > 0 ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${v('freightUsd') > 0 ? 'rgba(212,175,55,0.25)' : C.border}`,
                      fontSize: 11, fontWeight: 600,
                      color: v('freightUsd') > 0 ? C.goldLight : C.textMuted
                    }}>
                      {v('freightUsd') > 0
                        ? `⚡ Usando monto cerrado de $${fNum(v('freightUsd'))}. CBM desactivado.`
                        : '⚡ Ingresa el monto total del flete para activar este modo.'}
                    </div>
                  </div>
                )}

                {/* CBM FIELDS */}
                {freightTab === 'cbm' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                      {([['length', 'Largo (cm)'], ['width', 'Ancho (cm)'], ['height', 'Alto (cm)']] as [keyof Form, string][]).map(([k, lb]) => (
                        <div key={k}>
                          <label style={label}>{lb}</label>
                          <input type="number" value={f[k]} onChange={e => chF(k, e.target.value)} placeholder="0.0" style={{ ...inp, textAlign: 'center', fontSize: 13 }} step="0.1" min="0" />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                      <div>
                        <label style={label}>CBM Calculado</label>
                        <div style={{
                          width: '100%', background: C.bgInput, border: `1px solid ${cbm > 0 ? 'rgba(212,175,55,0.2)' : C.border}`,
                          borderRadius: 8, padding: '10px 12px', fontSize: 14, fontWeight: 700,
                          color: cbm > 0 ? C.goldLight : C.textMuted, textAlign: 'center'
                        }}>{cbm > 0 ? cbm.toFixed(6) : '0.000000'} m³</div>
                      </div>
                      <div>
                        <label style={label}>Peso (kg)</label>
                        <input type="number" value={f.weight} onChange={e => chF('weight', e.target.value)} placeholder="0.0" style={inp} step="0.1" min="0" />
                      </div>
                      <div>
                        <label style={label}>Tarifa Flete (USD/m³)</label>
                        <input type="number" value={f.cbmRate} onChange={e => chF('cbmRate', e.target.value)} style={inp} step="1" min="0" />
                      </div>
                    </div>
                  </>
                )}

                {/* GASTOS PROVEEDOR — SIEMPRE VISIBLE */}
                <div style={{
                  padding: '14px', borderRadius: 10, marginBottom: 12,
                  background: 'rgba(167,139,250,0.04)', border: `1px solid rgba(167,139,250,0.15)`
                }}>
                  <label style={{ ...label, color: C.purple }}>Gastos Proveedor — Envío a Almacén China (USD)</label>
                  <input
                    type="number"
                    value={f.supplierShipping}
                    onChange={e => chF('supplierShipping', e.target.value)}
                    placeholder="0.00"
                    style={{ ...inp, borderColor: v('supplierShipping') > 0 ? 'rgba(167,139,250,0.35)' : C.border }}
                    step="0.01" min="0"
                  />
                  <div style={{ marginTop: 6, fontSize: 9, color: C.textMuted, letterSpacing: 0.5 }}>
                    Se suma siempre al costo total — activo en ambos modos de flete
                  </div>
                </div>

                <div>
                  <label style={label}>Costos Fijos Importacion (USD total del lote)</label>
                  <input type="number" value={f.fixedCosts} onChange={e => chF('fixedCosts', e.target.value)} style={{ ...inp, borderColor: v('fixedCosts') > 0 ? 'rgba(212,175,55,0.35)' : C.border }} step="0.01" min="0" />
                  {v('fixedCosts') > 0 && (
                    <div style={{ fontSize: 9, color: C.goldDark, marginTop: 3, fontWeight: 600 }}>
                      ${fNum(v('fixedCosts'))} ÷ {parseInt(f.quantity) || 1} uds = ${fNum(v('fixedCosts') / (parseInt(f.quantity) || 1))}/ud
                    </div>
                  )}
                </div>

                <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '16px 0' }} />

                {/* TAXES */}
                <div style={secTitle}><span>💰</span> Impuestos y Porcentajes</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  {([['insuranceR', 'Seguro (% CIF)'], ['arancelR', 'Arancel (% CIF)'], ['iceR', 'ICE (% CIF)'], ['ivaR', 'IVA (%)']] as [keyof Form, string][]).map(([k, lb]) => (
                    <div key={k}>
                      <label style={label}>{lb}</label>
                      <input type="number" value={f[k]} onChange={e => chF(k, e.target.value)} style={inp} step="0.1" min="0" />
                    </div>
                  ))}
                </div>

                <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '16px 0' }} />

                {/* OPEX */}
                <div style={secTitle}><span>📊</span> OPEX Mensual Global (÷ cantidad automático)</div>
                <div style={{ background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.12)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: C.blue, fontWeight: 700, letterSpacing: 0.5, marginBottom: 10 }}>
                    💡 Ingresa el gasto mensual TOTAL — la app divide entre {parseInt(f.quantity) || 1} unidades automáticamente
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {([['galanetUsd', 'Internet Galanet'], ['adUsd', 'Publicidad'], ['packagingUsd', 'Empaques'], ['deliveryUsd', 'Delivery']] as [keyof Form, string][]).map(([k, lb]) => (
                      <div key={k}>
                        <label style={label}>{lb} (USD/mes)</label>
                        <input type="number" value={f[k]} onChange={e => chF(k, e.target.value)} style={inp} step="0.01" min="0" />
                        {(parseFloat(f[k]) || 0) > 0 && (
                          <div style={{ fontSize: 9, color: C.blue, marginTop: 3, fontWeight: 600 }}>
                            ${fNum(parseFloat(f[k]) || 0)} ÷ {parseInt(f.quantity) || 1} = ${fNum((parseFloat(f[k]) || 0) / (parseInt(f.quantity) || 1))}/ud
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '16px 0' }} />

                {/* MARGIN + SHIPPING */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={label}>Margen de Ganancia (%)</label>
                    <input type="number" value={f.marginR} onChange={e => chF('marginR', e.target.value)} style={inp} step="0.1" min="0" />
                  </div>
                  <div>
                    <label style={label}>Envio Nacional (Bs/unidad)</label>
                    <input type="number" value={f.shippingBs} onChange={e => chF('shippingBs', e.target.value)} style={inp} step="0.01" min="0" />
                  </div>
                </div>

                {/* MERMA */}
                <div style={{
                  marginTop: 10, padding: '14px', borderRadius: 10,
                  background: 'rgba(251,146,60,0.04)', border: `1px solid rgba(251,146,60,0.15)`
                }}>
                  <label style={{ ...label, color: C.orange }}>Merma (%)</label>
                  <input
                    type="number"
                    value={f.mermaR}
                    onChange={e => chF('mermaR', e.target.value)}
                    placeholder="0"
                    style={{ ...inp, borderColor: v('mermaR') > 0 ? `rgba(251,146,60,0.4)` : C.border, color: v('mermaR') > 0 ? C.orange : C.text }}
                    step="0.1" min="0"
                  />
                  <div style={{ marginTop: 6, fontSize: 9, color: C.textMuted, letterSpacing: 0.5 }}>
                    % del costo base reservado para cubrir pérdidas — se suma antes del margen
                  </div>
                </div>
              </div>
            </div>

            {/* --- RIGHT: BREAKDOWN --- */}
            <div style={{ ...card, animation: 'fadeUp 0.4s ease-out 0.1s both' }}>
              <div style={cardHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>📋</span>
                  <div>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>Desglose de Costos</span>
                    {f.productName && <div style={{ fontSize: 10, color: C.goldDark, fontWeight: 600, marginTop: 1 }}>{f.productName}</div>}
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: C.goldDark, background: 'rgba(212,175,55,0.1)', padding: '3px 8px', borderRadius: 5 }}>DESGLOSE</span>
              </div>
              <div style={cardBody}>
                {calc ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {[
                        { name: 'CIF (Costo Unitario)', val: calc.cifUnit, detail: `FOB $${fNum(calc.cifUnit)}`, hl: false },
                        ...(calc.insurance > 0 ? [{ name: `Seguro (${f.insuranceR}% del CIF)`, val: calc.insurance, detail: `${f.insuranceR}% de $${fNum(calc.cifUnit)}`, hl: false }] : []),
                        ...(calc.arancel > 0 ? [{ name: `Arancel (${f.arancelR}% del CIF)`, val: calc.arancel, detail: `${f.arancelR}% de $${fNum(calc.cifUnit)}`, hl: false }] : []),
                        ...(calc.ice > 0 ? [{ name: `ICE (${f.iceR}% del CIF)`, val: calc.ice, detail: `${f.iceR}% de $${fNum(calc.cifUnit)}`, hl: false }] : []),
                        ...(calc.iva > 0 ? [{ name: `IVA (${f.ivaR}% sobre CIF+Arl+ICE)`, val: calc.iva, detail: `${f.ivaR}% de $${fNum(calc.cifUnit + calc.arancel + calc.ice)}`, hl: false }] : []),
                        { name: calc.freightMode === 'fixed' ? `Flete Cerrado + Almacén China` : 'Flete CBM + Almacén China', val: calc.freight + calc.supplierShippingPerUnit, detail: calc.freightMode === 'fixed' ? `$${fNum(calc.freightFixed)}÷${calc.q} + prov $${fNum(calc.supplierShippingPerUnit)}` : (cbm > 0 ? `${cbm.toFixed(4)} m³ + prov $${fNum(calc.supplierShippingPerUnit)}` : `Sin CBM + prov $${fNum(calc.supplierShippingPerUnit)}`), hl: true },
                        ...(calc.totalOpex > 0 ? [{ name: 'OPEX por Unidad (total ÷ cantidad)', val: calc.totalOpex, detail: `$${fNum(calc.opexMonthly)} total ÷ ${calc.q} uds = $${fNum(calc.totalOpex)}/ud`, hl: true }] : []),
                        ...(calc.mermaAmount > 0 ? [{ name: `Merma (${f.mermaR}%)`, val: calc.mermaAmount, detail: `${f.mermaR}% del costo base $${fNum(calc.costBase)}`, hl: true }] : []),
                        { name: 'TOTAL COSTO + MARGEN', val: calc.finalPrice, detail: `Incluye ${f.marginR}% margen`, hl: false, total: true },
                      ].map((r, i) => ({ ...r, n: i + 1 })).map(item => (
                        <div key={item.n} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 0',
                          borderBottom: !item.total ? `1px solid rgba(28,28,44,0.5)` : 'none'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{
                              width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700,
                              background: item.total ? `linear-gradient(135deg,${C.goldDark},${C.gold})` : item.hl ? 'rgba(212,175,55,0.12)' : C.bgInput,
                              color: item.total ? '#0a0a0f' : item.hl ? C.gold : C.textMuted
                            }}>{item.n}</span>
                            <span style={{
                              fontSize: 12, fontWeight: item.total ? 700 : item.hl ? 600 : 400,
                              color: item.total ? C.goldLight : item.hl ? C.text : C.textSec,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>{item.name}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontFamily: 'var(--font-display)', fontSize: item.total ? 16 : 13,
                              fontWeight: item.total ? 800 : item.hl ? 700 : 600,
                              ...(item.total ? {
                                background: `linear-gradient(135deg,${C.goldPale},${C.gold},${C.goldDark})`,
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                              } : { color: C.text })
                            }}>{fUSD(item.val)}</div>
                            <div style={{ fontSize: 9, color: C.textMuted, marginTop: 1 }}>{item.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* PRECIO DE VENTA CARD */}
                    <div style={{
                      marginTop: 16, position: 'relative', borderRadius: 16, padding: 24,
                      background: `linear-gradient(135deg, rgba(212,175,55,0.06), rgba(212,175,55,0.02))`,
                      border: `1px solid ${C.borderGold}`, overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: 16, padding: 1,
                        background: `linear-gradient(160deg,${C.gold},${C.goldDark},transparent,transparent)`,
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor', maskComposite: 'exclude', pointerEvents: 'none'
                      }} />
                      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: C.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>PRECIO DE VENTA</div>
                        <div style={{
                          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, lineHeight: 1.1,
                          background: `linear-gradient(160deg,${C.goldPale},${C.goldLight},${C.gold})`,
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                        }}>{fUSD(calc.finalPrice)}</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{fBs(calc.sellingBs)}</div>
                            <div style={{ fontSize: 9, color: C.textMuted }}>Tasa {activeRate.toUpperCase()}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.goldLight }}>{fBs(calc.sellingBsP2P)}</div>
                            <div style={{ fontSize: 9, color: C.textMuted }}>Tasa P2P Efectivo</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 16 }}>
                          <div style={{
                            background: C.green + '10', border: `1px solid ${C.green}30`, borderRadius: 8,
                            padding: '6px 14px', fontSize: 11, fontWeight: 700, color: C.green
                          }}>Margen: {calc.profitPct.toFixed(1)}%</div>
                          <div style={{
                            background: C.orange + '10', border: `1px solid ${C.orange}30`, borderRadius: 8,
                            padding: '6px 14px', fontSize: 11, fontWeight: 700, color: C.orange
                          }}>Brecha: {calc.gap.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Profit breakdown mini */}
                    <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                      {[
                        { label: 'Ganancia/Unidad', value: fUSD(calc.profitPerUnit), color: C.green },
                        { label: 'Ganancia en Bs', value: fBs(calc.profitPerUnit * p2p), color: C.goldLight },
                        { label: 'Ganancia Total', value: fUSD(calc.profitPerUnit * calc.q), color: C.cyan },
                      ].map((item, i) => (
                        <div key={i} style={{
                          background: C.bgInput, border: `1px solid ${C.border}`,
                          borderRadius: 8, padding: '10px 12px', textAlign: 'center'
                        }}>
                          <div style={{ fontSize: 9, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: item.color, fontFamily: 'var(--font-display)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📦</div>
                    <div style={{ fontSize: 13, color: C.textMuted }}>Ingresa el costo USD del producto para ver el desglose completo</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: INVENTARIO ==================== */}
        {tab === 'inv' && (
          <div style={{ animation: 'fadeUp 0.4s ease-out' }}>
            {/* Add Product */}
            <div style={{ ...card, marginBottom: 20, animation: 'fadeUp 0.4s ease-out' }}>
              <div style={cardHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>➕</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>Agregar Producto al Inventario</span>
                </div>
              </div>
              <div style={{ ...cardBody, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: 200 }}>
                  <label style={label}>Nombre del Producto</label>
                  <input type="text" value={newProd.name} onChange={e => setNewProd(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Rebanadora 14-en-1" style={inp} />
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <label style={label}>Cantidad</label>
                  <input type="number" value={newProd.qty} onChange={e => setNewProd(p => ({ ...p, qty: e.target.value }))} placeholder="50" style={inp} step="1" min="0" />
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <label style={label}>Costo FOB (USD)</label>
                  <input type="number" value={newProd.fob} onChange={e => setNewProd(p => ({ ...p, fob: e.target.value }))} placeholder="0.37" style={inp} step="0.01" min="0" />
                </div>
                <button onClick={() => { addInv(); toast('Producto agregado al inventario') }} style={{
                  height: 44, padding: '0 24px', border: 'none', borderRadius: 8,
                  background: `linear-gradient(135deg,${C.goldDark},${C.gold})`, color: '#0a0a0f',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'var(--font-body)', whiteSpace: 'nowrap'
                }}>Agregar</button>
              </div>
            </div>

            {/* Inventory Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Productos', value: inv.length.toString(), icon: '📦', color: C.blue },
                { label: 'Inversion Total', value: fUSD(dashData.totalInvCost), icon: '💰', color: C.gold },
                { label: 'Unidades Vendidas', value: dashData.totalSold.toString(), icon: '✅', color: C.green },
                { label: 'Merma Estimada', value: dashData.totalMerma.toString() + ' uds', icon: '⚠️', color: C.orange },
              ].map((s, i) => (
                <div key={i} style={{ ...card, padding: 0 }}>
                  <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 24 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Inventory Table */}
            <div style={{ ...card, animation: 'fadeUp 0.4s ease-out 0.1s both' }}>
              <div style={cardHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>📋</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>Inventario Actual</span>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                {inv.length === 0 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 10, opacity: 0.2 }}>📦</div>
                    <div style={{ fontSize: 13, color: C.textMuted }}>No hay productos en el inventario</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Agrega productos usando el formulario de arriba</div>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                    <thead>
                      <tr>
                        {['Producto', 'Cantidad', 'Vendidos', 'Disponible', 'Costo FOB', 'Inversion', 'Merma 3%', 'Fecha', 'ACCIONES'].map(h => (
                          <th key={h} style={{
                            padding: '10px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700,
                            letterSpacing: 1, color: C.textMuted, textTransform: 'uppercase',
                            borderBottom: `1px solid ${C.border}`, background: C.bgSecondary
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inv.map(e => {
                        const merma = Math.round(e.qty * (e.mermaR / 100))
                        const avail = e.qty - e.sold - merma
                        return (
                          <tr key={e.id} style={{ borderBottom: `1px solid rgba(28,28,44,0.4)` }}>
                            <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: C.text }}>{e.product}</td>
                            <td style={{ padding: '12px 14px', fontSize: 13, color: C.textSec }}>{e.qty}</td>
                            <td style={{ padding: '12px 14px', fontSize: 13, color: C.green, fontWeight: 600 }}>{e.sold}</td>
                            <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: avail > 0 ? C.goldLight : C.red }}>{avail}</td>
                            <td style={{ padding: '12px 14px', fontSize: 13, color: C.textSec }}>{fUSD(e.fobCost)}</td>
                            <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: C.text }}>{fUSD(e.qty * e.fobCost)}</td>
                            <td style={{ padding: '12px 14px', fontSize: 13, color: C.orange }}>{merma} uds</td>
                            <td style={{ padding: '12px 14px', fontSize: 11, color: C.textMuted }}>{e.date}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button onClick={() => recordSale(e.id)} style={{
                                  padding: '5px 10px', border: `1px solid ${C.green}40`, borderRadius: 6,
                                  background: `${C.green}10`, color: C.green, fontSize: 11, fontWeight: 700,
                                  cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap'
                                }}>Vender</button>
                                <button onClick={() => startEdit(e)} title="Editar producto" style={{
                                  padding: '6px 8px', border: `1px solid rgba(212,175,55,0.35)`, borderRadius: 6,
                                  background: 'rgba(212,175,55,0.08)', color: C.goldLight,
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', lineHeight: 1,
                                  transition: 'all 0.2s'
                                }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                                <button onClick={() => deleteInv(e.id, e.product)} title="Eliminar producto" style={{
                                  padding: '6px 8px', border: `1px solid rgba(248,113,113,0.35)`, borderRadius: 6,
                                  background: 'rgba(248,113,113,0.08)', color: C.red,
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', lineHeight: 1,
                                  transition: 'all 0.2s'
                                }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <path d="M10 11v6M14 11v6"/>
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Sales History */}
            {sales.length > 0 && (
              <div style={{ ...card, marginTop: 20 }}>
                <div style={cardHead}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>🧾</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>Historial de Ventas</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.green }}>
                    Ingresos: {fUSD(dashData.totalRevenue)} | Ganancia Bruta: {fUSD(dashData.grossProfit)}
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                    <thead>
                      <tr>
                        {['Producto', 'Cantidad', 'Precio USD', 'Total', 'Fecha'].map(h => (
                          <th key={h} style={{
                            padding: '10px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700,
                            letterSpacing: 1, color: C.textMuted, textTransform: 'uppercase',
                            borderBottom: `1px solid ${C.border}`, background: C.bgSecondary
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sales.slice(0, 20).map(s => {
                        const entry = inv.find(e => e.id === s.invId)
                        return (
                          <tr key={s.id} style={{ borderBottom: `1px solid rgba(28,28,44,0.4)` }}>
                            <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: C.text }}>{entry?.product || '-'}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, color: C.textSec }}>{s.qty}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, color: C.goldLight, fontWeight: 600 }}>{fUSD(s.priceUSD)}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: C.text }}>{fUSD(s.qty * s.priceUSD)}</td>
                            <td style={{ padding: '10px 14px', fontSize: 11, color: C.textMuted }}>{s.date}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: DASHBOARD ==================== */}
        {tab === 'dash' && (
          <div style={{ animation: 'fadeUp 0.4s ease-out' }}>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Tasa P2P', value: p2p.toFixed(2) + ' Bs/$', icon: '💱', color: C.goldLight },
                { label: 'Brecha P2P vs BCV', value: ((p2p - rates.bcv) / rates.bcv * 100).toFixed(1) + '%', icon: '📈', color: C.orange },
                { label: 'Total Invertido', value: fUSD(dashData.totalInvCost), icon: '💸', color: C.red },
                { label: 'Ganancia Bruta', value: fUSD(dashData.grossProfit), icon: '🏆', color: C.green },
              ].map((kpi, i) => (
                <div key={i} style={{ ...card, padding: 0, animation: `fadeUp 0.4s ease-out ${i * 0.05}s both` }}>
                  <div style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: 28 }}>{kpi.icon}</div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 }}>{kpi.label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Brecha Cambiaria */}
              <div style={{ ...card, animation: 'fadeUp 0.4s ease-out 0.1s both' }}>
                <div style={cardHead}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>💱</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>Brecha Cambiaria</span>
                  </div>
                </div>
                <div style={{ ...cardBody, height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashData.brechaBar} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2c" />
                      <XAxis dataKey="name" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} />
                      <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={{ stroke: C.border }} />
                      <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: C.text, fontWeight: 700 }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Bs/$">
                        {dashData.brechaBar.map((_, i) => <Cell key={i} fill={[C.blue, C.green, C.gold][i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* OPEX Pie */}
              <div style={{ ...card, animation: 'fadeUp 0.4s ease-out 0.15s both' }}>
                <div style={cardHead}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>📊</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>Desglose OPEX</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.goldLight }}>
                    Total OPEX mensual: {fUSD(v('galanetUsd') + v('adUsd') + v('packagingUsd') + v('deliveryUsd'))}
                  </span>
                </div>
                <div style={{ ...cardBody, height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dashData.opexPie} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: $${value}`}>
                        {dashData.opexPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v: string) => <span style={{ color: C.textSec, fontSize: 11 }}>{v}</span>} />
                      <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cost Structure */}
              {calc && (
                <div style={{ ...card, animation: 'fadeUp 0.4s ease-out 0.2s both' }}>
                  <div style={cardHead}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>🏗️</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>Estructura de Costos por Unidad</span>
                    </div>
                  </div>
                  <div style={{ ...cardBody, height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashData.costBar} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2c" />
                        <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={{ stroke: C.border }} />
                        <YAxis type="category" dataKey="name" tick={{ fill: C.textSec, fontSize: 11 }} axisLine={{ stroke: C.border }} width={80} />
                        <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fUSD(v)} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} name="USD">
                          {dashData.costBar.map((_, i) => <Cell key={i} fill={[C.gold, C.red, C.blue, C.orange, C.purple, C.green][i]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Margin Analysis */}
              {calc && (
                <div style={{ ...card, animation: 'fadeUp 0.4s ease-out 0.25s both' }}>
                  <div style={cardHead}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>🎯</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>Analisis de Margen</span>
                    </div>
                </div>
                <div style={cardBody}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Precio de Venta', value: fUSD(calc.finalPrice), color: C.goldLight },
                      { label: 'Costo Total/Unidad', value: fUSD(calc.costWithMerma), color: C.red },
                      { label: 'Ganancia/Unidad', value: fUSD(calc.profitPerUnit), color: C.green },
                      { label: 'Margen Real', value: calc.profitPct.toFixed(1) + '%', color: calc.profitPct > 20 ? C.green : C.orange },
                      { label: 'ROI', value: (calc.profitPerUnit / calc.costWithMerma * 100).toFixed(1) + '%', color: C.cyan },
                      { label: 'Punto de Equilibrio', value: fUSD(calc.costWithMerma), color: C.purple },
                    ].map((m, i) => (
                      <div key={i} style={{
                        background: C.bgInput, border: `1px solid ${C.border}`,
                        borderRadius: 8, padding: '12px 14px'
                      }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Brecha P2P Detail */}
                  <div style={{ marginTop: 16, background: 'rgba(251,146,60,0.05)', border: `1px solid rgba(251,146,60,0.12)`, borderRadius: 8, padding: '14px 16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.orange, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Analisis de Friccion P2P</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        ['Tasa Bruta P2P', fBs(brecha.tasaBruta)],
                        ['Spread 1.5%', fBs(brecha.spread)],
                        ['Tasa Neta Efectiva', fBs(brecha.tasaNeta)],
                        ['Brecha vs BCV', ((p2p - rates.bcv) / rates.bcv * 100).toFixed(1) + '%'],
                      ].map(([lb, vl], i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ color: C.textMuted }}>{lb}</span>
                          <span style={{ color: C.text, fontWeight: 600 }}>{vl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ============ EDIT MODAL ============ */}
      {editId !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(6,6,10,0.88)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setEditId(null)}>
          <div style={{
            ...card, width: '100%', maxWidth: 460, margin: '0 24px',
            border: `1px solid rgba(212,175,55,0.3)`,
            boxShadow: `0 0 80px rgba(212,175,55,0.1), 0 24px 64px rgba(0,0,0,0.6)`,
            animation: 'fadeUp 0.25s ease-out'
          }} onClick={ev => ev.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ ...cardHead, borderBottom: `1px solid rgba(212,175,55,0.2)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(212,175,55,0.12)', border: `1px solid rgba(212,175,55,0.25)`
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.goldLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: C.goldLight }}>Editar Producto</div>
                  <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: 1 }}>Corrige nombre, stock o precios</div>
                </div>
              </div>
              <button onClick={() => setEditId(null)} style={{
                background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted,
                fontSize: 14, cursor: 'pointer', padding: '4px 8px', lineHeight: 1, transition: 'all 0.2s'
              }}>✕</button>
            </div>
            {/* Modal Body */}
            <div style={{ ...cardBody, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={label}>Nombre del Producto</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={ev => setEditData(p => ({ ...p, name: ev.target.value }))}
                  style={{ ...inp, borderColor: editData.name ? 'rgba(212,175,55,0.3)' : C.border }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={label}>Cantidad (unidades)</label>
                  <input
                    type="number"
                    value={editData.qty}
                    onChange={ev => setEditData(p => ({ ...p, qty: ev.target.value }))}
                    style={inp} step="1" min="0"
                  />
                </div>
                <div>
                  <label style={label}>Costo FOB (USD)</label>
                  <input
                    type="number"
                    value={editData.fob}
                    onChange={ev => setEditData(p => ({ ...p, fob: ev.target.value }))}
                    style={inp} step="0.01" min="0"
                  />
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button onClick={() => setEditId(null)} style={{
                  padding: '10px 20px', border: `1px solid ${C.border}`, borderRadius: 8,
                  background: 'transparent', color: C.textSec, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.2s'
                }}>Cancelar</button>
                <button onClick={saveEdit} style={{
                  padding: '10px 28px', border: 'none', borderRadius: 8,
                  background: `linear-gradient(135deg,${C.goldDark},${C.gold})`,
                  color: '#0a0a0f', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  boxShadow: `0 4px 16px rgba(212,175,55,0.25)`
                }}>Guardar Cambios</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ FOOTER ============ */}
      <footer style={{
        textAlign: 'center', padding: '24px', borderTop: `1px solid ${C.border}`,
        marginTop: 32, maxWidth: 1200, margin: '32px auto 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <img src="/a2k-logo.jpeg" alt="" style={{ width: 20, height: 20, borderRadius: 4 }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.goldDark, textTransform: 'uppercase' }}>A2K Digital Studio</span>
        </div>
        <p style={{ fontSize: 10, color: C.textMuted, fontWeight: 500 }}>
          ZYNC ELECTRONICS &copy; {new Date().getFullYear()} — Suite Financiera v3.0 MODO DIOS
        </p>
      </footer>
    </div>
  )
}
