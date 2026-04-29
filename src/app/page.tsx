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
  Box,
  ShieldAlert,
  Zap,
  Wifi,
  Megaphone,
  Gem,
  MapPin,
  Weight,
  Ruler,
  RotateCcw,
  Sun,
  Moon,
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
  fleteKg: number;
  fleteCBM: number;
  fleteMetodo: 'peso' | 'volumen';
  seguroCarga: number;
  courierImport2Ven: number;
  courierNacional: number;
  ivaChina: number;
  impuesto: number;
  opexInternet: number;
  opexPublicidad: number;
  opexEmpaques: number;
  opexDelivery: number;
  merma: number;
}

interface Product {
  id: string;
  nombre: string;
  costoUSD: number;
  pesoKg: number;
  dimL: number;
  dimW: number;
  dimH: number;
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
  fleteInternacional: number;
  seguroCarga: number;
  courierImport2Ven: number;
  costoFOBTotal: number;
  // Exchange
  tasaEfectivaP2P: number;
  costoConvertidoBs: number;
  courierNacionalBs: number;
  costoAterrizajeBs: number;
  // OPEX
  opexTotalUSD: number;
  opexTotalBs: number;
  costoTotalOperativoBs: number;
  // Risk
  costoRealPorUnidadBs: number;
  // Pricing
  puntoEquilibrio: number;
  precioVentaBs: number;
  precioVentaUSD: number;
  gananciaUnitBs: number;
  gananciaUnitUSD: number;
  cubreBrecha: boolean;
  // Detail
  cbm: number;
  fleteDetalle: string;
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
  fleteKg: 3.50,
  fleteCBM: 65,
  fleteMetodo: 'peso',
  seguroCarga: 1.5,
  courierImport2Ven: 2.00,
  courierNacional: 5.00,
  ivaChina: 13,
  impuesto: 0,
  opexInternet: 0.50,
  opexPublicidad: 1.00,
  opexEmpaques: 0.30,
  opexDelivery: 1.50,
  merma: 3,
};

