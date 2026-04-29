'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
interface Config {
  tasaBanco: number;
  tasaUSDT: number;
  tasaVentaBCV: number;
  comisionZinli: number;
  comisionUSDTZinli: number;
  courierIntl: number;
  courierNacional: number;
  impuesto: number;
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
  costoProductoUSD: number;
  courierIntlUSD: number;
  impuestosUSD: number;
  costoTotalUSD: number;
  tasaAplicada: number;
  costoTotalBs: number;
  comisionZinliBs: number;
  courierNacionalBs: number;
  costoRealTotalBs: number;
  precioVentaBs: number;
  precioVentaUSD: number;
  gananciaUnitBs: number;
  gananciaUnitUSD: number;
  cubreBrecha: boolean;
  costoPorUnidadBs: number;
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
  comisionZinli: 3.5,
  comisionUSDTZinli: 3,
  courierIntl: 0,
  courierNacional: 0,
  impuesto: 0,
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
  const cantidad = product.cantidad || 1;
  const costoProductoUSD = product.costoUSD;
  const courierIntlUSD = config.courierIntl * product.pesoKg;
  const impuestosUSD = costoProductoUSD * (config.impuesto / 100);
  const costoTotalUSD = costoProductoUSD + courierIntlUSD + impuestosUSD;

  const tasaAplicada = product.metodoPago === 'banco' ? config.tasaBanco : config.tasaUSDT;
  const costoTotalBs = costoTotalUSD * tasaAplicada;

  let comisionZinliBs = 0;
  if (product.metodoPago === 'usdt') {
    const costoUSDT = costoTotalUSD * config.tasaUSDT;
    comisionZinliBs = costoUSDT * (config.comisionUSDTZinli / 100);
    comisionZinliBs += costoUSDT * (config.comisionZinli / 100);
  }

  const courierNacionalBs = config.courierNacional * tasaAplicada;
  const costoRealTotalBs = costoTotalBs + comisionZinliBs + courierNacionalBs;
  const costoPorUnidadBs = costoRealTotalBs / cantidad;

  const margen = product.margen / 100;
  const precioVentaBs = costoPorUnidadBs / (1 - margen);
  const precioVentaUSD = precioVentaBs / config.tasaVentaBCV;
  const gananciaUnitBs = precioVentaBs - costoPorUnidadBs;
  const gananciaUnitUSD = gananciaUnitBs / config.tasaVentaBCV;

  const costoVentaBCV = costoPorUnidadBs / config.tasaVentaBCV;
  const cubreBrecha = gananciaUnitUSD > 0 && precioVentaUSD > costoVentaBCV;

