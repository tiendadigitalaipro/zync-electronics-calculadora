'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Calculator,
  Package,
  ShoppingCart,
  TrendingUp,
  Settings,
  Plus,
  Trash2,
  Copy,
  Printer,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Banknote,
  Globe,
  Truck,
  Percent,
  BarChart3,
  FileText,
  X,
  ShieldAlert,
  Zap,
  Wifi,
  Megaphone,
  Gem,
  MapPin,
  Weight,
  RotateCcw,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
interface Config {
  tasaBanco: number;
  tasaUSDT: number;
  tasaVentaBCV: number;
  spreadUSDT: number;
  comisionZinli: number;
  comisionUSDTZinli: number;
  fleteTotalUSD: number;
  seguroCarga: number;
  courierImport2VenUSD: number;
  courierNacionalUSD: number;
  ivaChina: number;
  impuesto: number;
  opexInternetMensual: number;
  opexPublicidadMensual: number;
  opexEmpaquesUSD: number;
  opexDeliveryUSD: number;
  merma: number;
}

interface Product {
  id: string;
  nombre: string;
  costoUSD: number;
  pesoKg: number;
  cantidad: number;
  metodoPago: 'banco' | 'usdt';
  margen: number;
}

interface Sale {
  id: string;
  fecha: string;
  productoId: string;
  productoNombre: string;
  costoUnitBs: number;
  precioVentaBs: number;
  cantidad: number;
}

interface CalcResult {
  // Origin
  costoProductoBase: number;
  ivaChina: number;
  costoOrigenChina: number;
  // Logistics
  fleteTotalUSD: number;
  fletePorUnidadUSD: number;
  seguroCarga: number;
  courierImport2VenUSD: number;
  courierNacionalUSD: number;
  courierNacionalPorUnidadUSD: number;
  costoFOBTotal: number;
  costoFOBporUnidad: number;
  // Exchange
  tasaEfectivaP2P: number;
  costoFOBporUnidadBs: number;
  courierNacionalPorUnidadBs: number;
  costoAterrizajeBs: number;
  // OPEX
  opexInternetMensual: number;
  opexInternetPorUnidad: number;
  opexPublicidadMensual: number;
  opexPublicidadPorUnidad: number;
  opexEmpaquesPorUnidad: number;
  opexDeliveryPorUnidad: number;
  opexTotalPorUnidadUSD: number;
  opexTotalPorUnidadBs: number;
  costoTotalOperativoBs: number;
  // Risk
  costoRealPorUnidadBs: number;
  // Pricing
  puntoEquilibrio: number;
  margenUSDsobreProducto: number;
  margenUSDtotal: number;
  precioVentaBs: number;
  precioVentaUSD: number;
  gananciaUnitBs: number;
  gananciaUnitUSD: number;
  cubreBrecha: boolean;
  // Detail
  cantidad: number;
}

type CurrencyDisplay = 'Bs' | 'USD';
type TabType = 'calculator' | 'products' | 'sales' | 'dashboard';

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_CONFIG: Config = {
  tasaBanco: 570.75,
  tasaUSDT: 630,
  tasaVentaBCV: 485,
  spreadUSDT: 1.5,
  comisionZinli: 3.5,
  comisionUSDTZinli: 3,
  fleteTotalUSD: 97.50,
  seguroCarga: 1.5,
  courierImport2VenUSD: 2.00,
  courierNacionalUSD: 5.00,
  ivaChina: 13,
  impuesto: 0,
  opexInternetMensual: 34,
  opexPublicidadMensual: 15,
  opexEmpaquesUSD: 0.30,
  opexDeliveryUSD: 1.50,
  merma: 3,
};