const DEFAULT_PRODUCT: Product = {
  id: '',
  nombre: '',
  costoUSD: 0,
  pesoKg: 0.5,
  dimL: 20,
  dimW: 15,
  dimH: 10,
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
  // 1. Costo producto base
  const costoProductoBase = product.costoUSD;

  // 2. IVA China
  const ivaChinaUSD = costoProductoBase * (config.ivaChina / 100);

  // 3. Costo origen China
  const costoOrigenChina = costoProductoBase + ivaChinaUSD;

  // Calculate CBM
  const cbm = (product.dimL * product.dimW * product.dimH) / 1000000;

  // 4. Flete internacional — auto-select whichever is more expensive
  const fletePorPeso = config.fleteKg * product.pesoKg;
  const fletePorVolumen = config.fleteCBM * cbm;
  const fleteInternacional = Math.max(fletePorPeso, fletePorVolumen);
  const fleteDetalle = config.fleteMetodo === 'auto'
    ? (fletePorPeso >= fletePorVolumen ? 'peso' : 'volumen (CBM)')
    : config.fleteMetodo;

  // 5. Seguro de carga (% of merchandise value)
  const seguroCarga = costoOrigenChina * (config.seguroCarga / 100);

  // 6. Courier Import2Ven handling
  const courierImport2Ven = config.courierImport2Ven * product.pesoKg;

  // 7. COSTO FOB TOTAL
  const costoFOBTotal = costoOrigenChina + fleteInternacional + seguroCarga + courierImport2Ven;

  // 8. Tasa efectiva P2P
  let tasaEfectivaP2P: number;
  if (product.metodoPago === 'usdt') {
    tasaEfectivaP2P = config.tasaUSDT * (1 + config.spreadUSDT / 100) * (1 + config.comisionUSDTZinli / 100) * (1 + config.comisionZinli / 100);
  } else {
    tasaEfectivaP2P = config.tasaBanco;
  }

  // 9. Costo convertido Bs
  const costoConvertidoBs = costoFOBTotal * tasaEfectivaP2P;

  // 10. Courier nacional Bs
  const courierNacionalBs = config.courierNacional * tasaEfectivaP2P;

  // 11. COSTO ATERRIZAJE Bs
  const costoAterrizajeBs = costoConvertidoBs + courierNacionalBs;

  // 12. OPEX total USD
  const opexTotalUSD = config.opexInternet + config.opexPublicidad + config.opexEmpaques + config.opexDelivery;

  // OPEX total Bs
  const opexTotalBs = opexTotalUSD * tasaEfectivaP2P;

  // 13. COSTO TOTAL OPERATIVO Bs (per unit, before merma)
  const costoTotalOperativoBs = costoAterrizajeBs + opexTotalBs;

  // 14. Factor merma — adjust for defective units
  const mermaFactor = 1 - config.merma / 100;
  const costoRealPorUnidadBs = mermaFactor > 0 ? costoTotalOperativoBs / mermaFactor : costoTotalOperativoBs;

  // 15. Punto de equilibrio
  const puntoEquilibrio = costoRealPorUnidadBs;

  // 16. Precio de venta with margin
  const margen = product.margen / 100;
  const precioVentaBs = margen >= 1 ? costoRealPorUnidadBs * 10 : costoRealPorUnidadBs / (1 - margen);

  // 17. En USD (BCV)
  const precioVentaUSD = config.tasaVentaBCV > 0 ? precioVentaBs / config.tasaVentaBCV : 0;

  // 18. Ganancia
  const gananciaUnitBs = precioVentaBs - costoRealPorUnidadBs;
  const gananciaUnitUSD = config.tasaVentaBCV > 0 ? gananciaUnitBs / config.tasaVentaBCV : 0;

  // 19. ¿Cubre brecha?
  const costoEnUSD_BCVRate = config.tasaVentaBCV > 0 ? costoRealPorUnidadBs / config.tasaVentaBCV : 0;
  const cubreBrecha = gananciaUnitUSD > 0 && precioVentaUSD > costoEnUSD_BCVRate;

  return {
    costoProductoBase,
    ivaChina: ivaChinaUSD,
    costoOrigenChina,
    fleteInternacional,
    seguroCarga,
    courierImport2Ven,
    costoFOBTotal,
    tasaEfectivaP2P,
    costoConvertidoBs,
    courierNacionalBs,
    costoAterrizajeBs,
    opexTotalUSD,
    opexTotalBs,
    costoTotalOperativoBs,
    costoRealPorUnidadBs,
    puntoEquilibrio,
    precioVentaBs,
    precioVentaUSD,
    gananciaUnitBs,
    gananciaUnitUSD,
    cubreBrecha,
    cbm,
    fleteDetalle,
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
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem('importcalc_darkmode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch { return false; }
  });
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

  // Dark mode effect
  useEffect(() => {
    try { localStorage.setItem('importcalc_darkmode', String(darkMode)); } catch { /* */ }
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
      return s + c.costoFOBTotal * p.cantidad;
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
      <header className="navy-gradient text-white sticky top-0 z-50 no-print shadow-lg shadow-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/zync-logo.png"
                alt="ZYNC ELECTRONICS"
                className="h-10 sm:h-12 w-auto rounded-md"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setCurrency(currency === 'Bs' ? 'USD' : 'Bs')}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-xs sm:text-sm font-medium hover:bg-white/20 transition-colors"
              >
                {currency === 'Bs' ? '𝐁𝐬' : '$'}
              </button>
              <button
                onClick={handlePrint}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Imprimir"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* ═══ CONFIG PANEL ═════════════════════════════════════════════ */}
        <div className="no-print print-break">
          <button
            onClick={() => setConfigOpen(!configOpen)}
            className="w-full flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 sm:px-5 py-3 sm:py-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Settings className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-slate-800 text-sm sm:text-base">Configuración Avanzada</h2>
                <p className="text-xs text-slate-400 hidden sm:block">Tasas, comisiones, logística, OPEX, riesgo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden lg:inline">
                BCV: {fmtBs(config.tasaBanco)} Bs/$ | USDT: {fmtBs(config.tasaUSDT)} Bs/$ | Efectiva P2P: {fmtBs(tasaEfectivaUSDT)} Bs/$
              </span>
              {configOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>

          {configOpen && (
            <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 fade-in space-y-5">
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
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-amber-700 font-semibold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Tasa Efectiva Real P2P:</span>
                  <span className="text-amber-900 font-bold text-sm">{fmtBs(tasaEfectivaUSDT)} Bs/$</span>
                  <span className="text-amber-600">(Crees que pagas {fmtBs(config.tasaUSDT)} Bs/$ pero realmente pagas {fmtBs(tasaEfectivaUSDT)} Bs/$)</span>
                </div>
              </ConfigSection>

              {/* Section: Logística Internacional */}
              <ConfigSection title="Logística Internacional" icon={<Truck className="w-4 h-4" />}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <CfgField label="Flete por Peso" sub="USD/kg" value={config.fleteKg} onChange={(v) => updateConfig('fleteKg', v)} icon={<Weight className="w-3.5 h-3.5" />} color="purple" prefix="$" />
                  <CfgField label="Flete por Volumen" sub="USD/CBM" value={config.fleteCBM} onChange={(v) => updateConfig('fleteCBM', v)} icon={<Box className="w-3.5 h-3.5" />} color="purple" prefix="$" />
                  <CfgField label="Seguro de Carga" sub="% valor mercancía" value={config.seguroCarga} onChange={(v) => updateConfig('seguroCarga', v)} icon={<ShieldAlert className="w-3.5 h-3.5" />} color="purple" suffix="%" />
                  <CfgField label="Courier Import2Ven" sub="USD/kg manejo" value={config.courierImport2Ven} onChange={(v) => updateConfig('courierImport2Ven', v)} icon={<Truck className="w-3.5 h-3.5" />} color="purple" prefix="$" />
                  <CfgField label="Courier Nacional" sub="USD/paquete" value={config.courierNacional} onChange={(v) => updateConfig('courierNacional', v)} icon={<Truck className="w-3.5 h-3.5" />} color="purple" prefix="$" />
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
                  <CfgField label="Internet (Galanet)" sub="USD/unidad" value={config.opexInternet} onChange={(v) => updateConfig('opexInternet', v)} icon={<Wifi className="w-3.5 h-3.5" />} color="teal" prefix="$" />
                  <CfgField label="Publicidad Redes" sub="USD/unidad" value={config.opexPublicidad} onChange={(v) => updateConfig('opexPublicidad', v)} icon={<Megaphone className="w-3.5 h-3.5" />} color="teal" prefix="$" />
                  <CfgField label="Empaques" sub="USD/unidad" value={config.opexEmpaques} onChange={(v) => updateConfig('opexEmpaques', v)} icon={<Gem className="w-3.5 h-3.5" />} color="teal" prefix="$" />
                  <CfgField label="Delivery Local" sub="USD/unidad" value={config.opexDelivery} onChange={(v) => updateConfig('opexDelivery', v)} icon={<MapPin className="w-3.5 h-3.5" />} color="teal" prefix="$" />
                </div>
              </ConfigSection>

              {/* Section: Riesgo */}
              <ConfigSection title="Factor de Riesgo" icon={<ShieldAlert className="w-4 h-4" />}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <CfgField label="Merma (Defectuosos)" sub="% unidades dañadas" value={config.merma} onChange={(v) => updateConfig('merma', v)} icon={<AlertTriangle className="w-3.5 h-3.5" />} color="red" suffix="%" />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Si ordenas 100 unidades con {config.merma}% merma, solo recibes {100 - config.merma} vendibles. El costo de las {config.merma} defectuosas se distribuye entre las buenas.
                </p>
              </ConfigSection>

              {/* Bottom bar */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Brecha cambiaria:</span>
                  <span className="font-semibold text-red-500">
                    {fmtPct(((config.tasaBanco - config.tasaVentaBCV) / config.tasaVentaBCV) * 100)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Fricción P2P extra:</span>
                  <span className="font-semibold text-amber-500">
                    +{fmtPct(((tasaEfectivaUSDT - config.tasaUSDT) / config.tasaUSDT) * 100)}
                  </span>
                </div>
                <button
                  onClick={() => setConfig(DEFAULT_CONFIG)}
                  className="ml-auto text-slate-400 hover:text-slate-600 underline transition-colors flex items-center gap-1"
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
          <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-x-auto">
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
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
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-4 sm:px-5 pt-5 pb-3">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Package className="w-4 h-4 text-teal-500" />
                  Datos del Producto
                </h3>
              </div>
              <div className="px-4 sm:px-5 pb-5 space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nombre del producto</label>
                  <input
                    type="text"
                    value={productForm.nombre}
                    onChange={(e) => setProductForm((p) => ({ ...p, nombre: e.target.value }))}
                    placeholder="Ej: Audífonos Bluetooth TWS"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm text-slate-800 placeholder:text-slate-300"
                  />
                </div>

                {/* Cost + Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Precio unitario (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.costoUSD || ''}
                        onChange={(e) => setProductForm((p) => ({ ...p, costoUSD: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm text-slate-800 placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.pesoKg || ''}
                      onChange={(e) => setProductForm((p) => ({ ...p, pesoKg: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.50"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm text-slate-800 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Dimensions */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Dimensiones (cm) — para cálculo CBM</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">L</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={productForm.dimL || ''}
                        onChange={(e) => setProductForm((p) => ({ ...p, dimL: parseFloat(e.target.value) || 0 }))}
                        placeholder="20"
                        className="w-full pl-7 pr-2 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm text-slate-800"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">W</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={productForm.dimW || ''}
                        onChange={(e) => setProductForm((p) => ({ ...p, dimW: parseFloat(e.target.value) || 0 }))}
                        placeholder="15"
                        className="w-full pl-7 pr-2 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm text-slate-800"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">H</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={productForm.dimH || ''}
                        onChange={(e) => setProductForm((p) => ({ ...p, dimH: parseFloat(e.target.value) || 0 }))}
                        placeholder="10"
                        className="w-full pl-7 pr-2 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm text-slate-800"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    CBM: {fmtNum(currentCalc.cbm, 6)} m³ | Flete calcula por {currentCalc.fleteDetalle} (más caro)
                  </p>
                </div>

                {/* Quantity + Margin */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Cantidad (unidades)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={productForm.cantidad || ''}
                      onChange={(e) => setProductForm((p) => ({ ...p, cantidad: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Margen deseado (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        step="1"
                        value={productForm.margen || ''}
                        onChange={(e) => setProductForm((p) => ({ ...p, margen: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm text-slate-800"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Método de Pago</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setProductForm((p) => ({ ...p, metodoPago: 'banco' }))}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        productForm.metodoPago === 'banco'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      Banco BCV
                    </button>
                    <button
                      onClick={() => setProductForm((p) => ({ ...p, metodoPago: 'usdt' }))}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        productForm.metodoPago === 'usdt'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      USDT → Zinli
                    </button>
                  </div>
                  {productForm.metodoPago === 'usdt' && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 space-y-0.5">
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
                  className="w-full py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar a lista de productos
                </button>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-4 sm:px-5 pt-5 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-500" />
                      Desglose Profesional
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {productForm.metodoPago === 'banco' ? 'Banco BCV' : 'USDT → Zinli'} | {productForm.nombre || 'Producto sin nombre'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReceipt(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Recibo
                  </button>
                </div>
                <div className="px-4 sm:px-5 pb-5 space-y-1 text-xs max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {/* ── COSTO DE ORIGEN ── */}
                  <div className="pt-2 pb-1 border-b border-slate-200 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Costo de Origen</span>
                  </div>
                  <BR label="1. Costo producto base (1688/Alibaba)" value={fmtUSD(currentCalc.costoProductoBase)} />
                  <BR label={`2. (+) IVA China (${config.ivaChina}%)`} value={fmtUSD(currentCalc.ivaChina)} type="cost" />
                  <BR label="3. (=) Costo Origen China" value={fmtUSD(currentCalc.costoOrigenChina)} type="sub" />

                  {/* ── LOGÍSTICA ── */}
                  <div className="pt-2 pb-1 border-b border-slate-200 mb-2 mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logística Internacional</span>
                  </div>
                  <BR label={`4. (+) Flete internacional (${currentCalc.fleteDetalle})`} value={fmtUSD(currentCalc.fleteInternacional)} type="cost" />
                  <BR label={`5. (+) Seguro de carga (${config.seguroCarga}%)`} value={fmtUSD(currentCalc.seguroCarga)} type="cost" />
                  <BR label={`6. (+) Manejo Import2Ven (${productForm.pesoKg} kg × $${config.courierImport2Ven})`} value={fmtUSD(currentCalc.courierImport2Ven)} type="cost" />
                  <BR label="7. ═══ COSTO FOB TOTAL" value={fmtUSD(currentCalc.costoFOBTotal)} type="total" />

                  {/* ── CAMBIO ── */}
                  <div className="pt-2 pb-1 border-b border-slate-200 mb-2 mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversión Cambiaria</span>
                  </div>
                  {productForm.metodoPago === 'usdt' && (
                    <div className="py-1 px-2 rounded bg-amber-50 -mx-1 mb-1">
                      <div className="flex justify-between text-amber-700">
                        <span>Tasa Efectiva P2P (REAL)</span>
                        <span className="font-bold">{fmtBs(currentCalc.tasaEfectivaP2P)} Bs/$</span>
                      </div>
                      <div className="text-[10px] text-amber-500 mt-0.5">Incluye spread + comisiones USDT→Zinli + Zinli recarga</div>
                    </div>
                  )}
                  <BR label={`8. (×) Tasa ${productForm.metodoPago === 'usdt' ? 'Efectiva P2P' : 'Banco BCV'}`} value={`${fmtBs(currentCalc.tasaEfectivaP2P)} Bs/$`} type="rate" />
                  <BR label="9. (=) Costo convertido Bs" value={fmtBs(currentCalc.costoConvertidoBs) + ' Bs'} type="sub" />

                  {/* ── ATERRIZAJE ── */}
                  <div className="pt-2 pb-1 border-b border-slate-200 mb-2 mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aterrizaje Nacional</span>
                  </div>
                  <BR label={`10. (+) Courier nacional ($${config.courierNacional} × tasa)`} value={fmtBs(currentCalc.courierNacionalBs) + ' Bs'} type="cost" />
                  <BR label="11. ═══ COSTO ATERRIZAJE Bs" value={fmtBs(currentCalc.costoAterrizajeBs) + ' Bs'} type="total" />

                  {/* ── OPEX ── */}
                  <div className="pt-2 pb-1 border-b border-slate-200 mb-2 mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gastos Operativos OPEX</span>
                  </div>
                  <BR label="12. (+) OPEX por unidad" value={fmtUSD(currentCalc.opexTotalUSD)} type="sub" />
                  <div className="pl-4 space-y-0.5 my-1">
                    <OR label={`• Internet (Galanet)`} value={fmtUSD(config.opexInternet)} />
                    <OR label={`• Publicidad redes`} value={fmtUSD(config.opexPublicidad)} />
                    <OR label={`• Empaques`} value={fmtUSD(config.opexEmpaques)} />
                    <OR label={`• Delivery local`} value={fmtUSD(config.opexDelivery)} />
                  </div>
                  <BR label="13. ═══ COSTO TOTAL OPERATIVO Bs" value={fmtBs(currentCalc.costoTotalOperativoBs) + ' Bs'} type="total" />

                  {/* ── RIESGO ── */}
                  <div className="pt-2 pb-1 border-b border-slate-200 mb-2 mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Factor de Riesgo</span>
                  </div>
                  <BR label={`14. (+) Factor merma (${config.merma}%)`} value={fmtBs(currentCalc.costoRealPorUnidadBs - currentCalc.costoTotalOperativoBs) + ' Bs'} type="cost" />
                  <div className="text-[10px] text-slate-400 px-2 py-0.5">
                    {productForm.cantidad} und × (1 - {config.merma}%) = {(productForm.cantidad * (1 - config.merma / 100)).toFixed(1)} und vendibles reales
                  </div>

                  {/* ── COSTO REAL ── */}
                  <div className="mt-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg p-3 border border-teal-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-teal-800">15. ═══ COSTO REAL POR UNIDAD Bs</span>
                      <span className="text-lg font-bold text-teal-700">{fmtBs(currentCalc.costoRealPorUnidadBs)} Bs</span>
                    </div>
                  </div>

                  {/* ── PRECIO DE VENTA ── */}
                  <div className="mt-4 pt-3 border-t-2 border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">━━━━ PRECIO DE VENTA ━━━━</div>
                    <BR label="16. Punto de equilibrio" value={fmtBs(currentCalc.puntoEquilibrio) + ' Bs'} type="base" />
                    <BR label={`17. (+) Margen deseado (${productForm.margen}%)`} value={fmtBs(currentCalc.precioVentaBs - currentCalc.puntoEquilibrio) + ' Bs'} type="cost" />
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-200 mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-emerald-800">18. ═══ PRECIO DE VENTA REC. Bs</span>
                        <span className="text-lg font-bold text-emerald-700">{fmtBs(currentCalc.precioVentaBs)} Bs</span>
                      </div>
                    </div>
                    <BR label="19. En USD (BCV)" value={fmtUSD(currentCalc.precioVentaUSD)} type="sub" />
                    <BR label="20. Ganancia real por unidad" value={`${fmtBs(currentCalc.gananciaUnitBs)} Bs / ${fmtUSD(currentCalc.gananciaUnitUSD)}`} type={currentCalc.gananciaUnitBs >= 0 ? 'profit' : 'loss'} />
                    <div className={`flex items-center gap-2 p-2.5 rounded-lg border mt-2 ${
                      currentCalc.cubreBrecha
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      {currentCalc.cubreBrecha ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      <span className="text-xs font-medium">
                        21. ¿Cubre brecha cambiaria?{' '}
                        <strong>{currentCalc.cubreBrecha ? 'SÍ' : 'NO'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* ── TASA EFECTIVA FOOTER ── */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-800 text-white">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-0.5">Tasa Efectiva Real</div>
                    <div className="text-sm font-bold">
                      {fmtBs(currentCalc.tasaEfectivaP2P)} Bs/$
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm fade-in">
            <div className="px-4 sm:px-5 pt-5 pb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-500" />
                Lista de Productos ({products.length})
              </h3>
            </div>
            {products.length === 0 ? (
              <div className="px-5 pb-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <Package className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm">No hay productos agregados</p>
                <p className="text-slate-300 text-xs mt-1">Ve a la calculadora y agrega productos</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs">
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
                  <tbody className="divide-y divide-slate-100">
                    {productResults.map(({ product: p, calc }) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 max-w-[150px] truncate">{p.nombre}</div>
                          <div className="text-xs text-slate-400">{p.cantidad} und × {p.pesoKg}kg | {p.margen}% margen</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.metodoPago === 'banco'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {p.metodoPago === 'banco' ? 'Banco' : 'USDT'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-700">{fmtUSD(calc.costoFOBTotal)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-800">{fmtBs(calc.costoRealPorUnidadBs)} Bs</td>
                        <td className="px-3 py-3 text-right font-semibold text-teal-700">{fmtBs(calc.precioVentaBs)} Bs</td>
                        <td className="px-3 py-3 text-right">
                          <span className={calc.gananciaUnitBs >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                            {fmtBs(calc.gananciaUnitBs)} Bs
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {calc.cubreBrecha ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                          )}
                        </td>
                        <td className="px-3 py-3 no-print">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => selectProductForSale(p)}
                              className="p-1.5 rounded-lg text-teal-500 hover:bg-teal-50 transition-colors"
                              title="Registrar venta"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => duplicateProduct(p.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                              title="Duplicar"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeProduct(p.id)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
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
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-teal-500" />
                Registro de Ventas ({sales.length})
              </h3>
              <button
                onClick={() => {
                  setSaleForm({ fecha: todayStr(), productoId: '', productoNombre: '', costoUnitBs: 0, precioVentaBs: 0, cantidad: 1 });
                  setShowSalesModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Registrar Venta
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              {sales.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-3">
                    <ShoppingCart className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm">No hay ventas registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs">
                        <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                        <th className="text-left px-3 py-3 font-semibold">Producto</th>
                        <th className="text-right px-3 py-3 font-semibold">Costo Unit</th>
                        <th className="text-right px-3 py-3 font-semibold">Precio Venta</th>
                        <th className="text-center px-3 py-3 font-semibold">Cant.</th>
                        <th className="text-right px-3 py-3 font-semibold">Ganancia</th>
                        <th className="text-center px-3 py-3 font-semibold no-print"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sales.map((sale) => {
                        const ganancia = (sale.precioVentaBs - sale.costoUnitBs) * sale.cantidad;
                        return (
                          <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 text-slate-500 text-xs">{sale.fecha}</td>
                            <td className="px-3 py-3 font-medium text-slate-800 max-w-[150px] truncate">{sale.productoNombre}</td>
                            <td className="px-3 py-3 text-right text-slate-500">{fmtBs(sale.costoUnitBs)} Bs</td>
                            <td className="px-3 py-3 text-right text-slate-700">{fmtBs(sale.precioVentaBs)} Bs</td>
                            <td className="px-3 py-3 text-center text-slate-600">{sale.cantidad}</td>
                            <td className={`px-3 py-3 text-right font-semibold ${ganancia >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {fmtBs(ganancia)} Bs
                            </td>
                            <td className="px-3 py-3 no-print">
                              <button
                                onClick={() => removeSale(sale.id)}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
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

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-teal-500" />
                Análisis de Productos
              </h3>
              {productResults.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No hay productos para analizar</p>
              ) : (
                <div className="space-y-3">
                  {productResults.map(({ product: p, calc }) => (
                    <div key={p.id} className="border border-slate-100 rounded-lg p-3 hover:border-slate-200 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-slate-800 text-sm">{p.nombre}</div>
                          <div className="text-xs text-slate-400">{p.cantidad} und | {p.metodoPago === 'banco' ? 'Banco' : 'USDT'} | Tasa Ef: {fmtBs(calc.tasaEfectivaP2P)} Bs/$</div>
                        </div>
                        {calc.cubreBrecha ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                        <div><span className="text-slate-400">Costo Real: </span><span className="font-medium text-slate-700">{fmtBs(calc.costoRealPorUnidadBs)} Bs</span></div>
                        <div><span className="text-slate-400">Venta: </span><span className="font-medium text-teal-700">{fmtBs(calc.precioVentaBs)} Bs</span></div>
                        <div><span className="text-slate-400">Ganancia: </span><span className={`font-medium ${calc.gananciaUnitBs >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtBs(calc.gananciaUnitBs)} Bs</span></div>
                        <div><span className="text-slate-400">USD: </span><span className="font-medium">{fmtUSD(calc.precioVentaUSD)}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-teal-500" />
                Resumen Rápido
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-800">{products.length}</div>
                  <div className="text-xs text-slate-500 mt-1">Productos</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-800">{sales.length}</div>
                  <div className="text-xs text-slate-500 mt-1">Ventas</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">{productResults.filter((r) => r.calc.cubreBrecha).length}</div>
                  <div className="text-xs text-slate-500 mt-1">Cubren Brecha</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-500">{productResults.filter((r) => !r.calc.cubreBrecha).length}</div>
                  <div className="text-xs text-slate-500 mt-1">No Cubren</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════════ */}
      <footer className="mt-auto border-t border-slate-200 bg-white no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            ImportCalc VE — Calculadora Profesional de Importación Venezuela
          </p>
          <p className="text-xs text-slate-300">
            Datos guardados localmente en tu navegador
          </p>
        </div>
      </footer>

      {/* ═══ SALE MODAL ══════════════════════════════════════════════════ */}
      {showSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSalesModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md fade-in">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">Registrar Venta</h2>
                <button onClick={() => setShowSalesModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Producto</label>
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
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm text-slate-800 cursor-pointer"
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Fecha</label>
                    <input
                      type="date"
                      value={saleForm.fecha}
                      onChange={(e) => setSaleForm((s) => ({ ...s, fecha: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={saleForm.cantidad || ''}
                      onChange={(e) => setSaleForm((s) => ({ ...s, cantidad: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm text-slate-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Costo Unit (Bs)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={saleForm.costoUnitBs || ''}
                      onChange={(e) => setSaleForm((s) => ({ ...s, costoUnitBs: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Precio Venta (Bs)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={saleForm.precioVentaBs || ''}
                      onChange={(e) => setSaleForm((s) => ({ ...s, precioVentaBs: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm text-slate-800"
                    />
                  </div>
                </div>
                {saleForm.precioVentaBs > 0 && saleForm.costoUnitBs > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Ganancia por unidad:</span>
                      <span className={saleForm.precioVentaBs - saleForm.costoUnitBs >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                        {fmtBs(saleForm.precioVentaBs - saleForm.costoUnitBs)} Bs
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Ganancia total:</span>
                      <span className={(saleForm.precioVentaBs - saleForm.costoUnitBs) * saleForm.cantidad >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                        {fmtBs((saleForm.precioVentaBs - saleForm.costoUnitBs) * saleForm.cantidad)} Bs
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={addSale}
                  disabled={!saleForm.productoId || saleForm.precioVentaBs <= 0 || saleForm.cantidad <= 0}
                  className="w-full py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
        <div className="text-slate-500">{icon}</div>
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
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
    blue: 'border-blue-200 focus-within:border-blue-400 focus-within:ring-blue-100',
    green: 'border-green-200 focus-within:border-green-400 focus-within:ring-green-100',
    teal: 'border-teal-200 focus-within:border-teal-400 focus-within:ring-teal-100',
    orange: 'border-orange-200 focus-within:border-orange-400 focus-within:ring-orange-100',
    purple: 'border-purple-200 focus-within:border-purple-400 focus-within:ring-purple-100',
    red: 'border-red-200 focus-within:border-red-400 focus-within:ring-red-100',
  };
  const iMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    teal: 'bg-teal-100 text-teal-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };
  return (
    <div className={`rounded-lg border p-3 transition-all focus-within:ring-2 ${cMap[color] || cMap.teal}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded flex items-center justify-center ${iMap[color] || iMap.teal}`}>{icon}</div>
        <div>
          <div className="text-xs font-medium text-slate-700 leading-tight">{label}</div>
          <div className="text-[10px] text-slate-400 leading-tight">{sub}</div>
        </div>
      </div>
      <div className="relative">
        {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>}
        <input
          type="number"
          min="0"
          step="0.01"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`w-full ${prefix ? 'pl-7' : 'pl-2.5'} ${suffix ? 'pr-7' : 'pr-2.5'} py-2 rounded-md border border-slate-200 bg-white focus:outline-none text-sm text-slate-800 font-medium`}
        />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{suffix}</span>}
      </div>
    </div>
  );
}

function BR({ label, value, type = 'base' }: { label: string; value: string; type?: 'base' | 'cost' | 'sub' | 'total' | 'rate' | 'profit' | 'loss' }) {
  const styles: Record<string, string> = {
    base: 'text-slate-500',
    cost: 'text-slate-600 bg-slate-50/50 -mx-2 px-2 rounded',
    sub: 'font-semibold text-slate-800',
    total: 'font-bold text-slate-900 border-t border-slate-200 pt-2 mt-1',
    rate: 'text-amber-700 font-semibold bg-amber-50 -mx-2 px-2 rounded',
    profit: 'text-emerald-600 font-semibold',
    loss: 'text-red-500 font-semibold',
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
      <span className="text-[11px] text-slate-400">{label}</span>
      <span className="text-[11px] text-slate-500">{value}</span>
    </div>
  );
}

function DashCard({
  title, value, sublabel, icon, color,
}: {
  title: string; value: string; sublabel: string; icon: React.ReactNode; color: string;
}) {
  const iMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    teal: 'bg-teal-100 text-teal-600',
    green: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iMap[color] || iMap.teal}`}>{icon}</div>
      </div>
      <div className="text-xs text-slate-500 font-medium mb-1">{title}</div>
      <div className="text-lg sm:text-xl font-bold text-slate-800 leading-tight">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{sublabel}</div>
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
      <html><head><title>Recibo ImportCalc VE</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; color: #1a2332; }
        .receipt { border: 2px dashed #94a3b8; border-radius: 12px; padding: 24px; max-width: 400px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
        .header h1 { font-size: 18px; font-weight: 800; color: #0f172a; }
        .header p { font-size: 11px; color: #64748b; }
        .product-name { font-size: 14px; font-weight: 700; text-align: center; margin-bottom: 12px; color: #0f172a; }
        .section-title { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 12px 0 6px; }
        .row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; font-size: 12px; }
        .row .label { color: #475569; }
        .row .value { font-weight: 600; color: #1e293b; }
        .row.total { font-size: 13px; font-weight: 800; color: #0f172a; border-top: 2px solid #0d9488; padding-top: 6px; margin-top: 4px; }
        .row.grand-total { font-size: 16px; font-weight: 800; color: #0d9488; background: #f0fdfa; padding: 8px; border-radius: 8px; margin-top: 8px; }
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto fade-in">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Recibo Profesional</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Receipt Content */}
          <div ref={receiptRef} className="receipt-box border-2 border-dashed border-slate-300 rounded-xl p-5 bg-white">
            {/* Header */}
            <div className="text-center border-b-2 border-slate-200 pb-3 mb-4">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">ImportCalc VE</h1>
              <p className="text-[10px] text-slate-400 mt-0.5">Calculadora Profesional de Importación</p>
              <p className="text-[10px] text-slate-300">{todayStr()}</p>
            </div>

            <div className="text-center font-bold text-sm text-slate-800 mb-3">
              {product.nombre || 'Producto sin nombre'}
            </div>

            {/* Origin Cost */}
            <div className="section-title">Costo de Origen</div>
            <RRow label="Precio producto base" value={fmtUSD(calc.costoProductoBase)} />
            <RRow label={`(+) IVA China (${config.ivaChina}%)`} value={fmtUSD(calc.ivaChina)} />
            <RRow label="Costo Origen China" value={fmtUSD(calc.costoOrigenChina)} bold />

            {/* Logistics */}
            <div className="section-title">Logística Internacional</div>
            <RRow label={`Flete (${calc.fleteDetalle})`} value={fmtUSD(calc.fleteInternacional)} />
            <RRow label={`Seguro (${config.seguroCarga}%)`} value={fmtUSD(calc.seguroCarga)} />
            <RRow label={`Import2Ven (${product.pesoKg}kg)`} value={fmtUSD(calc.courierImport2Ven)} />
            <RRow label="COSTO FOB TOTAL" value={fmtUSD(calc.costoFOBTotal)} bold total />

            {/* Exchange */}
            <div className="section-title">Conversión</div>
            <RRow label={`Tasa ${product.metodoPago === 'usdt' ? 'Efectiva P2P' : 'Banco'}`} value={`${fmtBs(calc.tasaEfectivaP2P)} Bs/$`} />
            <RRow label="Costo convertido" value={fmtBs(calc.costoConvertidoBs) + ' Bs'} bold />
            <RRow label="Courier nacional" value={fmtBs(calc.courierNacionalBs) + ' Bs'} />
            <RRow label="COSTO ATERRIZAJE" value={fmtBs(calc.costoAterrizajeBs) + ' Bs'} bold total />

            {/* OPEX */}
            <div className="section-title">OPEX</div>
            <RRow label="Internet" value={fmtUSD(config.opexInternet)} />
            <RRow label="Publicidad" value={fmtUSD(config.opexPublicidad)} />
            <RRow label="Empaques" value={fmtUSD(config.opexEmpaques)} />
            <RRow label="Delivery" value={fmtUSD(config.opexDelivery)} />
            <RRow label="OPEX Total" value={fmtUSD(calc.opexTotalUSD)} bold />
            <RRow label="COSTO OPERATIVO" value={fmtBs(calc.costoTotalOperativoBs) + ' Bs'} bold total />

            {/* Risk */}
            <div className="section-title">Riesgo</div>
            <RRow label={`Merma (${config.merma}%)`} value={`${fmtBs(calc.costoRealPorUnidadBs - calc.costoTotalOperativoBs)} Bs`} />
            <div className="text-[10px] text-slate-400 mb-2">
              {(product.cantidad * (1 - config.merma / 100)).toFixed(1)} und vendibles de {product.cantidad}
            </div>

            {/* GRAND TOTAL */}
            <div className="flex justify-between items-center bg-teal-50 border border-teal-200 rounded-lg p-3 mt-2">
              <span className="text-sm font-extrabold text-teal-800">COSTO REAL / UNIDAD</span>
              <span className="text-xl font-extrabold text-teal-700">{fmtBs(calc.costoRealPorUnidadBs)} Bs</span>
            </div>

            {/* Sale Price */}
            <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-lg p-3 mt-3">
              <span className="text-sm font-extrabold text-emerald-800">PRECIO VENTA ({product.margen}%)</span>
              <span className="text-xl font-extrabold text-emerald-700">{fmtBs(calc.precioVentaBs)} Bs</span>
            </div>

            <div className="flex justify-between items-center mt-2 text-xs">
              <span className="text-slate-400">En USD (BCV):</span>
              <span className="font-bold text-slate-700">{fmtUSD(calc.precioVentaUSD)}</span>
            </div>
            <div className="flex justify-between items-center mt-1 text-xs">
              <span className="text-slate-400">Ganancia/Unidad:</span>
              <span className={`font-bold ${calc.gananciaUnitBs >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtBs(calc.gananciaUnitBs)} Bs</span>
            </div>

            {/* Brecha */}
            <div className={`flex items-center gap-2 p-2.5 rounded-lg border mt-3 text-xs font-semibold ${calc.cubreBrecha ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {calc.cubreBrecha ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              ¿Cubre brecha cambiaria? <strong>{calc.cubreBrecha ? 'SÍ' : 'NO'}</strong>
            </div>

            {/* Tasa efectiva */}
            <div className="bg-slate-800 text-white rounded-lg p-3 text-center mt-3">
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">Tasa Efectiva Real</div>
              <div className="text-lg font-extrabold mt-0.5">{fmtBs(calc.tasaEfectivaP2P)} Bs/$</div>
            </div>

            {/* Footer */}
            <div className="text-center mt-4 pt-3 border-t border-dashed border-slate-200">
              <p className="text-[9px] text-slate-400">ImportCalc VE — Recibo de análisis de importación</p>
              <p className="text-[9px] text-slate-300">Documento de referencia, no factura oficial</p>
            </div>
          </div>

          {/* Print button */}
          <button
            onClick={handlePrintReceipt}
            className="w-full mt-4 py-2.5 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir Recibo
          </button>
        </div>
      </div>
    </div>
  );
}

function RRow({ label, value, bold = false, total = false }: { label: string; value: string; bold?: boolean; total?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-1 text-xs ${total ? 'border-t border-slate-200 pt-2 mt-1' : ''}`}>
      <span className={bold ? 'font-semibold text-slate-700' : 'text-slate-500'}>{label}</span>
      <span className={bold ? 'font-bold text-slate-800' : 'text-slate-600 font-medium'}>{value}</span>
    </div>
  );
}