  return {
    costoProductoUSD,
    courierIntlUSD,
    impuestosUSD,
    costoTotalUSD,
    tasaAplicada,
    costoTotalBs,
    comisionZinliBs,
    courierNacionalBs,
    costoRealTotalBs,
    precioVentaBs,
    precioVentaUSD,
    gananciaUnitBs,
    gananciaUnitUSD,
    cubreBrecha,
    costoPorUnidadBs,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function Home() {
  const [config, setConfig] = useState<Config>(() => {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    try {
      const saved = localStorage.getItem('importcalc_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  });
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('importcalc_products');
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
  const [saleForm, setSaleForm] = useState<Omit<Sale, 'id'>>({
    fecha: todayStr(),
    productoId: '',
    productoNombre: '',
    costoUnitBs: 0,
    precioVentaBs: 0,
    cantidad: 1,
  });

  // ─── Product form state ───────────────────────────────────────────────
  const [productForm, setProductForm] = useState<Product>({
    id: '',
    nombre: '',
    costoUSD: 0,
    pesoKg: 0.5,
    cantidad: 1,
    metodoPago: 'banco',
    margen: 40,
  });

  // ─── Save to localStorage ────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem('importcalc_config', JSON.stringify(config)); } catch { /* */ }
  }, [config]);

  useEffect(() => {
    try { localStorage.setItem('importcalc_products', JSON.stringify(products)); } catch { /* */ }
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
    const totalInvertidoUSD = products.reduce((s, p) => s + calculateProduct(p, config).costoTotalUSD * p.cantidad, 0);
    const totalIngresosBs = sales.reduce((s, sale) => s + sale.precioVentaBs * sale.cantidad, 0);
    const totalIngresosUSD = totalIngresosBs / config.tasaVentaBCV;
    const totalCostoBs = sales.reduce((s, sale) => s + sale.costoUnitBs * sale.cantidad, 0);
    const totalCostoUSD = totalCostoBs / config.tasaVentaBCV;
    const gananciaNetaUSD = totalIngresosUSD - totalCostoUSD;
    const margenReal = totalIngresosBs > 0 ? ((totalIngresosBs - totalCostoBs) / totalIngresosBs) * 100 : 0;
    const brecha = config.tasaBanco > 0
      ? ((config.tasaBanco - config.tasaVentaBCV) / config.tasaVentaBCV) * 100
      : 0;
    return { totalInvertidoUSD, totalIngresosBs, totalIngresosUSD, gananciaNetaUSD, margenReal, brecha, totalCostoBs };
  }, [products, sales, config]);

  // ─── Config handlers ─────────────────────────────────────────────────
  const updateConfig = useCallback((key: keyof Config, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ─── Product handlers ────────────────────────────────────────────────
  function resetProductForm() {
    setProductForm({
      id: '',
      nombre: '',
      costoUSD: 0,
      pesoKg: 0.5,
      cantidad: 1,
      metodoPago: 'banco',
      margen: 40,
    });
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
      costoUnitBs: calc.costoPorUnidadBs,
      precioVentaBs: calc.precioVentaBs,
      cantidad: 1,
    });
    setShowSalesModal(true);
  }

  // ─── Print ───────────────────────────────────────────────────────────
  function handlePrint() {
    window.print();
  }

  // ─── Format helper for currency display ──────────────────────────────
  function fmtMoney(bsVal: number, usdVal: number): string {
    if (currency === 'Bs') return fmtBs(bsVal) + ' Bs';
    return fmtUSD(usdVal);
  }

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
              <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold leading-tight tracking-tight">ImportCalc VE</h1>
                <p className="text-[10px] sm:text-xs text-slate-400 leading-tight">Calculadora de Costos de Importación</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                <h2 className="font-semibold text-slate-800 text-sm sm:text-base">Configuración de Tasas y Costos</h2>
                <p className="text-xs text-slate-400 hidden sm:block">Ajusta las tasas de cambio y costos operativos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">
                Banco: {fmtBs(config.tasaBanco)} Bs/$ | USDT: {fmtBs(config.tasaUSDT)} Bs/$ | BCV: {fmtBs(config.tasaVentaBCV)} Bs/$
              </span>
              {configOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>

          {configOpen && (
            <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <ConfigField
                  label="Tasa Dólar Banco"
                  sublabel="BCV oficial"
                  value={config.tasaBanco}
                  onChange={(v) => updateConfig('tasaBanco', v)}
                  icon={<Banknote className="w-3.5 h-3.5" />}
                  color="blue"
                />
                <ConfigField
                  label="Tasa USDT"
                  sublabel="compra"
                  value={config.tasaUSDT}
                  onChange={(v) => updateConfig('tasaUSDT', v)}
                  icon={<Globe className="w-3.5 h-3.5" />}
                  color="green"
                />
                <ConfigField
                  label="Tasa Venta BCV"
                  sublabel="precio al público"
                  value={config.tasaVentaBCV}
                  onChange={(v) => updateConfig('tasaVentaBCV', v)}
                  icon={<DollarSign className="w-3.5 h-3.5" />}
                  color="teal"
                />
                <ConfigField
                  label="Com. USDT→Zinli"
                  sublabel="pérdida conversión"
                  value={config.comisionUSDTZinli}
                  onChange={(v) => updateConfig('comisionUSDTZinli', v)}
                  icon={<Percent className="w-3.5 h-3.5" />}
                  color="orange"
                  suffix="%"
                />
                <ConfigField
                  label="Com. Zinli recarga"
                  sublabel="fee recarga"
                  value={config.comisionZinli}
                  onChange={(v) => updateConfig('comisionZinli', v)}
                  icon={<Percent className="w-3.5 h-3.5" />}
                  color="orange"
                  suffix="%"
                />
                <ConfigField
                  label="Courier Intl"
                  sublabel="USD/kg"
                  value={config.courierIntl}
                  onChange={(v) => updateConfig('courierIntl', v)}
                  icon={<Truck className="w-3.5 h-3.5" />}
                  color="purple"
                  prefix="$"
                />
                <ConfigField
                  label="Courier Nacional"
                  sublabel="USD/paquete"
                  value={config.courierNacional}
                  onChange={(v) => updateConfig('courierNacional', v)}
                  icon={<Truck className="w-3.5 h-3.5" />}
                  color="purple"
                  prefix="$"
                />
                <ConfigField
                  label="Impuesto/Arancel"
                  sublabel="del producto"
                  value={config.impuesto}
                  onChange={(v) => updateConfig('impuesto', v)}
                  icon={<Percent className="w-3.5 h-3.5" />}
                  color="red"
                  suffix="%"
                />
              </div>
              {/* Exchange gap indicator */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Brecha cambiaria:</span>
                  <span className="font-semibold text-red-500">
                    {fmtPct(((config.tasaBanco - config.tasaVentaBCV) / config.tasaVentaBCV) * 100)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Gap USDT vs Banco:</span>
                  <span className="font-semibold text-amber-500">
                    +{fmtPct(((config.tasaUSDT - config.tasaBanco) / config.tasaBanco) * 100)}
                  </span>
                </div>
                <button
                  onClick={() => setConfig(DEFAULT_CONFIG)}
                  className="ml-auto text-slate-400 hover:text-slate-600 underline transition-colors"
                >
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
                    <label className="block text-xs font-medium text-slate-500 mb-1">Costo (USD)</label>
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
                      Tarjeta Banco
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
                    <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Incluye {fmtPct(config.comisionUSDTZinli)} comisión USDT→Zinli + {fmtPct(config.comisionZinli)} recarga Zinli
                    </p>
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
                <div className="px-4 sm:px-5 pt-5 pb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-500" />
                    Desglose de Costos
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {productForm.metodoPago === 'banco' ? 'Tarjeta de Banco' : 'USDT → Zinli'} | Tasa: {fmtBs(productForm.metodoPago === 'banco' ? config.tasaBanco : config.tasaUSDT)} Bs/$
                  </p>
                </div>
                <div className="px-4 sm:px-5 pb-5 space-y-2.5">
                  <CostRow label="1. Costo producto base" value={fmtUSD(currentCalc.costoProductoUSD)} type="base" />
                  <CostRow label={`2. (+) Courier internacional (${productForm.pesoKg} kg)`} value={fmtUSD(currentCalc.courierIntlUSD)} type="cost" />
                  <CostRow label={`3. (+) Impuestos (${config.impuesto}%)`} value={fmtUSD(currentCalc.impuestosUSD)} type="cost" />
                  <div className="border-t border-slate-100 pt-2">
                    <CostRow label="4. (=) Costo Total USD (FOB)" value={fmtUSD(currentCalc.costoTotalUSD)} type="subtotal" />
                  </div>
                  <CostRow label={`5. (×) Tasa de cambio aplicada`} value={`${fmtBs(currentCalc.tasaAplicada)} Bs/$`} type="rate" />
                  <CostRow label="6. (=) Costo total en Bs" value={fmtBs(currentCalc.costoTotalBs) + ' Bs'} type="subtotal" />
                  {productForm.metodoPago === 'usdt' && currentCalc.comisionZinliBs > 0 && (
                    <CostRow label="7. (+) Comisión USDT→Zinli + Zinli recarga" value={fmtBs(currentCalc.comisionZinliBs) + ' Bs'} type="cost" />
                  )}
                  <CostRow label={`${productForm.metodoPago === 'usdt' ? '8' : '7'}. (+) Courier nacional`} value={fmtBs(currentCalc.courierNacionalBs) + ' Bs'} type="cost" />

                  {/* TOTAL */}
                  <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg p-3 border border-teal-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-teal-800">
                        COSTO REAL TOTAL {productForm.cantidad > 1 ? `(×${productForm.cantidad} und)` : ''}
                      </span>
                      <span className="text-lg font-bold text-teal-700">
                        {fmtBs(currentCalc.costoRealTotalBs)} Bs
                      </span>
                    </div>
                    {productForm.cantidad > 1 && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-teal-600">Costo por unidad</span>
                        <span className="text-sm font-semibold text-teal-600">{fmtBs(currentCalc.costoPorUnidadBs)} Bs</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-4 sm:px-5 pt-5 pb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-500" />
                    Precio de Venta Sugerido
                  </h3>
                </div>
                <div className="px-4 sm:px-5 pb-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ResultCard label="Precio Venta" value={fmtBs(currentCalc.precioVentaBs) + ' Bs'} sublabel={fmtUSD(currentCalc.precioVentaUSD)} positive />
                    <ResultCard label="Ganancia/Und" value={fmtBs(currentCalc.gananciaUnitBs) + ' Bs'} sublabel={fmtUSD(currentCalc.gananciaUnitUSD)} positive={currentCalc.gananciaUnitBs >= 0} />
                  </div>

                  {/* Brecha indicator */}
                  <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                    currentCalc.cubreBrecha
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {currentCalc.cubreBrecha ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    )}
                    <div className="text-sm">
                      <span className="font-semibold">
                        {currentCalc.cubreBrecha ? 'SÍ' : 'NO'}
                      </span>
                      {' '}— {currentCalc.cubreBrecha
                        ? 'El margen cubre la brecha cambiaria'
                        : 'El margen NO cubre la brecha cambiaria. Necesitas un margen mayor.'
                      }
                    </div>
                  </div>

                  {/* Cost breakdown bar */}
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">Distribución del costo (USD)</div>
                    <CostBar calc={currentCalc} />
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
                      <th className="text-right px-3 py-3 font-semibold">Costo USD</th>
                      <th className="text-right px-3 py-3 font-semibold">Courier Intl</th>
                      <th className="text-right px-3 py-3 font-semibold">Total USD</th>
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
                        <td className="px-3 py-3 text-right text-slate-700">{fmtUSD(calc.costoProductoUSD)}</td>
                        <td className="px-3 py-3 text-right text-slate-500">{fmtUSD(calc.courierIntlUSD)}</td>
                        <td className="px-3 py-3 text-right font-medium text-slate-700">{fmtUSD(calc.costoTotalUSD)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-800">{fmtBs(calc.costoPorUnidadBs)} Bs</td>
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
            {/* Add Sale Button */}
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

            {/* Sales Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              {sales.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-3">
                    <ShoppingCart className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm">No hay ventas registradas</p>
                  <p className="text-slate-300 text-xs mt-1">Agrega productos y registra tus ventas</p>
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
                        <th className="text-right px-3 py-3 font-semibold">Total Costo</th>
                        <th className="text-right px-3 py-3 font-semibold">Total Ingreso</th>
                        <th className="text-right px-3 py-3 font-semibold">Ganancia</th>
                        <th className="text-center px-3 py-3 font-semibold no-print"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sales.map((sale) => {
                        const totalCosto = sale.costoUnitBs * sale.cantidad;
                        const totalIngreso = sale.precioVentaBs * sale.cantidad;
                        const ganancia = totalIngreso - totalCosto;
                        return (
                          <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 text-slate-500 text-xs">{sale.fecha}</td>
                            <td className="px-3 py-3 font-medium text-slate-800 max-w-[150px] truncate">{sale.productoNombre}</td>
                            <td className="px-3 py-3 text-right text-slate-500">{fmtBs(sale.costoUnitBs)} Bs</td>
                            <td className="px-3 py-3 text-right text-slate-700">{fmtBs(sale.precioVentaBs)} Bs</td>
                            <td className="px-3 py-3 text-center text-slate-600">{sale.cantidad}</td>
                            <td className="px-3 py-3 text-right text-slate-500">{fmtBs(totalCosto)} Bs</td>
                            <td className="px-3 py-3 text-right font-medium text-slate-700">{fmtBs(totalIngreso)} Bs</td>
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
                    <tfoot>
                      <tr className="bg-slate-50 font-semibold">
                        <td colSpan={5} className="px-4 py-3 text-slate-600 text-xs">TOTALES</td>
                        <td className="px-3 py-3 text-right text-slate-700">{fmtBs(dashboardStats.totalCostoBs)} Bs</td>
                        <td className="px-3 py-3 text-right text-slate-800">{fmtBs(dashboardStats.totalIngresosBs)} Bs</td>
                        <td className={`px-3 py-3 text-right ${dashboardStats.gananciaNetaUSD >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {fmtBs(dashboardStats.totalIngresosBs - dashboardStats.totalCostoBs)} Bs
                        </td>
                        <td className="no-print" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ TAB: DASHBOARD ═══════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <DashboardCard
                title="Total Invertido"
                value={fmtUSD(dashboardStats.totalInvertidoUSD)}
                sublabel="en productos"
                icon={<DollarSign className="w-5 h-5" />}
                color="blue"
              />
              <DashboardCard
                title="Total Ingresos"
                value={fmtBs(dashboardStats.totalIngresosBs) + ' Bs'}
                sublabel={fmtUSD(dashboardStats.totalIngresosUSD)}
                icon={<TrendingUp className="w-5 h-5" />}
                color="teal"
              />
              <DashboardCard
                title="Ganancia Neta Real"
                value={fmtUSD(dashboardStats.gananciaNetaUSD)}
                sublabel={fmtBs(dashboardStats.totalIngresosBs - dashboardStats.totalCostoBs) + ' Bs'}
                icon={dashboardStats.gananciaNetaUSD >= 0
                  ? <ArrowUpRight className="w-5 h-5" />
                  : <ArrowDownRight className="w-5 h-5" />}
                color={dashboardStats.gananciaNetaUSD >= 0 ? 'green' : 'red'}
              />
              <DashboardCard
                title="Margen Real"
                value={fmtPct(dashboardStats.margenReal)}
                sublabel="promedio de ventas"
                icon={<Percent className="w-5 h-5" />}
                color="purple"
              />
              <DashboardCard
                title="Brecha Cambiaria"
                value={fmtPct(dashboardStats.brecha)}
                sublabel={`Banco ${fmtBs(config.tasaBanco)} → BCV ${fmtBs(config.tasaVentaBCV)}`}
                icon={<AlertTriangle className="w-5 h-5" />}
                color="amber"
              />
            </div>

            {/* Products summary chart */}
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
                    <ProductAnalysisBar key={p.id} product={p} calc={calc} config={config} currency={currency} />
                  ))}
                </div>
              )}
            </div>

            {/* Quick stats */}
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
                  <div className="text-2xl font-bold text-emerald-600">
                    {productResults.filter((r) => r.calc.cubreBrecha).length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Cubren Brecha</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-500">
                    {productResults.filter((r) => !r.calc.cubreBrecha).length}
                  </div>
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
            ImportCalc VE — Calculadora de Costos de Importación Venezuela
          </p>
          <p className="text-xs text-slate-300">
            Los datos se guardan localmente en tu navegador
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
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Select Product */}
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
                          costoUnitBs: calc.costoPorUnidadBs,
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

                {/* Date */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={saleForm.fecha}
                    onChange={(e) => setSaleForm((s) => ({ ...s, fecha: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-sm text-slate-800"
                  />
                </div>

                {/* Cost & Price */}
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

                {/* Quantity */}
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

                {/* Preview */}
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ConfigField({
  label,
  sublabel,
  value,
  onChange,
  icon,
  color,
  prefix,
  suffix,
}: {
  label: string;
  sublabel: string;
  value: number;
  onChange: (v: number) => void;
  icon: React.ReactNode;
  color: string;
  prefix?: string;
  suffix?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-200 focus-within:border-blue-400 focus-within:ring-blue-100',
    green: 'border-green-200 focus-within:border-green-400 focus-within:ring-green-100',
    teal: 'border-teal-200 focus-within:border-teal-400 focus-within:ring-teal-100',
    orange: 'border-orange-200 focus-within:border-orange-400 focus-within:ring-orange-100',
    purple: 'border-purple-200 focus-within:border-purple-400 focus-within:ring-purple-100',
    red: 'border-red-200 focus-within:border-red-400 focus-within:ring-red-100',
  };

  const iconColorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    teal: 'bg-teal-100 text-teal-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className={`rounded-lg border p-3 transition-all focus-within:ring-2 ${colorMap[color] || colorMap.teal}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded flex items-center justify-center ${iconColorMap[color] || iconColorMap.teal}`}>
          {icon}
        </div>
        <div>
          <div className="text-xs font-medium text-slate-700 leading-tight">{label}</div>
          <div className="text-[10px] text-slate-400 leading-tight">{sublabel}</div>
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

function CostRow({ label, value, type }: { label: string; value: string; type: 'base' | 'cost' | 'subtotal' | 'rate' }) {
  const typeStyles: Record<string, string> = {
    base: 'text-slate-600',
    cost: 'text-slate-500',
    subtotal: 'font-semibold text-slate-800',
    rate: 'text-amber-600',
  };

  return (
    <div className={`flex justify-between items-center text-sm py-1 px-2 rounded ${type === 'cost' ? 'bg-slate-50/50 -mx-2 px-2' : ''}`}>
      <span className={`text-xs ${type === 'subtotal' ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-sm ${typeStyles[type]}`}>{value}</span>
    </div>
  );
}

function ResultCard({ label, value, sublabel, positive }: { label: string; value: string; sublabel: string; positive: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${
      positive ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
    }`}>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</div>
      <div className={`text-base font-bold mt-1 ${positive ? 'text-emerald-700' : 'text-red-600'}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{sublabel}</div>
    </div>
  );
}

function CostBar({ calc }: { calc: CalcResult }) {
  const totalUSD = calc.costoProductoUSD + calc.courierIntlUSD + calc.impuestosUSD;
  if (totalUSD <= 0) {
    return <div className="h-3 bg-slate-100 rounded-full" />;
  }

  const productoPct = (calc.costoProductoUSD / totalUSD) * 100;
  const courierPct = (calc.courierIntlUSD / totalUSD) * 100;
  const impuestosPct = (calc.impuestosUSD / totalUSD) * 100;

  return (
    <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
      <div
        className="bg-teal-500 rounded-l-full"
        style={{ width: `${productoPct}%` }}
        title={`Producto: ${productoPct.toFixed(1)}%`}
      />
      <div
        className="bg-amber-400"
        style={{ width: `${courierPct}%` }}
        title={`Courier: ${courierPct.toFixed(1)}%`}
      />
      <div
        className="bg-rose-400 rounded-r-full"
        style={{ width: `${impuestosPct}%` }}
        title={`Impuestos: ${impuestosPct.toFixed(1)}%`}
      />
    </div>
  );
}

function DashboardCard({
  title,
  value,
  sublabel,
  icon,
  color,
}: {
  title: string;
  value: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    teal: 'bg-teal-50 text-teal-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-500',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  const iconBgMap: Record<string, string> = {
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
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgMap[color] || iconBgMap.teal}`}>
          {icon}
        </div>
      </div>
      <div className="text-xs text-slate-500 font-medium mb-1">{title}</div>
      <div className="text-lg sm:text-xl font-bold text-slate-800 leading-tight">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{sublabel}</div>
    </div>
  );
}

function ProductAnalysisBar({
  product,
  calc,
  config,
  currency,
}: {
  product: Product;
  calc: CalcResult;
  config: Config;
  currency: CurrencyDisplay;
}) {
  const costoPorUnidadUSD = calc.costoPorUnidadBs / config.tasaVentaBCV;
  const costoTotalUSD = calc.costoTotalUSD * product.cantidad;
  const gananciaTotalUSD = calc.gananciaUnitUSD * product.cantidad;

  return (
    <div className="border border-slate-100 rounded-lg p-3 hover:border-slate-200 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-medium text-slate-800 text-sm">{product.nombre}</div>
          <div className="text-xs text-slate-400">{product.cantidad} und | {product.metodoPago === 'banco' ? 'Banco' : 'USDT'}</div>
        </div>
        <div className="flex items-center gap-1">
          {calc.cubreBrecha ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <div>
          <span className="text-slate-400">Costo Und: </span>
          <span className="font-medium text-slate-700">{currency === 'Bs' ? fmtBs(calc.costoPorUnidadBs) + ' Bs' : fmtUSD(costoPorUnidadUSD)}</span>
        </div>
        <div>
          <span className="text-slate-400">Venta: </span>
          <span className="font-medium text-teal-700">{currency === 'Bs' ? fmtBs(calc.precioVentaBs) + ' Bs' : fmtUSD(calc.precioVentaUSD)}</span>
        </div>
        <div>
          <span className="text-slate-400">Ganancia Und: </span>
          <span className={`font-medium ${calc.gananciaUnitBs >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {currency === 'Bs' ? fmtBs(calc.gananciaUnitBs) + ' Bs' : fmtUSD(calc.gananciaUnitUSD)}
          </span>
        </div>
        <div>
          <span className="text-slate-400">Ganancia Total: </span>
          <span className={`font-medium ${gananciaTotalUSD >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {currency === 'Bs' ? fmtBs(calc.gananciaUnitBs * product.cantidad) + ' Bs' : fmtUSD(gananciaTotalUSD)}
          </span>
        </div>
      </div>
      {/* Mini cost bar */}
      <div className="mt-2">
        <CostBar calc={calc} />
        <div className="flex gap-4 mt-1 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />Producto</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Courier</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />Impuestos</span>
        </div>
      </div>
    </div>
  );
}