const DEFAULT_PRODUCT: Product = {
  id: '',
  nombre: '',
  costoUSD: 0,
  pesoKg: 0.5,
  cantidad: 1,
  metodoPago: 'banco',
  margen: 40,
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function fmtBs(val: number): string {
  if (!isFinite(val) || isNaN(val)) return '0,00';
  return val.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtUSD(val: number): string {
  if (!isFinite(val) || isNaN(val)) return '$0.00';
  return '$' + val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtPct(val: number): string {
  if (!isFinite(val) || isNaN(val)) return '0,00%';
  return val.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + '%';
}

function fmtNum(val: number, dec: number = 4): string {
  if (!isFinite(val) || isNaN(val)) return '0';
  return val.toLocaleString('es-VE', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════════════════════════
// CALCULATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════
function calculateProduct(product: Product, config: Config): CalcResult {
  const qty = product.cantidad || 1;

  // ══════ 1. COSTO DE ORIGEN (por unidad) ══════
  const costoProductoBase = product.costoUSD;
  const ivaChinaUSD = costoProductoBase * (config.ivaChina / 100);
  const costoOrigenChina = costoProductoBase + ivaChinaUSD;

  // ══════ 2. LOGÍSTICA INTERNACIONAL (total envío → por unidad) ══════
  const fleteTotalUSD = config.fleteTotalUSD;
  const fletePorUnidadUSD = qty > 0 ? fleteTotalUSD / qty : 0;

  // Seguro de carga (% del valor de mercancía)
  const valorMercanciaTotal = costoOrigenChina * qty;
  const seguroCargaTotal = valorMercanciaTotal * (config.seguroCarga / 100);
  const seguroCargaPorUnidad = qty > 0 ? seguroCargaTotal / qty : 0;

  // Courier Import2Ven (total del envío)
  const courierImport2VenUSD = config.courierImport2VenUSD;

  // Courier nacional (total del envío)
  const courierNacionalUSD = config.courierNacionalUSD;
  const courierNacionalPorUnidadUSD = qty > 0 ? courierNacionalUSD / qty : 0;

  // ══════ 3. COSTO FOB TOTAL (por unidad) ══════
  const costoFOBTotal = valorMercanciaTotal + fleteTotalUSD + seguroCargaTotal + courierImport2VenUSD;
  const costoFOBporUnidad = qty > 0 ? costoFOBTotal / qty : 0;

  // ══════ 4. CONVERSIÓN CAMBIARIA ══════
  let tasaEfectivaP2P: number;
  if (product.metodoPago === 'usdt') {
    tasaEfectivaP2P = config.tasaUSDT * (1 + config.spreadUSDT / 100) * (1 + config.comisionUSDTZinli / 100) * (1 + config.comisionZinli / 100);
  } else {
    tasaEfectivaP2P = config.tasaBanco;
  }

  const costoFOBporUnidadBs = costoFOBporUnidad * tasaEfectivaP2P;

  // Courier nacional convertido a Bs (por unidad)
  const courierNacionalPorUnidadBs = courierNacionalPorUnidadUSD * tasaEfectivaP2P;

  // ══════ 5. COSTO ATERRIZAJE Bs (por unidad) ══════
  const costoAterrizajeBs = costoFOBporUnidadBs + courierNacionalPorUnidadBs;

  // ══════ 6. OPEX (costos fijos mensuales → por unidad) ══════
  const opexInternetMensual = config.opexInternetMensual;
  const opexInternetPorUnidad = qty > 0 ? opexInternetMensual / qty : 0;

  const opexPublicidadMensual = config.opexPublicidadMensual;
  const opexPublicidadPorUnidad = qty > 0 ? opexPublicidadMensual / qty : 0;

  // Estos son por unidad directamente
  const opexEmpaquesPorUnidad = config.opexEmpaquesUSD;
  const opexDeliveryPorUnidad = config.opexDeliveryUSD;

  const opexTotalPorUnidadUSD = opexInternetPorUnidad + opexPublicidadPorUnidad + opexEmpaquesPorUnidad + opexDeliveryPorUnidad;
  const opexTotalPorUnidadBs = opexTotalPorUnidadUSD * tasaEfectivaP2P;

  // ══════ 7. COSTO TOTAL OPERATIVO Bs (por unidad, antes de merma) ══════
  const costoTotalOperativoBs = costoAterrizajeBs + opexTotalPorUnidadBs;

  // ══════ 8. FACTOR DE RIESGO (merma) ══════
  const mermaFactor = 1 - config.merma / 100;
  const costoRealPorUnidadBs = mermaFactor > 0 ? costoTotalOperativoBs / mermaFactor : costoTotalOperativoBs;

  // ══════ 9. PUNTO DE EQUILIBRIO ══════
  const puntoEquilibrio = costoRealPorUnidadBs;

  // ══════ 10. PRECIO DE VENTA — margen sobre el PRODUCTO, no sobre todo ══════
  const margen = product.margen / 100;
  const costoRealPorUnidadUSD = config.tasaVentaBCV > 0 ? costoRealPorUnidadBs / config.tasaVentaBCV : 0;
  const margenUSDsobreProducto = costoProductoBase * margen;
  const precioVentaUSD = costoRealPorUnidadUSD + margenUSDsobreProducto;
  const precioVentaBs = precioVentaUSD * config.tasaVentaBCV;
  const margenUSDtotal = precioVentaUSD - costoRealPorUnidadUSD;

  // ══════ 11. GANANCIA ══════
  const gananciaUnitBs = precioVentaBs - costoRealPorUnidadBs;
  const gananciaUnitUSD = config.tasaVentaBCV > 0 ? gananciaUnitBs / config.tasaVentaBCV : 0;

  // ══════ 12. ¿CUBRE BRECHA? ══════
  const cubreBrecha = gananciaUnitUSD > 0;

  return {
    costoProductoBase,
    ivaChina: ivaChinaUSD,
    costoOrigenChina,
    fleteTotalUSD,
    fletePorUnidadUSD,
    seguroCarga: seguroCargaPorUnidad,
    courierImport2VenUSD,
    courierNacionalUSD,
    courierNacionalPorUnidadUSD,
    costoFOBTotal,
    costoFOBporUnidad,
    tasaEfectivaP2P,
    costoFOBporUnidadBs,
    courierNacionalPorUnidadBs,
    costoAterrizajeBs,
    opexInternetMensual,
    opexInternetPorUnidad,
    opexPublicidadMensual,
    opexPublicidadPorUnidad,
    opexEmpaquesPorUnidad,
    opexDeliveryPorUnidad,
    opexTotalPorUnidadUSD,
    opexTotalPorUnidadBs,
    costoTotalOperativoBs,
    costoRealPorUnidadBs,
    puntoEquilibrio,
    margenUSDsobreProducto,
    margenUSDtotal,
    precioVentaBs,
    precioVentaUSD,
    gananciaUnitBs,
    gananciaUnitUSD,
    cubreBrecha,
    cantidad: qty,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function Home() {
  const [config, setConfig] = useState<Config>(() => {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    try {
      const saved = localStorage.getItem('importcalc_config_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_CONFIG, ...parsed };
      }
      return DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  });
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('importcalc_products_v2');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [sales, setSales] = useState<Sale[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('importcalc_sales');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [currency, setCurrency] = useState<CurrencyDisplay>('Bs');
  const [configOpen, setConfigOpen] = useState(true);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [saleForm, setSaleForm] = useState<Omit<Sale, 'id'>>({
    fecha: todayStr(),
    productoId: '',
    productoNombre: '',
    costoUnitBs: 0,
    precioVentaBs: 0,
    cantidad: 1,
  });

  // ─── Product form state ───────────────────────────────────────────────
  const [productForm, setProductForm] = useState<Product>({ ...DEFAULT_PRODUCT });

  // ─── Save to localStorage ────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem('importcalc_config_v2', JSON.stringify(config)); } catch { /* */ }
  }, [config]);

  useEffect(() => {
    try { localStorage.setItem('importcalc_products_v2', JSON.stringify(products)); } catch { /* */ }
  }, [products]);

  useEffect(() => {
    try { localStorage.setItem('importcalc_sales', JSON.stringify(sales)); } catch { /* */ }
  }, [sales]);

  // ─── Current calculation ─────────────────────────────────────────────
  const currentCalc = useMemo(
    () => calculateProduct(productForm, config),
    [productForm, config]
  );

  // ─── Product results map ─────────────────────────────────────────────
  const productResults = useMemo(
    () => products.map((p) => ({ product: p, calc: calculateProduct(p, config) })),
    [products, config]
  );

  // ─── Dashboard stats ─────────────────────────────────────────────────
  const dashboardStats = useMemo(() => {
    const totalInvertidoUSD = products.reduce((s, p) => {
      const c = calculateProduct(p, config);
      return s + c.costoFOBTotal;
    }, 0);
    const totalIngresosBs = sales.reduce((s, sale) => s + sale.precioVentaBs * sale.cantidad, 0);
    const totalIngresosUSD = config.tasaVentaBCV > 0 ? totalIngresosBs / config.tasaVentaBCV : 0;
    const totalCostoBs = sales.reduce((s, sale) => s + sale.costoUnitBs * sale.cantidad, 0);
    const totalCostoUSD = config.tasaVentaBCV > 0 ? totalCostoBs / config.tasaVentaBCV : 0;
    const gananciaNetaUSD = totalIngresosUSD - totalCostoUSD;
    const margenReal = totalIngresosBs > 0 ? ((totalIngresosBs - totalCostoBs) / totalIngresosBs) * 100 : 0;
    const brecha = config.tasaBanco > 0
      ? ((config.tasaBanco - config.tasaVentaBCV) / config.tasaVentaBCV) * 100
      : 0;
    return { totalInvertidoUSD, totalIngresosBs, totalIngresosUSD, gananciaNetaUSD, margenReal, brecha, totalCostoBs };
  }, [products, sales, config]);

  // ─── Config handlers ─────────────────────────────────────────────────
  const updateConfig = useCallback((key: keyof Config, value: number | string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ─── Product handlers ────────────────────────────────────────────────
  function resetProductForm() {
    setProductForm({ ...DEFAULT_PRODUCT });
  }

  function addProduct() {
    if (!productForm.nombre.trim() || productForm.costoUSD <= 0) return;
    const newProduct: Product = { ...productForm, id: genId() };
    setProducts((prev) => [...prev, newProduct]);
    resetProductForm();
  }

  function removeProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function duplicateProduct(id: string) {
    const original = products.find((p) => p.id === id);
    if (!original) return;
    const dup: Product = { ...original, id: genId(), nombre: original.nombre + ' (copia)' };
    setProducts((prev) => [...prev, dup]);
  }

  // ─── Sale handlers ───────────────────────────────────────────────────
  function addSale() {
    if (!saleForm.productoId || saleForm.precioVentaBs <= 0 || saleForm.cantidad <= 0) return;
    const newSale: Sale = { ...saleForm, id: genId() };
    setSales((prev) => [...prev, newSale]);
    setSaleForm({ fecha: todayStr(), productoId: '', productoNombre: '', costoUnitBs: 0, precioVentaBs: 0, cantidad: 1 });
    setShowSalesModal(false);
  }

  function removeSale(id: string) {
    setSales((prev) => prev.filter((s) => s.id !== id));
  }

  function selectProductForSale(product: Product) {
    const calc = calculateProduct(product, config);
    setSaleForm({
      fecha: todayStr(),
      productoId: product.id,
      productoNombre: product.nombre,
      costoUnitBs: calc.costoRealPorUnidadBs,
      precioVentaBs: calc.precioVentaBs,
      cantidad: 1,
    });
    setShowSalesModal(true);
  }

  // ─── Print ───────────────────────────────────────────────────────────
  function handlePrint() {
    window.print();
  }

  // ─── Tasa efectiva display ───────────────────────────────────────────
  const tasaEfectivaUSDT = config.tasaUSDT * (1 + config.spreadUSDT / 100) * (1 + config.comisionUSDTZinli / 100) * (1 + config.comisionZinli / 100);

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #0d0f14 0%, #0a0b10 100%)' }}>
      {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
      <header className="navy-gradient text-white sticky top-0 z-50 no-print shadow-lg shadow-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight gold-gradient font-[family-name:var(--font-montserrat)]">A2K</span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[3px] text-[#94a3b8] font-[family-name:var(--font-montserrat)] -mt-0.5">Digital Studio</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[3px] font-[family-name:var(--font-montserrat)] text-[#d4a853]/70 hidden sm:block">Calculadora Profesional</span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-[2px] text-[#64748b] font-[family-name:var(--font-montserrat)]">de Importación</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrency(currency === 'Bs' ? 'USD' : 'Bs')}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all text-[#d4a853]"
              >
                {currency === 'Bs' ? '𝐁𝐬' : '$'}
              </button>
              <button
                onClick={handlePrint}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                title="Imprimir"
              >
                <Printer className="w-4 h-4 text-[#94a3b8]" />
              </button>
            </div>
          </div>
        </div>
        {/* Gold accent line */}
        <div className="gold-line" />
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* ═══ CONFIG PANEL ═════════════════════════════════════════════ */}
        <div className="no-print print-break">
          <button
            onClick={() => setConfigOpen(!configOpen)}
            className="w-full flex items-center justify-between glass-card px-4 sm:px-5 py-3 sm:py-4 hover:bg-white/[0.04] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#d4a853]/10 flex items-center justify-center">
                <Settings className="w-4 h-4 text-[#d4a853]" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-[#f1f5f9] text-sm sm:text-base font-[family-name:var(--font-montserrat)]">Configuración Avanzada</h2>
                <p className="text-xs text-[#64748b] hidden sm:block">Tasas, comisiones, logística, OPEX, riesgo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#64748b] hidden lg:inline">
                BCV: {fmtBs(config.tasaBanco)} Bs/$ | USDT: {fmtBs(config.tasaUSDT)} Bs/$ | Efectiva P2P: {fmtBs(tasaEfectivaUSDT)} Bs/$
              </span>
              {configOpen ? <ChevronUp className="w-4 h-4 text-[#64748b]" /> : <ChevronDown className="w-4 h-4 text-[#64748b]" />}
            </div>
          </button>

          {configOpen && (
            <div className="mt-2 glass-card p-4 sm:p-5 fade-in space-y-5">
              {/* Section: Tasas de Cambio */}
              <ConfigSection title="Tasas de Cambio" icon={<DollarSign className="w-4 h-4" />}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <CfgField label="Tasa Dólar Banco" sub="BCV oficial" value={config.tasaBanco} onChange={(v) => updateConfig('tasaBanco', v)} icon={<Banknote className="w-3.5 h-3.5" />} color="blue" />
                  <CfgField label="Tasa USDT" sub="compra" value={config.tasaUSDT} onChange={(v) => updateConfig('tasaUSDT', v)} icon={<Globe className="w-3.5 h-3.5" />} color="green" />
                  <CfgField label="Tasa Venta BCV" sub="precio público" value={config.tasaVentaBCV} onChange={(v) => updateConfig('tasaVentaBCV', v)} icon={<DollarSign className="w-3.5 h-3.5" />} color="teal" />
                </div>
              </ConfigSection>

              {/* Section: Comisiones P2P */}
              <ConfigSection title="Comisiones Financieras P2P" icon={<Zap className="w-4 h-4" />}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <CfgField label="Spread Compra USDT" sub="pérdida al comprar" value={config.spreadUSDT} onChange={(v) => updateConfig('spreadUSDT', v)} icon={<Percent className="w-3.5 h-3.5" />} color="orange" suffix="%" />
                  <CfgField label="Com. USDT→Zinli" sub="conversión" value={config.comisionUSDTZinli} onChange={(v) => updateConfig('comisionUSDTZinli', v)} icon={<Percent className="w-3.5 h-3.5" />} color="orange" suffix="%" />
                  <CfgField label="Com. Zinli Recarga" sub="fee recarga" value={config.comisionZinli} onChange={(v) => updateConfig('comisionZinli', v)} icon={<Percent className="w-3.5 h-3.5" />} color="orange" suffix="%" />
                </div>
                <div className="mt-3 p-3 rounded-xl bg-[#d4a853]/5 border border-[#d4a853]/15 flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-[#d4a853] font-semibold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Tasa Efectiva Real P2P:</span>
                  <span className="text-[#f1f5f9] font-bold text-sm gold-glow">{fmtBs(tasaEfectivaUSDT)} Bs/$</span>
                  <span className="text-[#94a3b8]">(Crees que pagas {fmtBs(config.tasaUSDT)} Bs/$ pero realmente pagas {fmtBs(tasaEfectivaUSDT)} Bs/$)</span>
                </div>
              </ConfigSection>

              {/* Section: Logística Internacional */}
              <ConfigSection title="Logística Internacional" icon={<Truck className="w-4 h-4" />}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <CfgField label="Flete Total Envío" sub="USD total del envío (ej: Biagio $97.50)" value={config.fleteTotalUSD} onChange={(v) => updateConfig('fleteTotalUSD', v)} icon={<Truck className="w-3.5 h-3.5" />} color="purple" prefix="$" />
                  <CfgField label="Courier Import2Ven" sub="USD total manejo" value={config.courierImport2VenUSD} onChange={(v) => updateConfig('courierImport2VenUSD', v)} icon={<Truck className="w-3.5 h-3.5" />} color="purple" prefix="$" />
                  <CfgField label="Courier Nacional" sub="USD total envío nacional" value={config.courierNacionalUSD} onChange={(v) => updateConfig('courierNacionalUSD', v)} icon={<Truck className="w-3.5 h-3.5" />} color="purple" prefix="$" />
                  <CfgField label="Seguro de Carga" sub="% valor mercancía" value={config.seguroCarga} onChange={(v) => updateConfig('seguroCarga', v)} icon={<ShieldAlert className="w-3.5 h-3.5" />} color="purple" suffix="%" />
                </div>
              </ConfigSection>

              {/* Section: Impuestos */}
              <ConfigSection title="Impuestos" icon={<Percent className="w-4 h-4" />}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <CfgField label="IVA China" sub="impuestos internos" value={config.ivaChina} onChange={(v) => updateConfig('ivaChina', v)} icon={<Percent className="w-3.5 h-3.5" />} color="red" suffix="%" />
                  <CfgField label="Arancel/Imp. Importación VE" sub="aduana venezolana" value={config.impuesto} onChange={(v) => updateConfig('impuesto', v)} icon={<Percent className="w-3.5 h-3.5" />} color="red" suffix="%" />
                </div>
              </ConfigSection>

              {/* Section: OPEX */}
              <ConfigSection title="OPEX por Unidad" icon={<TrendingUp className="w-4 h-4" />}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <CfgField label="Internet (Galanet)" sub="USD MENSUAL (se divide entre cantidad)" value={config.opexInternetMensual} onChange={(v) => updateConfig('opexInternetMensual', v)} icon={<Wifi className="w-3.5 h-3.5" />} color="teal" prefix="$" />
                  <CfgField label="Publicidad Redes" sub="USD MENSUAL (se divide entre cantidad)" value={config.opexPublicidadMensual} onChange={(v) => updateConfig('opexPublicidadMensual', v)} icon={<Megaphone className="w-3.5 h-3.5" />} color="teal" prefix="$" />
                  <CfgField label="Empaques" sub="USD por unidad" value={config.opexEmpaquesUSD} onChange={(v) => updateConfig('opexEmpaquesUSD', v)} icon={<Gem className="w-3.5 h-3.5" />} color="teal" prefix="$" />
                  <CfgField label="Delivery Local" sub="USD por unidad" value={config.opexDeliveryUSD} onChange={(v) => updateConfig('opexDeliveryUSD', v)} icon={<MapPin className="w-3.5 h-3.5" />} color="teal" prefix="$" />
                </div>
                <p className="mt-2 text-xs text-[#64748b]">
                  Los costos mensuales (internet, publicidad) se dividen entre las {currentCalc.cantidad} unidades. Empaques y delivery son por unidad.
                </p>
              </ConfigSection>

              {/* Section: Riesgo */}
              <ConfigSection title="Factor de Riesgo" icon={<ShieldAlert className="w-4 h-4" />}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <CfgField label="Merma (Defectuosos)" sub="% unidades dañadas" value={config.merma} onChange={(v) => updateConfig('merma', v)} icon={<AlertTriangle className="w-3.5 h-3.5" />} color="red" suffix="%" />
                </div>
                <p className="mt-2 text-xs text-[#64748b]">
                  Si ordenas {currentCalc.cantidad} unidades con {config.merma}% merma, solo recibes {Math.round(currentCalc.cantidad * (1 - config.merma / 100))} vendibles. El costo de las defectuosas se distribuye entre las buenas.
                </p>
              </ConfigSection>

              {/* Bottom bar */}
              <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#64748b]">Brecha cambiaria:</span>
                  <span className="font-semibold neon-red">
                    {fmtPct(((config.tasaBanco - config.tasaVentaBCV) / config.tasaVentaBCV) * 100)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#64748b]">Fricción P2P extra:</span>
                  <span className="font-semibold text-[#d4a853]">
                    +{fmtPct(((tasaEfectivaUSDT - config.tasaUSDT) / config.tasaUSDT) * 100)}
                  </span>
                </div>
                <button
                  onClick={() => setConfig(DEFAULT_CONFIG)}
                  className="ml-auto text-[#64748b] hover:text-[#d4a853] underline transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restablecer valores
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══ TAB NAVIGATION ═══════════════════════════════════════════ */}
        <div className="no-print">
          <div className="flex gap-1 glass-card p-1 overflow-x-auto">
            {([
              { key: 'calculator' as TabType, label: 'Calculadora', icon: Calculator },
              { key: 'products' as TabType, label: 'Productos', icon: Package },
              { key: 'sales' as TabType, label: 'Ventas', icon: ShoppingCart },
              { key: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
            ]).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'gold-bg-gradient text-[#0d0f14] shadow-lg shadow-[#d4a853]/20'
                      : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ TAB: CALCULATOR ══════════════════════════════════════════ */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 fade-in">
            {/* Product Form */}
            <div className="glass-card">
              <div className="px-4 sm:px-5 pt-5 pb-3 border-b border-white/[0.06]">
                <h3 className="font-semibold text-[#f1f5f9] flex items-center gap-2 font-[family-name:var(--font-montserrat)]">
                  <Package className="w-4 h-4 text-[#d4a853]" />
                  Datos del Producto
                </h3>
              </div>
              <div className="px-4 sm:px-5 py-5 space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1">Nombre del producto</label>
                  <input
                    type="text"
                    value={productForm.nombre}
                    onChange={(e) => setProductForm((p) => ({ ...p, nombre: e.target.value }))}
                    placeholder="Ej: Audífonos Bluetooth TWS"
                    className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.05] text-sm text-[#f1f5f9] placeholder:text-[#4a5568]"
                  />
                </div>

                {/* Cost + Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1">Precio unitario (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.costoUSD || ''}
                        onChange={(e) => setProductForm((p) => ({ ...p, costoUSD: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.05] text-sm text-[#f1f5f9] placeholder:text-[#4a5568]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.pesoKg || ''}
                      onChange={(e) => setProductForm((p) => ({ ...p, pesoKg: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.50"
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.05] text-sm text-[#f1f5f9] placeholder:text-[#4a5568]"
                    />
                  </div>
                </div>


                {/* Quantity + Margin */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1">Cantidad (unidades)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={productForm.cantidad || ''}
                      onChange={(e) => setProductForm((p) => ({ ...p, cantidad: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.05] text-sm text-[#f1f5f9]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1">Margen deseado (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        step="1"
                        value={productForm.margen || ''}
                        onChange={(e) => setProductForm((p) => ({ ...p, margen: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.05] text-sm text-[#f1f5f9]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] text-sm">%</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-2">Método de Pago</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setProductForm((p) => ({ ...p, metodoPago: 'banco' }))}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        productForm.metodoPago === 'banco'
                          ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#60a5fa]'
                          : 'border-white/[0.06] text-[#64748b] hover:border-white/[0.12] hover:bg-white/[0.04]'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      Banco BCV
                    </button>
                    <button
                      onClick={() => setProductForm((p) => ({ ...p, metodoPago: 'usdt' }))}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        productForm.metodoPago === 'usdt'
                          ? 'border-[#4ade80] bg-[#4ade80]/10 text-[#4ade80]'
                          : 'border-white/[0.06] text-[#64748b] hover:border-white/[0.12] hover:bg-white/[0.04]'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      USDT → Zinli
                    </button>
                  </div>
                  {productForm.metodoPago === 'usdt' && (
                    <div className="mt-2 p-2 rounded-xl bg-[#d4a853]/5 border border-[#d4a853]/15 text-xs text-[#d4a853] space-y-0.5">
                      <p className="font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Fricción financiera P2P:</p>
                      <p>Tasa nominal: {fmtBs(config.tasaUSDT)} Bs/$ → Tasa REAL: <strong>{fmtBs(currentCalc.tasaEfectivaP2P)} Bs/$</strong></p>
                      <p>Spread {config.spreadUSDT}% + Com USDT→Zinli {config.comisionUSDTZinli}% + Com Zinli {config.comisionZinli}%</p>
                    </div>
                  )}
                </div>

                {/* Add button */}
                <button
                  onClick={addProduct}
                  disabled={!productForm.nombre.trim() || productForm.costoUSD <= 0}
                  className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar a lista de productos
                </button>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-4">
              <div className="glass-card">
                <div className="px-4 sm:px-5 pt-5 pb-3 flex items-center justify-between border-b border-white/[0.06]">
                  <div>
                    <h3 className="font-semibold text-[#f1f5f9] flex items-center gap-2 font-[family-name:var(--font-montserrat)]">
                      <FileText className="w-4 h-4 text-[#d4a853]" />
                      Desglose Profesional
                    </h3>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      {productForm.metodoPago === 'banco' ? 'Banco BCV' : 'USDT → Zinli'} | {productForm.nombre || 'Producto sin nombre'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReceipt(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.06] hover:bg-white/[0.08] text-[#94a3b8] text-xs font-medium transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Recibo
                  </button>
                </div>
                <div className="px-4 sm:px-5 py-4 space-y-1 text-xs max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {/* ── COSTO DE ORIGEN ── */}
                  <div className="pt-2 pb-1 mb-2 section-divider">
                    <span className="section-title">Costo de Origen</span>
                  </div>
                  <BR label="1. Costo producto base (1688/Alibaba)" value={fmtUSD(currentCalc.costoProductoBase)} />
                  <BR label={`2. (+) IVA China (${config.ivaChina}%)`} value={fmtUSD(currentCalc.ivaChina)} type="cost" />
                  <BR label="3. (=) Costo Origen China" value={fmtUSD(currentCalc.costoOrigenChina)} type="sub" />

                  {/* ── LOGÍSTICA ── */}
                  <div className="pt-2 pb-1 mb-2 mt-3 section-divider">
                    <span className="section-title">Logística Internacional</span>
                  </div>
                  <BR label={`4. (+) Flete total (${fmtUSD(currentCalc.fleteTotalUSD)} / ${currentCalc.cantidad} und)`} value={fmtUSD(currentCalc.fletePorUnidadUSD) + ' c/u'} type="cost" />
                  <BR label={`5. (+) Seguro de carga (${config.seguroCarga}%)`} value={fmtUSD(currentCalc.seguroCarga)} type="cost" />
                  <BR label={`6. (+) Courier Import2Ven (${fmtUSD(currentCalc.courierImport2VenUSD)} / ${currentCalc.cantidad} und)`} value={fmtUSD(currentCalc.cantidad > 0 ? currentCalc.courierImport2VenUSD / currentCalc.cantidad : 0)} type="cost" />
                  <BR label="7. ═══ COSTO FOB POR UNIDAD" value={fmtUSD(currentCalc.costoFOBporUnidad)} type="sub-bold" />

                  {/* ── CAMBIO ── */}
                  <div className="pt-2 pb-1 mb-2 mt-3 section-divider">
                    <span className="section-title">Conversión Cambiaria</span>
                  </div>
                  {productForm.metodoPago === 'usdt' && (
                    <div className="py-1 px-2 rounded-lg bg-[#d4a853]/5 border border-[#d4a853]/10 -mx-1 mb-1">
                      <div className="flex justify-between text-[#d4a853]">
                        <span>Tasa Efectiva P2P (REAL)</span>
                        <span className="font-bold">{fmtBs(currentCalc.tasaEfectivaP2P)} Bs/$</span>
                      </div>
                      <div className="text-[10px] text-[#94a3b8] mt-0.5">Incluye spread + comisiones USDT→Zinli + Zinli recarga</div>
                    </div>
                  )}
                  <BR label={`8. (×) Tasa ${productForm.metodoPago === 'usdt' ? 'USDT→Zinli' : 'Banco BCV'}`} value={`${fmtBs(currentCalc.tasaEfectivaP2P)} Bs/$`} type="rate" />
                  <BR label="9. (=) Costo FOB por unidad Bs" value={fmtBs(currentCalc.costoFOBporUnidadBs) + ' Bs'} type="sub" />

                  {/* ── ATERRIZAJE ── */}
                  <div className="pt-2 pb-1 mb-2 mt-3 section-divider">
                    <span className="section-title">Aterrizaje Nacional</span>
                  </div>
                  <BR label={`10. (+) Courier nacional (${fmtUSD(currentCalc.courierNacionalUSD)} / ${currentCalc.cantidad} und)`} value={fmtBs(currentCalc.courierNacionalPorUnidadBs) + ' Bs'} type="cost" />
                  <BR label="11. ═══ COSTO ATERRIZAJE Bs" value={fmtBs(currentCalc.costoAterrizajeBs) + ' Bs'} type="sub-bold" />

                  {/* ── OPEX ── */}
                  <div className="pt-2 pb-1 mb-2 mt-3 section-divider">
                    <span className="section-title">Gastos Operativos OPEX</span>
                  </div>
                  <BR label="12. (+) OPEX por unidad" value={fmtUSD(currentCalc.opexTotalPorUnidadUSD)} type="sub" />
                  <div className="pl-4 space-y-0.5 my-1">
                    <OR label={`• Internet (${fmtUSD(currentCalc.opexInternetMensual)} mens / ${currentCalc.cantidad} und)`} value={fmtUSD(currentCalc.opexInternetPorUnidad)} />
                    <OR label={`• Publicidad (${fmtUSD(currentCalc.opexPublicidadMensual)} mens / ${currentCalc.cantidad} und)`} value={fmtUSD(currentCalc.opexPublicidadPorUnidad)} />
                    <OR label={`• Empaques`} value={fmtUSD(currentCalc.opexEmpaquesPorUnidad)} />
                    <OR label={`• Delivery local`} value={fmtUSD(currentCalc.opexDeliveryPorUnidad)} />
                  </div>
                  <BR label="13. ═══ COSTO TOTAL OPERATIVO Bs" value={fmtBs(currentCalc.costoTotalOperativoBs) + ' Bs'} type="sub-bold" />

                  {/* ── RIESGO ── */}
                  <div className="pt-2 pb-1 mb-2 mt-3 section-divider">
                    <span className="section-title">Factor de Riesgo</span>
                  </div>
                  <BR label={`14. (+) Factor merma (${config.merma}%)`} value={fmtBs(currentCalc.costoRealPorUnidadBs - currentCalc.costoTotalOperativoBs) + ' Bs'} type="cost" />
                  <div className="text-[10px] text-[#64748b] px-2 py-0.5">
                    1 und × (1 - {config.merma}%) = {(1 - config.merma / 100).toFixed(1)} und vendibles reales
                  </div>

                  {/* ── COSTO REAL ── */}
                  <div className="mt-3 breakdown-total">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-[#d4a853] font-[family-name:var(--font-montserrat)]">15. ═══ COSTO REAL POR UNIDAD Bs</span>
                      <span className="text-lg font-bold gold-glow">{fmtBs(currentCalc.costoRealPorUnidadBs)} Bs</span>
                    </div>
                  </div>

                  {/* ── PRECIO DE VENTA ── */}
                  <div className="mt-4 pt-3 border-t border-[#d4a853]/20">
                    <div className="section-title mb-2">━━━━ PRECIO DE VENTA ━━━━</div>
                    <BR label="16. Punto de equilibrio" value={fmtBs(currentCalc.puntoEquilibrio) + ' Bs'} type="base" />
                    <BR label={`17. (+) Margen sobre producto (${productForm.margen}%) = ${fmtUSD(currentCalc.margenUSDsobreProducto)}`} value={fmtBs(currentCalc.margenUSDsobreProducto * currentCalc.tasaEfectivaP2P) + ' Bs'} type="cost" />
                    <div className="champagne-price-box mt-2">
                      <div className="flex flex-col items-end text-right">
                        <span className="text-[10px] uppercase tracking-[2px] text-[#b8942e]/80 font-[family-name:var(--font-montserrat)] mb-1">18. ═══ PRECIO DE VENTA REC.</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-montserrat)]" style={{ color: '#d4a853', textShadow: '0 0 20px rgba(212,168,83,0.4), 0 0 40px rgba(212,168,83,0.15)' }}>{fmtUSD(currentCalc.precioVentaUSD)}</span>
                        </div>
                        <span className="text-sm text-[#94a3b8] mt-0.5" style={{ color: 'rgba(212,168,83,0.6)' }}>{fmtBs(currentCalc.precioVentaBs)} Bs</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full" style={{ background: '#d4a853' }} />
                        <span className="text-[10px] tracking-wide" style={{ color: 'rgba(212,168,83,0.5)' }}>Tasa de conversion aplicada: {fmtBs(config.tasaVentaBCV)} Bs/$</span>
                      </div>
                    </div>
                    <BR label="19. Ganancia por unidad" value={fmtUSD(currentCalc.gananciaUnitUSD)} type={currentCalc.gananciaUnitBs >= 0 ? 'profit' : 'loss'} />
                    <div className={`flex items-center gap-2 p-2.5 rounded-xl border mt-2 ${
                      currentCalc.cubreBrecha
                        ? 'bg-[#4ade80]/8 border-[#4ade80]/20 text-[#4ade80]'
                        : 'bg-[#f87171]/8 border-[#f87171]/20 text-[#f87171]'
                    }`}>
                      {currentCalc.cubreBrecha ? (
                        <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#f87171] shrink-0" />
                      )}
                      <span className="text-xs font-medium">
                        20. ¿Cubre brecha cambiaria?{' '}
                        <strong>{currentCalc.cubreBrecha ? 'SÍ' : 'NO'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* ── TASA EFECTIVA FOOTER ── */}
                  <div className="mt-3 p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #0a0b10, #151820)' }}>
                    <div className="section-title mb-0.5">Tasa Efectiva Real</div>
                    <div className="text-sm font-bold text-[#f1f5f9]">
                      {fmtBs(currentCalc.tasaEfectivaP2P)} Bs/$
                    </div>
                    <div className="text-[10px] text-[#64748b] mt-0.5">
                      {productForm.metodoPago === 'usdt'
                        ? `Después de spread ${config.spreadUSDT}% + com USDT→Zinli ${config.comisionUSDTZinli}% + com Zinli ${config.comisionZinli}%`
                        : 'Tasa Banco BCV oficial (sin fricción P2P)'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: PRODUCTS ════════════════════════════════════════════ */}
        {activeTab === 'products' && (
          <div className="glass-card fade-in">
            <div className="px-4 sm:px-5 pt-5 pb-3 flex items-center justify-between border-b border-white/[0.06]">
              <h3 className="font-semibold text-[#f1f5f9] flex items-center gap-2 font-[family-name:var(--font-montserrat)]">
                <Package className="w-4 h-4 text-[#d4a853]" />
                Lista de Productos ({products.length})
              </h3>
            </div>
            {products.length === 0 ? (
              <div className="px-5 pb-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-white/[0.03] flex items-center justify-center mb-3">
                  <Package className="w-8 h-8 text-[#4a5568]" />
                </div>
                <p className="text-[#64748b] text-sm">No hay productos agregados</p>
                <p className="text-[#4a5568] text-xs mt-1">Ve a la calculadora y agrega productos</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#64748b] text-xs uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th className="text-left px-4 py-3 font-semibold">Producto</th>
                      <th className="text-center px-3 py-3 font-semibold">Método</th>
                      <th className="text-right px-3 py-3 font-semibold">FOB USD</th>
                      <th className="text-right px-3 py-3 font-semibold">Costo Real Bs</th>
                      <th className="text-right px-3 py-3 font-semibold">Precio Venta</th>
                      <th className="text-right px-3 py-3 font-semibold">Ganancia</th>
                      <th className="text-center px-3 py-3 font-semibold">¿Brecha?</th>
                      <th className="text-center px-3 py-3 font-semibold no-print">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {productResults.map(({ product: p, calc }) => (
                      <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#f1f5f9] max-w-[150px] truncate">{p.nombre}</div>
                          <div className="text-xs text-[#64748b]">{p.cantidad} und × {p.pesoKg}kg | {p.margen}% margen</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.metodoPago === 'banco'
                              ? 'bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20'
                              : 'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20'
                          }`}>
                            {p.metodoPago === 'banco' ? 'Banco' : 'USDT'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-[#94a3b8]">{fmtUSD(calc.costoFOBporUnidad)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-[#f1f5f9]">{fmtBs(calc.costoRealPorUnidadBs)} Bs</td>
                        <td className="px-3 py-3 text-right">
                          <div className="font-bold text-sm" style={{ color: '#d4a853', textShadow: '0 0 10px rgba(212,168,83,0.3)' }}>{fmtUSD(calc.precioVentaUSD)}</div>
                          <div className="text-[10px] text-[#94a3b8]">{fmtBs(calc.precioVentaBs)} Bs</div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className={calc.gananciaUnitBs >= 0 ? 'neon-green' : 'neon-red'}>
                            {fmtBs(calc.gananciaUnitBs)} Bs
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {calc.cubreBrecha ? (
                            <CheckCircle2 className="w-5 h-5 text-[#4ade80] mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-[#f87171] mx-auto" />
                          )}
                        </td>
                        <td className="px-3 py-3 no-print">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => selectProductForSale(p)}
                              className="p-1.5 rounded-lg text-[#d4a853] hover:bg-white/[0.06] transition-colors"
                              title="Registrar venta"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => duplicateProduct(p.id)}
                              className="p-1.5 rounded-lg text-[#64748b] hover:bg-white/[0.06] transition-colors"
                              title="Duplicar"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeProduct(p.id)}
                              className="p-1.5 rounded-lg text-[#f87171] hover:bg-[#f87171]/10 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: SALES ═══════════════════════════════════════════════ */}
        {activeTab === 'sales' && (
          <div className="space-y-4 fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#f1f5f9] flex items-center gap-2 font-[family-name:var(--font-montserrat)]">
                <ShoppingCart className="w-4 h-4 text-[#d4a853]" />
                Registro de Ventas ({sales.length})
              </h3>
              <button
                onClick={() => {
                  setSaleForm({ fecha: todayStr(), productoId: '', productoNombre: '', costoUnitBs: 0, precioVentaBs: 0, cantidad: 1 });
                  setShowSalesModal(true);
                }}
                className="btn-primary flex items-center gap-2 text-sm py-2"
              >
                <Plus className="w-4 h-4" />
                Registrar Venta
              </button>
            </div>
            <div className="glass-card">
              {sales.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/[0.03] flex items-center justify-center mb-3">
                    <ShoppingCart className="w-8 h-8 text-[#4a5568]" />
                  </div>
                  <p className="text-[#64748b] text-sm">No hay ventas registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[#64748b] text-xs uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                        <th className="text-left px-3 py-3 font-semibold">Producto</th>
                        <th className="text-right px-3 py-3 font-semibold">Costo Unit</th>
                        <th className="text-right px-3 py-3 font-semibold">Precio Venta</th>
                        <th className="text-center px-3 py-3 font-semibold">Cant.</th>
                        <th className="text-right px-3 py-3 font-semibold">Ganancia</th>
                        <th className="text-center px-3 py-3 font-semibold no-print"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {sales.map((sale) => {
                        const ganancia = (sale.precioVentaBs - sale.costoUnitBs) * sale.cantidad;
                        return (
                          <tr key={sale.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="px-4 py-3 text-[#64748b] text-xs">{sale.fecha}</td>
                            <td className="px-3 py-3 font-medium text-[#f1f5f9] max-w-[150px] truncate">{sale.productoNombre}</td>
                            <td className="px-3 py-3 text-right text-[#64748b]">{fmtBs(sale.costoUnitBs)} Bs</td>
                            <td className="px-3 py-3 text-right text-[#94a3b8]">{fmtBs(sale.precioVentaBs)} Bs</td>
                            <td className="px-3 py-3 text-center text-[#94a3b8]">{sale.cantidad}</td>
                            <td className={`px-3 py-3 text-right font-semibold ${ganancia >= 0 ? 'neon-green' : 'neon-red'}`}>
                              {fmtBs(ganancia)} Bs
                            </td>
                            <td className="px-3 py-3 no-print">
                              <button
                                onClick={() => removeSale(sale.id)}
                                className="p-1.5 rounded-lg text-[#f87171] hover:bg-[#f87171]/10 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ TAB: DASHBOARD ═══════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <DashCard title="Total Invertido" value={fmtUSD(dashboardStats.totalInvertidoUSD)} sublabel="en productos" icon={<DollarSign className="w-5 h-5" />} color="blue" />
              <DashCard title="Total Ingresos" value={fmtBs(dashboardStats.totalIngresosBs) + ' Bs'} sublabel={fmtUSD(dashboardStats.totalIngresosUSD)} icon={<TrendingUp className="w-5 h-5" />} color="teal" />
              <DashCard title="Ganancia Neta" value={fmtUSD(dashboardStats.gananciaNetaUSD)} sublabel={fmtBs(dashboardStats.totalIngresosBs - dashboardStats.totalCostoBs) + ' Bs'} icon={dashboardStats.gananciaNetaUSD >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />} color={dashboardStats.gananciaNetaUSD >= 0 ? 'green' : 'red'} />
              <DashCard title="Margen Real" value={fmtPct(dashboardStats.margenReal)} sublabel="promedio" icon={<Percent className="w-5 h-5" />} color="purple" />
              <DashCard title="Tasa Efectiva P2P" value={fmtBs(tasaEfectivaUSDT) + ' Bs/$'} sublabel={`vs ${fmtBs(config.tasaUSDT)} nominal`} icon={<Zap className="w-5 h-5" />} color="amber" />
            </div>

            <div className="glass-card p-4 sm:p-5">
              <h3 className="font-semibold text-[#f1f5f9] flex items-center gap-2 mb-4 font-[family-name:var(--font-montserrat)]">
                <BarChart3 className="w-4 h-4 text-[#d4a853]" />
                Análisis de Productos
              </h3>
              {productResults.length === 0 ? (
                <p className="text-[#64748b] text-sm text-center py-8">No hay productos para analizar</p>
              ) : (
                <div className="space-y-3">
                  {productResults.map(({ product: p, calc }) => (
                    <div key={p.id} className="border border-white/[0.06] rounded-xl p-3 hover:border-white/[0.1] transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-[#f1f5f9] text-sm">{p.nombre}</div>
                          <div className="text-xs text-[#64748b]">{p.cantidad} und | {p.metodoPago === 'banco' ? 'Banco' : 'USDT'} | Tasa Ef: {fmtBs(calc.tasaEfectivaP2P)} Bs/$</div>
                        </div>
                        {calc.cubreBrecha ? <CheckCircle2 className="w-4 h-4 text-[#4ade80]" /> : <XCircle className="w-4 h-4 text-[#f87171]" />}
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                        <div><span className="text-[#64748b]">Costo Real: </span><span className="font-medium text-[#94a3b8]">{fmtBs(calc.costoRealPorUnidadBs)} Bs</span></div>
                        <div><span className="text-[#64748b]">Venta: </span><span className="font-bold" style={{ color: '#d4a853', textShadow: '0 0 8px rgba(212,168,83,0.3)' }}>{fmtUSD(calc.precioVentaUSD)}</span><span className="text-[#94a3b8] ml-1">/ {fmtBs(calc.precioVentaBs)} Bs</span></div>
                        <div><span className="text-[#64748b]">Ganancia: </span><span className={`font-medium ${calc.gananciaUnitBs >= 0 ? 'neon-green' : 'neon-red'}`}>{fmtUSD(calc.gananciaUnitUSD)}</span><span className="text-[#94a3b8] ml-1">/ {fmtBs(calc.gananciaUnitBs)} Bs</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card p-4 sm:p-5">
              <h3 className="font-semibold text-[#f1f5f9] flex items-center gap-2 mb-4 font-[family-name:var(--font-montserrat)]">
                <FileText className="w-4 h-4 text-[#d4a853]" />
                Resumen Rápido
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="text-2xl font-bold text-[#f1f5f9]">{products.length}</div>
                  <div className="text-xs text-[#64748b] mt-1">Productos</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="text-2xl font-bold text-[#f1f5f9]">{sales.length}</div>
                  <div className="text-xs text-[#64748b] mt-1">Ventas</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="text-2xl font-bold neon-green">{productResults.filter((r) => r.calc.cubreBrecha).length}</div>
                  <div className="text-xs text-[#64748b] mt-1">Cubren Brecha</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="text-2xl font-bold neon-red">{productResults.filter((r) => !r.calc.cubreBrecha).length}</div>
                  <div className="text-xs text-[#64748b] mt-1">No Cubren</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════════ */}
      <footer className="mt-auto border-t border-white/[0.04] no-print" style={{ background: '#0a0b10' }}>
        <div className="gold-line" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#64748b]">
            <span className="gold-gradient font-semibold font-[family-name:var(--font-montserrat)]">A2K Digital Studio</span> — Calculadora Profesional de Importación Venezuela
          </p>
          <p className="text-xs text-[#4a5568]">
            Datos guardados localmente en tu navegador
          </p>
        </div>
      </footer>

      {/* ═══ SALE MODAL ══════════════════════════════════════════════════ */}
      {showSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSalesModal(false)} />
          <div className="relative glass-card shadow-2xl w-full max-w-md fade-in" style={{ background: '#151820', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-[#f1f5f9] font-[family-name:var(--font-montserrat)]">Registrar Venta</h2>
                <button onClick={() => setShowSalesModal(false)} className="p-1 rounded-lg hover:bg-white/[0.06] text-[#64748b] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1">Producto</label>
                  <select
                    value={saleForm.productoId}
                    onChange={(e) => {
                      const p = products.find((pr) => pr.id === e.target.value);
                      if (p) {
                        const calc = calculateProduct(p, config);
                        setSaleForm({
                          ...saleForm,
                          productoId: p.id,
                          productoNombre: p.nombre,
                          costoUnitBs: calc.costoRealPorUnidadBs,
                          precioVentaBs: calc.precioVentaBs,
                        });
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.05] text-sm text-[#f1f5f9] cursor-pointer"
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1">Fecha</label>
                    <input
                      type="date"
                      value={saleForm.fecha}
                      onChange={(e) => setSaleForm((s) => ({ ...s, fecha: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.05] text-sm text-[#f1f5f9]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={saleForm.cantidad || ''}
                      onChange={(e) => setSaleForm((s) => ({ ...s, cantidad: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.05] text-sm text-[#f1f5f9]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1">Costo Unit (Bs)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={saleForm.costoUnitBs || ''}
                      onChange={(e) => setSaleForm((s) => ({ ...s, costoUnitBs: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.05] text-sm text-[#f1f5f9]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#94a3b8] mb-1">Precio Venta (Bs)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={saleForm.precioVentaBs || ''}
                      onChange={(e) => setSaleForm((s) => ({ ...s, precioVentaBs: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.05] text-sm text-[#f1f5f9]"
                    />
                  </div>
                </div>
                {saleForm.precioVentaBs > 0 && saleForm.costoUnitBs > 0 && (
                  <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex justify-between text-[#64748b]">
                      <span>Ganancia por unidad:</span>
                      <span className={saleForm.precioVentaBs - saleForm.costoUnitBs >= 0 ? 'neon-green font-semibold' : 'neon-red font-semibold'}>
                        {fmtBs(saleForm.precioVentaBs - saleForm.costoUnitBs)} Bs
                      </span>
                    </div>
                    <div className="flex justify-between text-[#64748b]">
                      <span>Ganancia total:</span>
                      <span className={(saleForm.precioVentaBs - saleForm.costoUnitBs) * saleForm.cantidad >= 0 ? 'neon-green font-semibold' : 'neon-red font-semibold'}>
                        {fmtBs((saleForm.precioVentaBs - saleForm.costoUnitBs) * saleForm.cantidad)} Bs
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={addSale}
                  disabled={!saleForm.productoId || saleForm.precioVentaBs <= 0 || saleForm.cantidad <= 0}
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  Registrar Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ RECEIPT MODAL ══════════════════════════════════════════════ */}
      {showReceipt && (
        <ReceiptModal
          product={productForm}
          calc={currentCalc}
          config={config}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ConfigSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-[#d4a853]">{icon}</div>
        <h4 className="section-title">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function CfgField({
  label, sub, value, onChange, icon, color, prefix, suffix,
}: {
  label: string; sub: string; value: number; onChange: (v: number) => void;
  icon: React.ReactNode; color: string; prefix?: string; suffix?: string;
}) {
  const cMap: Record<string, string> = {
    blue: 'border-[#3b82f6]/20 focus-within:border-[#3b82f6]/40',
    green: 'border-[#4ade80]/20 focus-within:border-[#4ade80]/40',
    teal: 'border-[#d4a853]/20 focus-within:border-[#d4a853]/40',
    orange: 'border-[#f59e0b]/20 focus-within:border-[#f59e0b]/40',
    purple: 'border-[#a855f7]/20 focus-within:border-[#a855f7]/40',
    red: 'border-[#f87171]/20 focus-within:border-[#f87171]/40',
  };
  const iMap: Record<string, string> = {
    blue: 'bg-[#3b82f6]/10 text-[#60a5fa]',
    green: 'bg-[#4ade80]/10 text-[#4ade80]',
    teal: 'bg-[#d4a853]/10 text-[#d4a853]',
    orange: 'bg-[#f59e0b]/10 text-[#f59e0b]',
    purple: 'bg-[#a855f7]/10 text-[#a855f7]',
    red: 'bg-[#f87171]/10 text-[#f87171]',
  };
  return (
    <div className={`cfg-field-dark border ${cMap[color] || cMap.teal}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded flex items-center justify-center ${iMap[color] || iMap.teal}`}>{icon}</div>
        <div>
          <div className="text-xs font-medium text-[#f1f5f9] leading-tight">{label}</div>
          <div className="text-[10px] text-[#64748b] leading-tight">{sub}</div>
        </div>
      </div>
      <div className="relative">
        {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-sm">{prefix}</span>}
        <input
          type="number"
          min="0"
          step="0.01"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full ${prefix ? 'pl-7' : 'pl-2.5'} ${suffix ? 'pr-7' : 'pr-2.5'} py-2 rounded-lg border border-white/[0.06] bg-white/[0.05] focus:outline-none text-sm text-[#f1f5f9] font-medium`}
        />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] text-sm">{suffix}</span>}
      </div>
    </div>
  );
}

function BR({ label, value, type = 'base' }: { label: string; value: string; type?: 'base' | 'cost' | 'sub' | 'sub-bold' | 'total' | 'rate' | 'profit' | 'loss' | 'gain' }) {
  const styles: Record<string, string> = {
    base: 'text-[#94a3b8]',
    cost: 'text-[#94a3b8] bg-white/[0.02] -mx-2 px-2 rounded-lg',
    sub: 'font-semibold text-[#f1f5f9]',
    'sub-bold': 'font-bold text-[#f1f5f9] breakdown-subtotal border-t border-white/[0.04] pt-2 mt-1',
    total: 'font-bold text-[#f1f5f9] border-t border-white/[0.04] pt-2 mt-1',
    rate: 'text-[#d4a853] font-semibold bg-[#d4a853]/5 -mx-2 px-2 rounded-lg',
    profit: 'neon-green font-semibold',
    gain: 'neon-green font-semibold',
    loss: 'neon-red font-semibold',
  };
  return (
    <div className={`flex justify-between items-center py-1 px-2 ${styles[type]}`}>
      <span className="text-xs leading-snug">{label}</span>
      <span className="text-xs font-medium text-right ml-2 whitespace-nowrap">{value}</span>
    </div>
  );
}

function OR({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-0.5 px-2">
      <span className="text-[11px] text-[#64748b]">{label}</span>
      <span className="text-[11px] text-[#94a3b8]">{value}</span>
    </div>
  );
}

function DashCard({
  title, value, sublabel, icon, color,
}: {
  title: string; value: string; sublabel: string; icon: React.ReactNode; color: string;
}) {
  const iMap: Record<string, string> = {
    blue: 'bg-[#3b82f6]/10 text-[#60a5fa]',
    teal: 'bg-[#d4a853]/10 text-[#d4a853]',
    green: 'bg-[#4ade80]/10 text-[#4ade80]',
    red: 'bg-[#f87171]/10 text-[#f87171]',
    purple: 'bg-[#a855f7]/10 text-[#a855f7]',
    amber: 'bg-[#f59e0b]/10 text-[#f59e0b]',
  };
  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iMap[color] || iMap.teal}`}>{icon}</div>
      </div>
      <div className="text-xs text-[#64748b] font-medium mb-1">{title}</div>
      <div className="text-lg sm:text-xl font-bold text-[#f1f5f9] leading-tight">{value}</div>
      <div className="text-xs text-[#4a5568] mt-1">{sublabel}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RECEIPT MODAL
// ═══════════════════════════════════════════════════════════════════════════
function ReceiptModal({
  product, calc, config, onClose,
}: {
  product: Product;
  calc: CalcResult;
  config: Config;
  onClose: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);

  function handlePrintReceipt() {
    const el = receiptRef.current;
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Recibo A2K Digital Studio</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; color: #1a2332; }
        .receipt { border: 2px dashed #94a3b8; border-radius: 12px; padding: 24px; max-width: 400px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #d4a853; padding-bottom: 12px; margin-bottom: 16px; }
        .header h1 { font-size: 18px; font-weight: 800; color: #0f172a; }
        .header p { font-size: 11px; color: #64748b; }
        .product-name { font-size: 14px; font-weight: 700; text-align: center; margin-bottom: 12px; color: #0f172a; }
        .section-title { font-size: 9px; font-weight: 700; color: #d4a853; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 12px 0 6px; }
        .row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; font-size: 12px; }
        .row .label { color: #475569; }
        .row .value { font-weight: 600; color: #1e293b; }
        .row.total { font-size: 13px; font-weight: 800; color: #0f172a; border-top: 2px solid #d4a853; padding-top: 6px; margin-top: 4px; }
        .row.grand-total { font-size: 16px; font-weight: 800; color: #d4a853; background: #fdf8ed; padding: 8px; border-radius: 8px; margin-top: 8px; }
        .row.sale-price { font-size: 16px; font-weight: 800; color: #059669; background: #ecfdf5; padding: 8px; border-radius: 8px; margin-top: 8px; }
        .indicator { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-top: 8px; }
        .indicator.yes { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .indicator.no { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .footer { text-align: center; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #cbd5e1; }
        .footer p { font-size: 9px; color: #94a3b8; }
        .tasa-box { background: #1e293b; color: white; padding: 8px; border-radius: 6px; text-align: center; margin-top: 8px; }
        .tasa-box .big { font-size: 16px; font-weight: 800; }
        .tasa-box .small { font-size: 9px; color: #94a3b8; margin-top: 2px; }
      </style></head><body>
      ${el.innerHTML}
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto fade-in" style={{ background: '#151820', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#f1f5f9] font-[family-name:var(--font-montserrat)]">Recibo Profesional</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06] text-[#64748b] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Receipt Content */}
          <div ref={receiptRef} className="receipt-box">
            {/* Print-only header */}
            <div className="header print-only" style={{ display: 'none' }}>
              <h1>A2K DIGITAL STUDIO</h1>
              <p>Calculadora Profesional de Importación</p>
            </div>

            <div className="product-name">{product.nombre || 'Producto sin nombre'}</div>

            <div className="section-title">Costo de Origen</div>
            <div className="row"><span className="label">Costo producto base</span><span className="value">{fmtUSD(calc.costoProductoBase)}</span></div>
            <div className="row"><span className="label">IVA China ({config.ivaChina}%)</span><span className="value">{fmtUSD(calc.ivaChina)}</span></div>
            <div className="row total"><span className="label">Costo Origen China</span><span className="value">{fmtUSD(calc.costoOrigenChina)}</span></div>

            <div className="section-title">Logística Internacional</div>
            <div className="row"><span className="label">Flete por unidad</span><span className="value">{fmtUSD(calc.fletePorUnidadUSD)}</span></div>
            <div className="row"><span className="label">Seguro de carga</span><span className="value">{fmtUSD(calc.seguroCarga)}</span></div>
            <div className="row total"><span className="label">Costo FOB por unidad</span><span className="value">{fmtUSD(calc.costoFOBporUnidad)}</span></div>

            <div className="section-title">Conversión Cambiaria</div>
            <div className="row"><span className="label">Tasa {product.metodoPago === 'usdt' ? 'USDT→Zinli' : 'Banco BCV'}</span><span className="value">{fmtBs(calc.tasaEfectivaP2P)} Bs/$</span></div>
            <div className="row total"><span className="label">Costo FOB en Bs</span><span className="value">{fmtBs(calc.costoFOBporUnidadBs)} Bs</span></div>

            <div className="section-title">Aterrizaje Nacional</div>
            <div className="row"><span className="label">Courier nacional</span><span className="value">{fmtBs(calc.courierNacionalPorUnidadBs)} Bs</span></div>
            <div className="row total"><span className="label">Costo Aterrizaje</span><span className="value">{fmtBs(calc.costoAterrizajeBs)} Bs</span></div>

            <div className="section-title">OPEX</div>
            <div className="row"><span className="label">OPEX por unidad</span><span className="value">{fmtUSD(calc.opexTotalPorUnidadUSD)}</span></div>
            <div className="row total"><span className="label">Costo Total Operativo</span><span className="value">{fmtBs(calc.costoTotalOperativoBs)} Bs</span></div>

            <div className="section-title">Factor de Riesgo</div>
            <div className="row"><span className="label">Merma ({config.merma}%)</span><span className="value">{fmtBs(calc.costoRealPorUnidadBs - calc.costoTotalOperativoBs)} Bs</span></div>
            <div className="row grand-total"><span className="label">COSTO REAL POR UNIDAD</span><span className="value">{fmtBs(calc.costoRealPorUnidadBs)} Bs</span></div>

            <div className="section-title">Precio de Venta</div>
            <div className="row"><span className="label">Punto de equilibrio</span><span className="value">{fmtBs(calc.puntoEquilibrio)} Bs</span></div>
            <div className="row"><span className="label">Margen sobre producto ({product.margen}%)</span><span className="value">{fmtUSD(calc.margenUSDsobreProducto)}</span></div>
            <div className="row sale-price"><span className="label">PRECIO DE VENTA REC.</span><span className="value" style={{ color: '#d4a853', fontSize: '1.1rem', fontWeight: 800 }}>{fmtUSD(calc.precioVentaUSD)}</span></div>
            <div className="row"><span className="label">Equivalente en Bs</span><span className="value">{fmtBs(calc.precioVentaBs)} Bs</span></div>
            <div className="row" style={{ borderBottom: '1px solid rgba(212,168,83,0.15)' }}><span className="label">Tasa aplicada</span><span className="value">{fmtBs(config.tasaVentaBCV)} Bs/$</span></div>
            <div className="row"><span className="label">Ganancia por unidad</span><span className="value">{fmtUSD(calc.gananciaUnitUSD)}</span></div>

            <div className={`indicator ${calc.cubreBrecha ? 'yes' : 'no'}`}>
              <span>{calc.cubreBrecha ? '✓' : '✗'}</span>
              <span>¿Cubre brecha cambiaria? {calc.cubreBrecha ? 'SÍ' : 'NO'}</span>
            </div>

            <div className="tasa-box">
              <div className="small">TASA EFECTIVA REAL</div>
              <div className="big">{fmtBs(calc.tasaEfectivaP2P)} Bs/$</div>
              <div className="small">{product.metodoPago === 'usdt' ? `Incluye spread + comisiones P2P` : 'Tasa Banco BCV oficial'}</div>
            </div>

            <div className="footer">
              <p>A2K Digital Studio — Calculadora Profesional de Importación</p>
              <p>Generado el {new Date().toLocaleDateString('es-VE')}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4 no-print">
            <button
              onClick={handlePrintReceipt}
              className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
            >
              <Printer className="w-4 h-4" />
              Imprimir Recibo
            </button>
            <button
              onClick={onClose}
              className="btn-secondary flex items-center justify-center gap-2 text-sm py-2.5 px-6"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
