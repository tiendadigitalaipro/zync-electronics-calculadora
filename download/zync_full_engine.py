#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    ZYNC ELECTRONICS - FULL ENGINE v2.0                       ║
║               Motor Integral de Importación China → Venezuela                ║
║                                                                              ║
║  Módulos integrados:                                                         ║
║    1. Módulo Marítimo CBM  - Cálculo de volumen real por medidas de caja     ║
║    2. Cerebro Financiero P2P - Tasa Efectiva Real, spread USDT, com. Zinli  ║
║    3. Gestor de OPEX y Riesgo - Gastos operativos + merma 3%                 ║
║    4. Módulo de Inventario  - Registro de productos con historial            ║
║    5. Salida Profesional    - Menú interactivo en consola                    ║
║                                                                              ║
║  Creado por A2K Digital Studio | Socio Tecnológico ZYNC Electronics          ║
║ Motor optimizado para ejecución local en workstation ASUS                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import sys
import json
import copy
import math
from datetime import datetime, date
from typing import Optional, List, Dict, Any

# ═══════════════════════════════════════════════════════════════════════════════
#   UTILIDADES VISUALES
# ═══════════════════════════════════════════════════════════════════════════════

class Color:
    """Códigos ANSI para terminal con colores."""
    RESET   = "\033[0m"
    BOLD    = "\033[1m"
    DIM     = "\033[2m"
    UNDER   = "\033[4m"

    NEGRO   = "\033[30m"
    ROJO    = "\033[31m"
    VERDE   = "\033[32m"
    AMARILLO= "\033[33m"
    AZUL    = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN    = "\033[36m"
    BLANCO  = "\033[37m"
    GRIS    = "\033[90m"

    BG_NEGRO  = "\033[40m"
    BG_ROJO   = "\033[41m"
    BG_VERDE  = "\033[42m"
    BG_AMAR   = "\033[43m"
    BG_AZUL   = "\033[44m"

    DORADO     = "\033[38;2;212;168;83m"
    DORADO_BR  = "\033[1;38;2;212;168;83m"
    CYAN_BR    = "\033[1;36m"
    VERDE_BR   = "\033[1;32m"
    ROJO_BR    = "\033[1;31m"
    AMARILLO_BR= "\033[1;33m"
    BLANCO_BR  = "\033[1;37m"

def limpiar():
    """Limpia la pantalla según el OS."""
    os.system('cls' if os.name == 'nt' else 'clear')

def separador(char="═", ancho=70):
    print(f"{Color.DORADO}{char * ancho}{Color.RESET}")

def sub_separador(char="─", ancho=66):
    print(f"{Color.GRIS}{char * ancho}{Color.RESET}")

def titulo(texto, sub=""):
    separador()
    print(f"{Color.DORADO_BR}  {texto}{Color.RESET}")
    if sub:
        print(f"{Color.DIM}  {sub}{Color.RESET}")
    separador()

def seccion(texto):
    print(f"\n{Color.CYAN_BR}  {texto}{Color.RESET}")
    sub_separador()

def alerta(texto):
    print(f"  {Color.AMARILLO_BR}{texto}{Color.RESET}")

def exito(texto):
    print(f"  {Color.VERDE_BR}{texto}{Color.RESET}")

def error(texto):
    print(f"  {Color.ROJO_BR}{texto}{Color.RESET}")

def dato(label, valor, color=Color.BLANCO):
    print(f"  {Color.GRIS}{label:<38}{color}{valor}{Color.RESET}")

def dato_usd(label, valor):
    print(f"  {Color.GRIS}{label:<38}{Color.VERDE_BR}${valor:>12,.2f} USD{Color.RESET}")

def dato_bs(label, valor):
    """Formatea Bolívares con punto de miles y coma decimal (formato VE)."""
    if valor < 0:
        valor = 0
    entero = int(valor)
    decimales = round((valor - entero) * 100)
    formateado = f"{entero:,.0f}".replace(",", ".")
    print(f"  {Color.GRIS}{label:<38}{Color.AMARILLO_BR}Bs. {formateado:>12},{decimales:02d}{Color.RESET}")

def input_num(prompt, default=0.0, min_val=0.0):
    """Input numérico seguro con valor por defecto."""
    try:
        raw = input(f"  {Color.CYAN}{prompt}{Color.DIM} [{default}]{Color.RESET}: ").strip()
        if raw == "":
            return default
        val = float(raw)
        return max(val, min_val)
    except (ValueError, KeyboardInterrupt):
        return default

def input_int(prompt, default=1, min_val=1):
    """Input entero seguro con valor por defecto."""
    try:
        raw = input(f"  {Color.CYAN}{prompt}{Color.DIM} [{default}]{Color.RESET}: ").strip()
        if raw == "":
            return int(default)
        val = int(raw)
        return max(val, min_val)
    except (ValueError, KeyboardInterrupt):
        return int(default)

def input_str(prompt, default=""):
    try:
        raw = input(f"  {Color.CYAN}{prompt}{Color.DIM} [{default if default else '...'}]{Color.RESET}: ").strip()
        return raw if raw else default
    except KeyboardInterrupt:
        return default

def pausar():
    try:
        input(f"\n  {Color.DIM}Presione ENTER para continuar...{Color.RESET}")
    except KeyboardInterrupt:
        pass

# ═══════════════════════════════════════════════════════════════════════════════
#   ARCHIVO DE DATOS PERSISTENTE
# ═══════════════════════════════════════════════════════════════════════════════

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "zync_data.json")

def cargar_datos() -> dict:
    """Carga datos persistentes desde JSON."""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {
        "configuracion": {},
        "inventario": [],
        "historial_lotes": [],
    }

def guardar_datos(datos: dict):
    """Guarda datos persistentes a JSON."""
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(datos, f, indent=2, ensure_ascii=False, default=str)
    except IOError as e:
        error(f"Error guardando datos: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
#   MÓDULO 1: CEREBRO FINANCIERO P2P
# ═══════════════════════════════════════════════════════════════════════════════

class CerebroFinancieroP2P:
    """
    Motor de cálculo de la Tasa Efectiva Real para pagos P2P.
    
    Cuando pagas con USDT vía Zinli, la tasa nominal NO es la real.
    Composición:
      Tasa Efectiva = Tasa_USDT x (1 + spread_compra/100) 
                                x (1 + comision_usdt_zinli/100) 
                                x (1 + comision_zinli/100)
    
    Ejemplo real ZYNC:
      Tasa USDT:          630.00 Bs/$
      Spread compra:       1.50%
      Com USDT -> Zinli:   3.00%
      Com Zinli recarga:   3.50%
      ─────────────────────────────────
      Tasa Efectiva Real: 681.69 Bs/$  (+8.21% extra)
    """

    # Valores por defecto ZYNC Electronics (actualizados)
    DEFAULTS = {
        "tasa_banco":          570.75,   # Tasa Dólar Banco BCV
        "tasa_usdt":           630.00,   # Tasa USDT compra
        "tasa_venta_bcv":      485.00,   # Tasa a la que vendes al público
        "spread_usdt":         1.50,     # Spread pérdida al comprar USDT
        "comision_usdt_zinli": 3.00,     # Comisión conversión USDT -> Zinli
        "comision_zinli":      3.50,     # Comisión recarga Zinli
    }

    def __init__(self):
        self.tasa_banco = self.DEFAULTS["tasa_banco"]
        self.tasa_usdt = self.DEFAULTS["tasa_usdt"]
        self.tasa_venta_bcv = self.DEFAULTS["tasa_venta_bcv"]
        self.spread_usdt = self.DEFAULTS["spread_usdt"]
        self.comision_usdt_zinli = self.DEFAULTS["comision_usdt_zinli"]
        self.comision_zinli = self.DEFAULTS["comision_zinli"]

    def tasa_efectiva_p2p(self) -> float:
        """
        Calcula la Tasa Efectiva Real P2P.
        
        Fórmula:
          T_ef = T_USDT x (1 + S/100) x (1 + C1/100) x (1 + C2/100)
          
        Donde:
          T_USDT = Tasa nominal de compra de USDT
          S      = Spread de compra (%)
          C1     = Comisión USDT -> Zinli (%)
          C2     = Comisión Zinli recarga (%)
        
        Returns:
            Tasa efectiva real en Bs/$
        """
        t = self.tasa_usdt
        t *= (1 + self.spread_usdt / 100)
        t *= (1 + self.comision_usdt_zinli / 100)
        t *= (1 + self.comision_zinli / 100)
        return t

    def friccion_p2p_pct(self) -> float:
        """Porcentaje extra que pagas vs la tasa nominal USDT."""
        tasa_ef = self.tasa_efectiva_p2p()
        return ((tasa_ef - self.tasa_usdt) / self.tasa_usdt) * 100 if self.tasa_usdt > 0 else 0

    def brecha_cambiaria_pct(self) -> float:
        """Brecha entre tasa banco y tasa venta BCV."""
        if self.tasa_venta_bcv <= 0:
            return 0
        return ((self.tasa_banco - self.tasa_venta_bcv) / self.tasa_venta_bcv) * 100

    def tasa_para_metodo(self, metodo: str) -> float:
        """Retorna la tasa efectiva según método de pago."""
        if metodo.lower() in ("usdt", "usdt_zinli", "zinli"):
            return self.tasa_efectiva_p2p()
        return self.tasa_banco  # Banco BCV

    def imprimir_panel(self):
        """Muestra el panel completo del cerebro financiero."""
        seccion("CEREBRO FINANCIERO P2P")
        
        tasa_ef = self.tasa_efectiva_p2p()
        friccion = self.friccion_p2p_pct()
        brecha = self.brecha_cambiaria_pct()

        dato("Tasa Dólar Banco BCV", f"{self.tasa_banco:,.2f} Bs/$")
        dato("Tasa USDT Compra", f"{self.tasa_usdt:,.2f} Bs/$")
        dato("Tasa Venta al Público (BCV)", f"{self.tasa_venta_bcv:,.2f} Bs/$")
        print()
        dato("Spread Compra USDT", f"{self.spread_usdt:.2f}%")
        dato("Comisión USDT -> Zinli", f"{self.comision_usdt_zinli:.2f}%")
        dato("Comisión Zinli Recarga", f"{self.comision_zinli:.2f}%")
        print()
        dato("Fricción P2P Extra", f"+{friccion:.2f}%", Color.AMARILLO)
        dato("Brecha Cambiaria", f"{brecha:.2f}%", Color.ROJO)
        print()
        print(f"  {Color.DORADO_BR}  >>> TASA EFECTIVA REAL P2P: {tasa_ef:,.2f} Bs/$  <<<{Color.RESET}")
        print(f"  {Color.DIM}      (Crees que pagas {self.tasa_usdt:,.2f} pero realmente pagas {tasa_ef:,.2f}){Color.RESET}")

    def configurar(self):
        """Permite al usuario modificar todas las tasas."""
        print()
        alerta("Configuración de Tasas de Cambio y Comisiones P2P")
        sub_separador()
        
        self.tasa_banco       = input_num("Tasa Dólar Banco BCV (Bs/$)", self.tasa_banco)
        self.tasa_usdt        = input_num("Tasa USDT Compra (Bs/$)", self.tasa_usdt)
        self.tasa_venta_bcv   = input_num("Tasa Venta al Público BCV (Bs/$)", self.tasa_venta_bcv)
        self.spread_usdt      = input_num("Spread Compra USDT (%)", self.spread_usdt)
        self.comision_usdt_zinli = input_num("Comisión USDT -> Zinli (%)", self.comision_usdt_zinli)
        self.comision_zinli   = input_num("Comisión Zinli Recarga (%)", self.comision_zinli)
        
        exito("Tasas actualizadas correctamente.")

# ═══════════════════════════════════════════════════════════════════════════════
#   MÓDULO 2: MÓDULO MARÍTIMO CBM
# ═══════════════════════════════════════════════════════════════════════════════

class ModuloMaritimoCBM:
    """
    Motor de cálculo de flete marítimo basado en CBM (Metros Cúbicos).
    
    Cálculo de Volumen Real:
      CBM = (Largo_cm x Ancho_cm x Alto_cm) / 1,000,000
    
    Flete total = CBM_total x Tarifa_CBM + Gastos_Puerto
    """

    def __init__(self):
        self.productos = []
        self.tarifa_cbm = 180.0
        self.gastos_puerto = []
        self.destino = "Ocumare de la Costa"
        self.puerto_origen = "Puerto de Shenzhen"
        self.puerto_destino = "Puerto de La Guaira"

    def configurar(self):
        """Configuración interactiva del embarque marítimo."""
        print()
        alerta("Configuración del Embarque Marítimo")
        sub_separador()
        
        self.puerto_origen  = input_str("Puerto de origen", self.puerto_origen)
        self.puerto_destino = input_str("Puerto de destino", self.puerto_destino)
        self.destino        = input_str("Ciudad de entrega", self.destino)
        self.tarifa_cbm     = input_num("Tarifa por CBM (USD)", self.tarifa_cbm)

        print()
        alerta("Gastos de Puerto / Despacho / Aduana")
        sub_separador()
        self.gastos_puerto = []
        
        gastos_default = [
            ("Agente de aduanas", 150.00),
            ("Despacho aduanero", 80.00),
            ("Manejo portuario", 45.00),
            ("Almacenaje en puerto", 30.00),
            ("Permiso sanitario/fitosanitario", 20.00),
            ("Conexión terrestre al depósito", 60.00),
        ]
        
        for concepto, monto in gastos_default:
            val = input_num(f"  {concepto} (USD)", monto)
            if val > 0:
                self.gastos_puerto.append({"concepto": concepto, "monto": val})

        total_puerto = sum(g["monto"] for g in self.gastos_puerto)
        print()
        dato("Total Gastos de Puerto", f"${total_puerto:,.2f} USD", Color.VERDE_BR)
        exito("Embarque marítimo configurado.")

    def configurar_tarifa(self, tarifa_usd_cbm: float):
        """Establece la tarifa por CBM del courier naviero."""
        self.tarifa_cbm = float(tarifa_usd_cbm)

    def agregar_gasto_puerto(self, concepto: str, monto_usd: float):
        """Agrega un gasto fijo de puerto/despacho/aduana."""
        self.gastos_puerto.append({"concepto": concepto, "monto": float(monto_usd)})

    @staticmethod
    def calcular_cbm(largo_cm: float, ancho_cm: float, alto_cm: float) -> float:
        """CBM = (L x A x H) / 1,000,000"""
        return (largo_cm * ancho_cm * alto_cm) / 1_000_000

    def agregar_producto(self, nombre: str, largo: float, ancho: float, alto: float,
                         cajas: int, peso_kg: float = 0, valor_usd: float = 0,
                         unidades: int = 0) -> dict:
        """Agrega un producto al embarque y retorna su datos calculados."""
        cbm_caja = self.calcular_cbm(largo, ancho, alto)
        cbm_total = cbm_caja * cajas

        producto = {
            "nombre": nombre,
            "largo_cm": largo,
            "ancho_cm": ancho,
            "alto_cm": alto,
            "cajas": cajas,
            "cbm_por_caja": cbm_caja,
            "cbm_total": cbm_total,
            "peso_kg_caja": peso_kg,
            "peso_total_kg": peso_kg * cajas,
            "valor_usd_unidad": valor_usd,
            "unidades": unidades,
        }
        self.productos.append(producto)
        return producto

    def agregar_producto_interactivo(self):
        """Solicita datos de producto por consola."""
        print()
        alerta("Agregar Producto al Embarque")
        sub_separador()
        
        nombre = input_str("Nombre del producto")
        if not nombre:
            return False

        print(f"  {Color.DIM}Medidas de la caja de '{nombre}':{Color.RESET}")
        largo  = input_num("  Largo (cm)", 40)
        ancho  = input_num("  Ancho (cm)", 30)
        alto   = input_num("  Alto (cm)", 25)
        cajas  = input_int("  Cantidad de cajas", 10)
        peso   = input_num("  Peso por caja (KG)", 0)
        valor  = input_num("  Valor por unidad (USD)", 0)
        unids  = input_int("  Unidades dentro de las cajas", cajas * 20)

        prod = self.agregar_producto(nombre, largo, ancho, alto, cajas, peso, valor, unids)
        
        print()
        dato("CBM por caja", f"{prod['cbm_por_caja']:.6f}")
        dato("CBM total", f"{prod['cbm_total']:.6f}")
        exito(f"'{nombre}' agregado al embarque.")
        return True

    def calcular_embarque(self) -> Optional[dict]:
        """Ejecuta todos los cálculos del embarque marítimo."""
        if not self.productos:
            error("No hay productos en el embarque.")
            return None

        cbm_total = sum(p["cbm_total"] for p in self.productos)
        costo_flete = cbm_total * self.tarifa_cbm
        total_gastos_puerto = sum(g["monto"] for g in self.gastos_puerto)
        costo_total = costo_flete + total_gastos_puerto
        total_cajas = sum(p["cajas"] for p in self.productos)
        total_unidades = sum(p["unidades"] for p in self.productos)
        peso_total = sum(p["peso_total_kg"] for p in self.productos)

        # Distribuir costos proporcionalmente por CBM
        for p in self.productos:
            prop = p["cbm_total"] / cbm_total if cbm_total > 0 else 0
            p["flete_total"] = costo_flete * prop
            p["flete_por_caja"] = p["flete_total"] / p["cajas"] if p["cajas"] > 0 else 0
            p["puerto_total"] = total_gastos_puerto * prop
            p["costo_logistico_total"] = p["flete_total"] + p["puerto_total"]
            if p["unidades"] > 0:
                p["costo_logistico_por_unidad"] = p["costo_logistico_total"] / p["unidades"]
            else:
                p["costo_logistico_por_unidad"] = 0

        return {
            "cbm_total": cbm_total,
            "costo_flete": costo_flete,
            "total_gastos_puerto": total_gastos_puerto,
            "costo_total": costo_total,
            "total_cajas": total_cajas,
            "total_unidades": total_unidades,
            "peso_total_kg": peso_total,
            "costo_por_cm3": self.tarifa_cbm / 1_000_000,
            "costo_por_caja": costo_total / total_cajas if total_cajas > 0 else 0,
            "costo_por_unidad": costo_total / total_unidades if total_unidades > 0 else 0,
        }

    def imprimir_reporte(self, resultado: dict):
        """Genera el reporte completo del embarque en consola."""
        if not resultado:
            return

        titulo("ZYNC ELECTRONICS - REPORTE FLETE MARÍTIMO CBM",
               f"{self.puerto_origen} → {self.puerto_destino} → {self.destino}")

        # Config
        seccion("CONFIGURACIÓN DEL EMBARQUE")
        dato("Origen portuario", self.puerto_origen)
        dato("Destino portuario", self.puerto_destino)
        dato("Entrega final", self.destino)
        dato("Tarifa CBM", f"${self.tarifa_cbm:,.2f} USD/CBM")

        # Resumen
        seccion("RESUMEN DEL EMBARQUE")
        dato("Productos registrados", str(len(self.productos)))
        dato("Total de cajas", str(resultado["total_cajas"]))
        dato("Total de unidades", str(resultado["total_unidades"]))
        dato("CBM TOTAL", f"{resultado['cbm_total']:.6f} CBM", Color.VERDE_BR)
        dato("Peso total", f"{resultado['peso_total_kg']:,.2f} KG")

        # Detalle por producto
        seccion("DETALLE POR PRODUCTO")
        print(f"  {'Producto':<26} {'Cajas':>5} {'CBM':>10} {'$/Caja':>10} {'$/Unid':>10}")
        sub_separador()
        for p in self.productos:
            nombre = p["nombre"][:24]
            costo_unid = f"${p['costo_logistico_por_unidad']:.2f}" if p["unidades"] > 0 else "N/A"
            print(f"  {Color.BLANCO}{nombre:<26}{Color.RESET} "
                  f"{p['cajas']:>5} "
                  f"{p['cbm_total']:>10.6f} "
                  f"${p['costo_logistico_total']/p['cajas']:>9.2f} "
                  f"{costo_unid:>10}")

        # Gastos de puerto
        seccion("GASTOS DE PUERTO / DESPACHO / ADUANA")
        for g in self.gastos_puerto:
            dato(g["concepto"], f"${g['monto']:,.2f} USD")
        sub_separador()
        dato("SUBTOTAL GASTOS PUERTO", f"${resultado['total_gastos_puerto']:,.2f} USD", Color.AMARILLO)

        # Totales
        seccion("TOTALES DEL EMBARQUE")
        dato_usd("Flete marítimo", resultado["costo_flete"])
        dato_usd("Gastos de puerto", resultado["total_gastos_puerto"])
        sub_separador()
        dato_usd("COSTO TOTAL EMBARQUE", resultado["costo_total"])
        if resultado["total_unidades"] > 0:
            dato_usd("Costo por unidad (flete+puerto)", resultado["costo_por_unidad"])
        dato_usd("Costo por caja", resultado["costo_por_caja"])
        dato("Costo por cm³", f"${resultado['costo_por_cm3']:.6f} USD")

# ═══════════════════════════════════════════════════════════════════════════════
#   MÓDULO 3: GESTOR DE OPEX Y RIESGO
# ═══════════════════════════════════════════════════════════════════════════════

class GestorOPEXyRiesgo:
    """
    Gestor de gastos operativos y factor de riesgo (merma).
    
    OPEX mensuales (se dividen entre unidades del lote):
      - Internet (Galanet): $34/mes
      - Publicidad (Redes): $15/mes
    
    OPEX por unidad:
      - Empaques: $0.30/unidad
      - Delivery local: $1.50/unidad
    
    Riesgo:
      - Merma (defectuosos): 3% por defecto
        Si compras 100 unidades con 3% merma = 97 vendibles
        El costo de las 3 defectuosas se absorbe en las 97 buenas
    """

    DEFAULTS = {
        "internet_mensual": 34.00,
        "publicidad_mensual": 15.00,
        "empaques_por_unidad": 0.30,
        "delivery_por_unidad": 1.50,
        "merma_pct": 3.0,
    }

    def __init__(self):
        self.internet_mensual = self.DEFAULTS["internet_mensual"]
        self.publicidad_mensual = self.DEFAULTS["publicidad_mensual"]
        self.empaques_por_unidad = self.DEFAULTS["empaques_por_unidad"]
        self.delivery_por_unidad = self.DEFAULTS["delivery_por_unidad"]
        self.merma_pct = self.DEFAULTS["merma_pct"]

    def opex_total_unidad_usd(self, cantidad: int) -> float:
        """OPEX total por unidad en USD."""
        if cantidad <= 0:
            return 0
        mensual_por_unidad = (self.internet_mensual + self.publicidad_mensual) / cantidad
        return mensual_por_unidad + self.empaques_por_unidad + self.delivery_por_unidad

    def unidades_vendibles(self, cantidad: int) -> int:
        """Unidades que realmente puedes vender descontando merma."""
        raw = cantidad * (1 - self.merma_pct / 100)
        return max(1, int(raw + 0.5))  # redondeo comercial (0.5 sube)

    def factor_merma(self) -> float:
        """Factor de ajuste por merma. Ej: 3% merma → 1/(0.97) = 1.0309"""
        return 1 / (1 - self.merma_pct / 100) if self.merma_pct < 100 else 1.0

    def costo_con_merma(self, costo_base: float) -> float:
        """Costo ajustado por merma (el costo de defectuosos se distribuye)."""
        return costo_base * self.factor_merma()

    def configurar(self):
        """Configuración interactiva del OPEX y riesgo."""
        print()
        alerta("Configuración de OPEX y Riesgo")
        sub_separador()
        
        self.internet_mensual    = input_num("Internet Galanet (USD/mes)", self.internet_mensual)
        self.publicidad_mensual  = input_num("Publicidad Redes (USD/mes)", self.publicidad_mensual)
        self.empaques_por_unidad = input_num("Empaques (USD/unidad)", self.empaques_por_unidad)
        self.delivery_por_unidad = input_num("Delivery local (USD/unidad)", self.delivery_por_unidad)
        self.merma_pct           = input_num("Merma / Defectuosos (%)", self.merma_pct)
        
        exito("OPEX y Riesgo actualizados.")

    def imprimir_panel(self, cantidad: int = 100):
        """Muestra el panel completo de OPEX."""
        seccion("GESTOR DE OPEX Y RIESGO")
        
        opex_unit = self.opex_total_unidad_usd(cantidad)
        vendibles = self.unidades_vendibles(cantidad)
        factor = self.factor_merma()

        dato("Internet (Galanet)", f"${self.internet_mensual:,.2f} USD/mes")
        dato("Publicidad (Redes)", f"${self.publicidad_mensual:,.2f} USD/mes")
        dato("Empaques", f"${self.empaques_por_unidad:,.2f} USD/unidad")
        dato("Delivery local", f"${self.delivery_por_unidad:,.2f} USD/unidad")
        print()
        dato("Merma (defectuosos)", f"{self.merma_pct:.1f}%", Color.ROJO)
        dato(f"Si compras {cantidad} unidades", f"solo {vendibles} vendibles", Color.AMARILLO)
        dato("Factor de ajuste merma", f"x{factor:.4f}", Color.AMARILLO)
        print()
        dato(f"OPEX total/unidad ({cantidad} und)", f"${opex_unit:,.2f} USD", Color.VERDE_BR)

# ═══════════════════════════════════════════════════════════════════════════════
#   MÓDULO 4: MÓDULO DE INVENTARIO
# ═══════════════════════════════════════════════════════════════════════════════

class ModuloInventario:
    """
    Sistema de inventario con registro de productos y historial.
    
    Permite:
      - Registrar productos nuevos con costo, cantidad y fecha
      - Consultar inventario actual con estados
      - Registrar salidas (ventas) con fecha y precio
      - Ver historial completo de movimientos
      - Cálculo automático de valor en stock
    """

    def __init__(self):
        self.productos = []   # Lista de productos en inventario
        self.historial = []   # Registro de movimientos

    def registrar_entrada(self, nombre: str, cantidad: int, costo_usd: float,
                          metodo_pago: str = "usdt", notas: str = "") -> dict:
        """Regresa entrada de productos al inventario."""
        producto = {
            "id": datetime.now().strftime("%Y%m%d%H%M%S") + str(len(self.productos)),
            "nombre": nombre,
            "cantidad": cantidad,
            "costo_usd": costo_usd,
            "metodo_pago": metodo_pago,
            "fecha_entrada": date.today().isoformat(),
            "notas": notas,
            "vendidos": 0,
            "defectuosos": 0,
            "estado": "en_stock",
        }
        self.productos.append(producto)

        movimiento = {
            "tipo": "ENTRADA",
            "producto_id": producto["id"],
            "producto_nombre": nombre,
            "cantidad": cantidad,
            "costo_usd": costo_usd,
            "fecha": date.today().isoformat(),
            "hora": datetime.now().strftime("%H:%M:%S"),
            "notas": notas,
        }
        self.historial.append(movimiento)
        return producto

    def registrar_salida(self, producto_id: str, cantidad: int,
                         precio_venta_usd: float = 0, notas: str = "") -> bool:
        """Registra salida (venta) de productos del inventario."""
        prod = None
        for p in self.productos:
            if p["id"] == producto_id:
                prod = p
                break

        if not prod:
            error(f"Producto ID '{producto_id}' no encontrado.")
            return False

        disponibles = prod["cantidad"] - prod["vendidos"] - prod["defectuosos"]
        if cantidad > disponibles:
            error(f"Solo hay {disponibles} unidades disponibles.")
            return False

        prod["vendidos"] += cantidad
        if prod["vendidos"] >= prod["cantidad"] - prod["defectuosos"]:
            prod["estado"] = "agotado"

        movimiento = {
            "tipo": "SALIDA",
            "producto_id": producto_id,
            "producto_nombre": prod["nombre"],
            "cantidad": cantidad,
            "precio_venta_usd": precio_venta_usd,
            "fecha": date.today().isoformat(),
            "hora": datetime.now().strftime("%H:%M:%S"),
            "notas": notas,
        }
        self.historial.append(movimiento)
        return True

    def registrar_defectuosos(self, producto_id: str, cantidad: int) -> bool:
        """Registra unidades defectuosas."""
        prod = None
        for p in self.productos:
            if p["id"] == producto_id:
                prod = p
                break

        if not prod:
            return False

        disponibles = prod["cantidad"] - prod["vendidos"] - prod["defectuosos"]
        if cantidad > disponibles:
            error(f"Solo hay {disponibles} unidades para marcar como defectuosas.")
            return False

        prod["defectuosos"] += cantidad
        self.historial.append({
            "tipo": "MERMA",
            "producto_id": producto_id,
            "producto_nombre": prod["nombre"],
            "cantidad": cantidad,
            "fecha": date.today().isoformat(),
            "hora": datetime.now().strftime("%H:%M:%S"),
            "notas": "Unidades defectuosas registradas",
        })
        return True

    def valor_total_stock_usd(self) -> float:
        """Valor total del inventario actual en USD."""
        total = 0
        for p in self.productos:
            disponibles = p["cantidad"] - p["vendidos"] - p["defectuosos"]
            total += disponibles * p["costo_usd"]
        return total

    def imprimir_inventario(self):
        """Muestra el inventario completo en consola."""
        if not self.productos:
            alerta("Inventario vacío. Registre productos primero.")
            return

        titulo("ZYNC ELECTRONICS - INVENTARIO ACTUAL")
        
        print(f"  {'#':<4} {'Producto':<28} {'Costo':>8} {'Total':>6} "
              f"{'Vend.':>6} {'Disp.':>6} {'Estado':<12}")
        sub_separador()

        for i, p in enumerate(self.productos, 1):
            disponibles = p["cantidad"] - p["vendidos"] - p["defectuosos"]
            
            # Color del estado
            if p["estado"] == "agotado":
                estado_color = Color.ROJO
            elif disponibles <= p["cantidad"] * 0.2:
                estado_color = Color.AMARILLO
            else:
                estado_color = Color.VERDE

            print(f"  {Color.GRIS}{i:<4}{Color.RESET}"
                  f"{Color.BLANCO}{p['nombre']:<28}{Color.RESET}"
                  f"${p['costo_usd']:>7.2f} "
                  f"{p['cantidad']:>6} "
                  f"{p['vendidos']:>6} "
                  f"{disponibles:>6} "
                  f"{estado_color}{p['estado']:<12}{Color.RESET}")

        sub_separador()
        total_productos = len(self.productos)
        total_unidades = sum(p["cantidad"] for p in self.productos)
        total_disponibles = sum(
            p["cantidad"] - p["vendidos"] - p["defectuosos"]
            for p in self.productos
        )
        valor_stock = self.valor_total_stock_usd()

        dato("Productos registrados", str(total_productos))
        dato("Unidades totales", str(total_unidades))
        dato("Unidades disponibles", str(total_disponibles), Color.VERDE_BR)
        dato_usd("Valor en stock", valor_stock)

    def imprimir_historial(self, limite: int = 20):
        """Muestra el historial de movimientos."""
        if not self.historial:
            alerta("Historial vacío.")
            return

        titulo("ZYNC ELECTRONICS - HISTORIAL DE MOVIMIENTOS")

        movimientos = self.historial[-limite:]
        for mov in reversed(movimientos):
            if mov["tipo"] == "ENTRADA":
                color = Color.VERDE
                icono = "+"
            elif mov["tipo"] == "SALIDA":
                color = Color.AMARILLO
                icono = "-"
            else:
                color = Color.ROJO
                icono = "!"

            print(f"  {color}{icono} [{mov['fecha']} {mov['hora']}] {mov['tipo']:<8} "
                  f"{mov['producto_nombre']:<28} x{mov['cantidad']}{Color.RESET}"
                  f"{Color.DIM}  {mov.get('notas', '')}{Color.RESET}")

        dato("Total movimientos", str(len(self.historial)))

    def entrada_interactiva(self):
        """Solicita datos de entrada por consola."""
        print()
        alerta("Registrar Entrada de Productos")
        sub_separador()

        nombre = input_str("Nombre del producto")
        if not nombre:
            error("Nombre vacío. Operación cancelada.")
            return

        cantidad = input_int("Cantidad de unidades")
        costo = input_num("Costo por unidad (USD)")
        metodo = input_str("Método de pago (banco/usdt)", "usdt")
        notas = input_str("Notas adicionales", "")

        prod = self.registrar_entrada(nombre, cantidad, costo, metodo, notas)
        print()
        exito(f"Registradas {cantidad}x {nombre} a ${costo:.2f} c/u")
        dato("ID del lote", prod["id"])
        dato("Método de pago", metodo.upper())
        dato_usd("Inversión total", cantidad * costo)

    def salida_interactiva(self):
        """Solicita datos de salida por consola."""
        if not self.productos:
            error("No hay productos en inventario.")
            return

        self.imprimir_inventario()
        print()

        idx = input_int("Seleccione # de producto", 1) - 1
        if idx < 0 or idx >= len(self.productos):
            error("Selección inválida.")
            return

        prod = self.productos[idx]
        disponibles = prod["cantidad"] - prod["vendidos"] - prod["defectuosos"]
        print(f"  {Color.CYAN}Producto: {prod['nombre']} (Disp: {disponibles}){Color.RESET}")

        cantidad = input_int("Cantidad a vender", 1)
        if cantidad > disponibles:
            error(f"Solo hay {disponibles} disponibles.")
            return

        precio = input_num("Precio de venta por unidad (USD)")
        notas = input_str("Notas", "Venta")

        if self.registrar_salida(prod["id"], cantidad, precio, notas):
            print()
            exito(f"Venta registrada: {cantidad}x {prod['nombre']} a ${precio:.2f} c/u")
            dato_usd("Ingreso total", cantidad * precio)
            dato_usd("Ganancia unitaria", precio - prod["costo_usd"])

# ═══════════════════════════════════════════════════════════════════════════════
#   MOTOR DE CÁLCULO INTEGRADO (Lote completo)
# ═══════════════════════════════════════════════════════════════════════════════

class MotorCalculoIntegrado:
    """
    Motor que integra TODOS los módulos para calcular un lote completo.
    
    Flujo:
      1. Datos del producto (nombre, costo USD, cantidad, margen, método pago)
      2. Flete marítimo CBM (se agrega o se usa flete aéreo/express)
      3. Cerebro Financiero (tasa efectiva según método)
      4. OPEX (gastos operativos por unidad)
      5. Riesgo (merma)
      6. Precio de venta sugerido
    
    Fórmula completa:
      Costo Origen = CostoProducto x (1 + IVA_China/100)
      FOB = (CostoOrigen x Cantidad) + Flete + Seguro + Courier
      FOB/Unidad = FOB / Cantidad
      CostoAterrizajeBs = (FOB/Unidad x TasaEfectiva) + (CourierNac x TasaEfectiva)
      OPEX_Bs = OPEX_Unidad_USD x TasaEfectiva
      CostoTotalBs = CostoAterrizajeBs + OPEX_Bs
      CostoRealConMermaBs = CostoTotalBs / (1 - Merma/100)
      PuntoEquilibrio = CostoRealConMermaBs
      PrecioVentaUSD = (CostoRealConMermaBs / TasaVentaBCV) + (CostoProducto x Margen/100)
      PrecioVentaBs = PrecioVentaUSD x TasaVentaBCV
    """

    def __init__(self, cerebro: CerebroFinancieroP2P, opex: GestorOPEXyRiesgo):
        self.cerebro = cerebro
        self.opex = opex

    def calcular_lote(
        self,
        nombre: str,
        costo_usd: float,
        cantidad: int,
        margen_pct: float,
        metodo_pago: str,
        flete_total_usd: float = 0,
        seguro_pct: float = 1.5,
        courier_internacional_usd: float = 2.0,
        courier_nacional_usd: float = 5.0,
        iva_china_pct: float = 13.0,
    ) -> dict:
        """
        Calcula el lote completo y retorna todos los resultados.
        """
        qty = max(cantidad, 1)
        
        # 1. COSTO DE ORIGEN
        costo_producto_base = costo_usd
        iva_china = costo_producto_base * (iva_china_pct / 100)
        costo_origen_china = costo_producto_base + iva_china

        # 2. LOGÍSTICA
        flete_por_unidad = flete_total_usd / qty
        valor_mercancia = costo_origen_china * qty
        seguro_carga = valor_mercancia * (seguro_pct / 100)
        seguro_por_unidad = seguro_carga / qty
        courier_int_por_unidad = courier_internacional_usd / qty
        courier_nac_por_unidad = courier_nacional_usd / qty

        # 3. COSTO FOB
        costo_fob_total = valor_mercancia + flete_total_usd + seguro_carga + courier_internacional_usd
        costo_fob_por_unidad = costo_fob_total / qty

        # 4. TASA EFECTIVA
        tasa_efectiva = self.cerebro.tasa_para_metodo(metodo_pago)

        # 5. CONVERSIÓN A Bs
        costo_fob_unidad_bs = costo_fob_por_unidad * tasa_efectiva
        courier_nac_unidad_bs = courier_nac_por_unidad * tasa_efectiva
        costo_aterrizaje_bs = costo_fob_unidad_bs + courier_nac_unidad_bs

        # 6. OPEX
        opex_unidad_usd = self.opex.opex_total_unidad_usd(qty)
        opex_unidad_bs = opex_unidad_usd * tasa_efectiva

        # 7. COSTO TOTAL OPERATIVO
        costo_total_operativo_bs = costo_aterrizaje_bs + opex_unidad_bs

        # 8. RIESGO (MERMA)
        costo_real_unidad_bs = self.opex.costo_con_merma(costo_total_operativo_bs)

        # 9. PUNTO DE EQUILIBRIO
        punto_equilibrio = costo_real_unidad_bs

        # 10. PRECIO DE VENTA
        tasa_venta = self.cerebro.tasa_venta_bcv
        costo_real_unidad_usd = costo_real_unidad_bs / tasa_venta if tasa_venta > 0 else 0
        margen_usd_sobre_producto = costo_producto_base * (margen_pct / 100)
        precio_venta_usd = costo_real_unidad_usd + margen_usd_sobre_producto
        precio_venta_bs = precio_venta_usd * tasa_venta
        margen_usd_total = precio_venta_usd - costo_real_unidad_usd

        # 11. GANANCIA
        ganancia_unidad_bs = precio_venta_bs - costo_real_unidad_bs
        ganancia_unidad_usd = ganancia_unidad_bs / tasa_venta if tasa_venta > 0 else 0
        cubre_brecha = ganancia_unidad_usd > 0

        return {
            # Origen
            "costo_producto_base": costo_producto_base,
            "iva_china": iva_china,
            "costo_origen_china": costo_origen_china,
            # Logística
            "flete_total": flete_total_usd,
            "flete_por_unidad": flete_por_unidad,
            "seguro_por_unidad": seguro_por_unidad,
            "courier_int_por_unidad": courier_int_por_unidad,
            "courier_nac_por_unidad": courier_nac_por_unidad,
            "courier_nac_unidad_bs": courier_nac_unidad_bs,
            # FOB
            "costo_fob_total": costo_fob_total,
            "costo_fob_por_unidad": costo_fob_por_unidad,
            "costo_fob_unidad_bs": costo_fob_unidad_bs,
            # Cambiario
            "tasa_efectiva": tasa_efectiva,
            "metodo_pago": metodo_pago,
            # Aterrizaje
            "costo_aterrizaje_bs": costo_aterrizaje_bs,
            # OPEX
            "opex_internet_usd": self.opex.internet_mensual / qty,
            "opex_publicidad_usd": self.opex.publicidad_mensual / qty,
            "opex_empaques_usd": self.opex.empaques_por_unidad,
            "opex_delivery_usd": self.opex.delivery_por_unidad,
            "opex_total_unidad_usd": opex_unidad_usd,
            "opex_total_unidad_bs": opex_unidad_bs,
            # Total operativo
            "costo_total_operativo_bs": costo_total_operativo_bs,
            # Riesgo
            "merma_pct": self.opex.merma_pct,
            "unidades_vendibles": self.opex.unidades_vendibles(qty),
            "costo_real_unidad_bs": costo_real_unidad_bs,
            "costo_real_unidad_usd": costo_real_unidad_usd,
            # Pricing
            "punto_equilibrio": punto_equilibrio,
            "margen_pct": margen_pct,
            "margen_usd_sobre_producto": margen_usd_sobre_producto,
            "margen_usd_total": margen_usd_total,
            "precio_venta_usd": precio_venta_usd,
            "precio_venta_bs": precio_venta_bs,
            # Ganancia
            "ganancia_unidad_bs": ganancia_unidad_bs,
            "ganancia_unidad_usd": ganancia_unidad_usd,
            "cubre_brecha": cubre_brecha,
            # Meta
            "nombre": nombre,
            "cantidad": qty,
        }

    def imprimir_lote(self, r: dict):
        """Imprime el reporte completo de un lote calculado."""
        titulo(f"ZYNC ELECTRONICS - CÁLCULO DE LOTE",
               f"{r['nombre']} | {r['cantidad']} unidades | {r['metodo_pago'].upper()}")

        # COSTO DE ORIGEN
        seccion("1. COSTO DE ORIGEN")
        dato_usd("Costo producto base", r["costo_producto_base"])
        dato_usd(f"(+) IVA China (13%)", r["iva_china"])
        sub_separador()
        dato_usd("(=) Costo Origen China", r["costo_origen_china"])

        # LOGÍSTICA
        seccion("2. LOGÍSTICA INTERNACIONAL")
        dato_usd(f"(+) Flete ({r['flete_total']:,.2f} / {r['cantidad']} und)", r["flete_por_unidad"])
        dato_usd("(+) Seguro de carga (1.5%)", r["seguro_por_unidad"])
        dato_usd(f"(+) Courier Int. ({r['courier_int_por_unidad']*r['cantidad']:,.2f} / {r['cantidad']})", r["courier_int_por_unidad"])
        sub_separador()
        dato_usd("═══ COSTO FOB POR UNIDAD", r["costo_fob_por_unidad"])

        # CAMBIARIO
        seccion("3. CONVERSIÓN CAMBIARIA")
        metodo_str = "Banco BCV" if r["metodo_pago"] == "banco" else "USDT → Zinli (P2P)"
        dato("Método de pago", metodo_str)
        dato("Tasa efectiva aplicada", f"{r['tasa_efectiva']:,.2f} Bs/$", Color.DORADO)
        dato_bs("FOB por unidad (Bs)", r["costo_fob_unidad_bs"])
        dato_bs("Courier nacional/unidad (Bs)", r["courier_nac_unidad_bs"])
        sub_separador()
        dato_bs("(=) Costo Aterrizaje Bs/unidad", r["costo_aterrizaje_bs"])

        # OPEX
        seccion("4. OPEX POR UNIDAD")
        dato_usd("Internet (Galanet)/unidad", r["opex_internet_usd"])
        dato_usd("Publicidad (Redes)/unidad", r["opex_publicidad_usd"])
        dato_usd("Empaques/unidad", r["opex_empaques_usd"])
        dato_usd("Delivery local/unidad", r["opex_delivery_usd"])
        sub_separador()
        dato_usd("═══ OPEX TOTAL/unidad", r["opex_total_unidad_usd"])
        dato_bs("═══ OPEX TOTAL/unidad (Bs)", r["opex_total_unidad_bs"])

        # COSTO TOTAL OPERATIVO
        seccion("5. COSTO TOTAL OPERATIVO (antes de merma)")
        dato_bs("Costo total operativo/unidad Bs", r["costo_total_operativo_bs"])

        # RIESGO
        seccion("6. FACTOR DE RIESGO (MERMA)")
        dato("Merma", f"{r['merma_pct']:.1f}%", Color.ROJO)
        dato("Unidades vendibles", f"{r['unidades_vendibles']} de {r['cantidad']}", Color.AMARILLO)
        sub_separador()
        dato_bs("═══ COSTO REAL POR UNIDAD Bs", r["costo_real_unidad_bs"])
        dato_usd("═══ COSTO REAL POR UNIDAD USD", r["costo_real_unidad_usd"])

        # PRECIO DE VENTA
        seccion("7. PRECIO DE VENTA")
        dato_bs("Punto de equilibrio", r["punto_equilibrio"])
        dato(f"Margen sobre producto", f"{r['margen_pct']:.0f}%")
        dato_usd("Margen USD sobre producto", r["margen_usd_sobre_producto"])
        print()
        
        # PRECIO PRINCIPAL
        print(f"\n  {Color.DORADO_BR}{Color.BOLD}{'═' * 58}{Color.RESET}")
        print(f"  {Color.DORADO_BR}{Color.BOLD}  PRECIO DE VENTA SUGERIDO{Color.RESET}")
        print(f"  {Color.DORADO_BR}{Color.BOLD}  USD: ${r['precio_venta_usd']:>10,.2f}{Color.RESET}")
        entero_bs = int(r["precio_venta_bs"])
        dec_bs = round((r["precio_venta_bs"] - entero_bs) * 100)
        bs_formateado = f"{entero_bs:,.0f}".replace(",", ".")
        print(f"  {Color.DORADO_BR}{Color.BOLD}  Bs:  {bs_formateado:>14},{dec_bs:02d}{Color.RESET}")
        print(f"  {Color.DORADO_BR}{Color.BOLD}{'═' * 58}{Color.RESET}")

        # GANANCIA
        print()
        dato_usd("Ganancia por unidad", r["ganancia_unidad_usd"])
        dato_bs("Ganancia por unidad", r["ganancia_unidad_bs"])
        
        if r["cubre_brecha"]:
            exito(">>> CUBRE BRECHA CAMBIARIA - GANANCIA POSITIVA <<<")
        else:
            error(">>> NO CUBRE BRECHA - REVISAR MARGEN O COSTOS <<<")

        # Tasa info
        print()
        dato("Tasa venta al público (BCV)", f"{self.cerebro.tasa_venta_bcv:,.2f} Bs/$")

    def calcular_lote_interactivo(self) -> Optional[dict]:
        """Flujo interactivo para calcular un nuevo lote."""
        print()
        alerta("CALCULAR NUEVO LOTE DE IMPORTACIÓN")
        sub_separador()

        nombre = input_str("Nombre del producto")
        if not nombre:
            error("Nombre vacío. Operación cancelada.")
            return None

        costo = input_num("Costo por unidad (USD)")
        cantidad = input_int("Cantidad de unidades", 100)
        margen = input_num("Margen deseado (%)", 40)

        print()
        dato("Métodos de pago:", "")
        dato("  1. Banco BCV", f"Tasa: {self.cerebro.tasa_banco:,.2f} Bs/$")
        dato("  2. USDT → Zinli", f"Tasa efectiva: {self.cerebro.tasa_efectiva_p2p():,.2f} Bs/$")
        print()
        metodo_op = input_int("Seleccione método (1=Banco, 2=USDT)", 2)
        metodo = "banco" if metodo_op == 1 else "usdt"

        flete = input_num("Flete total envío (USD)", 0)
        if flete == 0:
            print(f"  {Color.DIM}(Sin flete = costo terrestre local solamente){Color.RESET}")

        resultado = self.calcular_lote(
            nombre=nombre,
            costo_usd=costo,
            cantidad=cantidad,
            margen_pct=margen,
            metodo_pago=metodo,
            flete_total_usd=flete,
        )

        limpiar()
        self.imprimir_lote(resultado)
        return resultado

# ═══════════════════════════════════════════════════════════════════════════════
#   MENÚ PRINCIPAL
# ═══════════════════════════════════════════════════════════════════════════════

class ZYNCEngine:
    """
    Motor principal ZYNC Electronics.
    Integra todos los módulos en una interfaz profesional.
    """

    def __init__(self):
        self.cerebro = CerebroFinancieroP2P()
        self.opex = GestorOPEXyRiesgo()
        self.maritimo = ModuloMaritimoCBM()
        self.inventario = ModuloInventario()
        self.motor = MotorCalculoIntegrado(self.cerebro, self.opex)
        self.datos = cargar_datos()
        self._restaurar_datos()

    def _restaurar_datos(self):
        """Restaura datos persistentes desde archivo."""
        inv = self.datos.get("inventario", [])
        for item in inv:
            self.inventario.productos.append(item)
        hist = self.datos.get("historial_lotes", [])
        for item in hist:
            self.inventario.historial.append(item)

    def _guardar(self):
        """Guarda estado actual."""
        self.datos["inventario"] = self.inventario.productos
        self.datos["historial_lotes"] = self.inventario.historial
        guardar_datos(self.datos)

    def banner(self):
        """Banner principal del sistema."""
        limpiar()
        print()
        separador()
        print(f"{Color.DORADO_BR}{Color.BOLD}"
              f"        ████████╗███████╗██████╗ ███╗   ███╗███████╗ ██████╗"
              f"{Color.RESET}")
        print(f"{Color.DORADO_BR}{Color.BOLD}"
              f"        ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██╔════╝██╔═══██╗"
              f"{Color.RESET}")
        print(f"{Color.DORADO_BR}{Color.BOLD}"
              f"           ██║   █████╗  ██████╔╝██╔████╔██║█████╗  ██║   ██║"
              f"{Color.RESET}")
        print(f"{Color.DORADO_BR}{Color.BOLD}"
              f"           ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══╝  ██║   ██║"
              f"{Color.RESET}")
        print(f"{Color.DORADO_BR}{Color.BOLD}"
              f"           ██║   ███████╗██║  ██║██║ ╚═╝ ██║███████╗╚██████╔╝"
              f"{Color.RESET}")
        print(f"{Color.DORADO_BR}{Color.BOLD}"
              f"           ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝ ╚═════╝"
              f"{Color.RESET}")
        print()
        print(f"        {Color.CYAN_BR}F U L L   E N G I N E   v 2 . 0{Color.RESET}")
        print(f"        {Color.DIM}Motor Integral de Importación China -> Venezuela{Color.RESET}")
        print(f"        {Color.DIM}A2K Digital Studio | Socio Tecnológico{Color.RESET}")
        separador()
        print()

    def menu_principal(self):
        """Menú principal interactivo."""
        while True:
            self.banner()

            tasa_ef = self.cerebro.tasa_efectiva_p2p()
            brecha = self.cerebro.brecha_cambiaria_pct()
            productos = len(self.inventario.productos)
            valor_stock = self.inventario.valor_total_stock_usd()

            print(f"  {Color.DORADO}  Panel Rápido:{Color.RESET}")
            print(f"  {Color.GRIS}  Tasa Efectiva P2P: {Color.VERDE_BR}{tasa_ef:,.2f} Bs/${Color.GRIS} "
                  f"| Brecha: {Color.ROJO}{brecha:.1f}%{Color.GRIS} "
                  f"| En inventario: {Color.CYAN}{productos} productos{Color.GRIS} "
                  f"| Stock: {Color.VERDE_BR}${valor_stock:,.2f}{Color.RESET}")
            print()

            opciones = [
                ("1", "Calcular Nuevo Lote", "Motor completo con OPEX, merma, tasa real"),
                ("2", "Flete Marítimo CBM", "Cálculo de volumen y costo por naviera"),
                ("3", "Ver Inventario", "Stock actual, valor y estados"),
                ("4", "Registrar Entrada", "Agregar productos al inventario"),
                ("5", "Registrar Venta", "Registrar salida del inventario"),
                ("6", "Historial", "Movimientos y operaciones"),
                ("7", "Panel Financiero P2P", "Tasas, spread, comisiones"),
                ("8", "Configurar OPEX/Riesgo", "Gastos operativos y merma"),
                ("9", "Ejemplo Rápido", "Demo con 50 rebanadoras a $0.37"),
                ("0", "Salir", "Guardar datos y cerrar"),
            ]

            for num, nombre, desc in opciones:
                color = Color.DORADO_BR if num == "1" else Color.BLANCO
                print(f"  {color}{num}.{Color.RESET} "
                      f"{Color.BOLD}{nombre:<26}{Color.RESET} "
                      f"{Color.DIM}{desc}{Color.RESET}")

            print()
            opcion = input_str("Seleccione una opción", "1").strip()

            if opcion == "1":
                self._accion_calcular_lote()
            elif opcion == "2":
                self._accion_flete_maritimo()
            elif opcion == "3":
                self._accion_ver_inventario()
            elif opcion == "4":
                self._accion_registrar_entrada()
            elif opcion == "5":
                self._accion_registrar_venta()
            elif opcion == "6":
                self._accion_historial()
            elif opcion == "7":
                self._accion_panel_financiero()
            elif opcion == "8":
                self._accion_configurar_opex()
            elif opcion == "9":
                self._accion_ejemplo_rapido()
            elif opcion == "0":
                self._guardar()
                limpiar()
                print(f"\n  {Color.DORADO_BR}Datos guardados. Hasta la próxima, socio.{Color.RESET}\n")
                sys.exit(0)
            else:
                alerta("Opción no válida.")
                pausar()

    def _accion_calcular_lote(self):
        """Opción 1: Calcular nuevo lote."""
        resultado = self.motor.calcular_lote_interactivo()
        if resultado:
            # Guardar en historial
            self.inventario.historial.append({
                "tipo": "CALCULO_LOTE",
                "producto_nombre": resultado["nombre"],
                "cantidad": resultado["cantidad"],
                "costo_usd": resultado["costo_producto_base"],
                "precio_venta_usd": resultado["precio_venta_usd"],
                "precio_venta_bs": resultado["precio_venta_bs"],
                "ganancia_unidad_usd": resultado["ganancia_unidad_usd"],
                "metodo_pago": resultado["metodo_pago"],
                "fecha": date.today().isoformat(),
                "hora": datetime.now().strftime("%H:%M:%S"),
                "notas": f"Margen {resultado['margen_pct']:.0f}%",
            })
            self._guardar()
            pausar()

    def _accion_flete_maritimo(self):
        """Opción 2: Flete marítimo CBM."""
        limpiar()
        self.maritimo = ModuloMaritimoCBM()
        self.maritimo.configurar()

        print()
        while True:
            if not self.maritimo.agregar_producto_interactivo():
                break
            otro = input_str("Agregar otro producto? (s/N)", "n")
            if otro.lower() != "s":
                break

        resultado = self.maritimo.calcular_embarque()
        if resultado:
            limpiar()
            self.maritimo.imprimir_reporte(resultado)
            self._guardar()
        pausar()

    def _accion_ver_inventario(self):
        """Opción 3: Ver inventario."""
        limpiar()
        self.inventario.imprimir_inventario()
        pausar()

    def _accion_registrar_entrada(self):
        """Opción 4: Registrar entrada."""
        limpiar()
        self.inventario.entrada_interactiva()
        self._guardar()
        pausar()

    def _accion_registrar_venta(self):
        """Opción 5: Registrar venta."""
        limpiar()
        self.inventario.salida_interactiva()
        self._guardar()
        pausar()

    def _accion_historial(self):
        """Opción 6: Ver historial."""
        limpiar()
        self.inventario.imprimir_historial()
        pausar()

    def _accion_panel_financiero(self):
        """Opción 7: Panel financiero P2P."""
        limpiar()
        self.cerebro.imprimir_panel()
        print()
        cambiar = input_str("Modificar tasas? (s/N)", "n")
        if cambiar.lower() == "s":
            self.cerebro.configurar()
            self._guardar()
        pausar()

    def _accion_configurar_opex(self):
        """Opción 8: Configurar OPEX."""
        limpiar()
        self.opex.imprimir_panel()
        print()
        cambiar = input_str("Modificar OPEX? (s/N)", "n")
        if cambiar.lower() == "s":
            self.opex.configurar()
            self._guardar()
        pausar()

    def _accion_ejemplo_rapido(self):
        """Opción 9: Ejemplo rápido con 50 rebanadoras a $0.37."""
        limpiar()
        print(f"\n  {Color.DORADO_BR}Ejecutando ejemplo: 50 Rebanadoras a $0.37 USD{Color.RESET}")
        pausar()

        # Registrar en inventario
        self.inventario.registrar_entrada(
            nombre="Rebanadora Eléctrica R1",
            cantidad=50,
            costo_usd=0.37,
            metodo_pago="usdt",
            notas="Lote inicial - Ejemplo ZYNC Engine v2.0"
        )

        # Calcular lote
        resultado = self.motor.calcular_lote(
            nombre="Rebanadora Eléctrica R1",
            costo_usd=0.37,
            cantidad=50,
            margen_pct=40,
            metodo_pago="usdt",
            flete_total_usd=97.50,
        )

        limpiar()
        
        # Mostrar inventario actualizado
        self.inventario.imprimir_inventario()
        print()
        
        # Mostrar cálculo del lote
        self.motor.imprimir_lote(resultado)

        # Guardar
        self.inventario.historial.append({
            "tipo": "CALCULO_LOTE",
            "producto_nombre": "Rebanadora Eléctrica R1",
            "cantidad": 50,
            "costo_usd": 0.37,
            "precio_venta_usd": resultado["precio_venta_usd"],
            "precio_venta_bs": resultado["precio_venta_bs"],
            "ganancia_unidad_usd": resultado["ganancia_unidad_usd"],
            "metodo_pago": "usdt",
            "fecha": date.today().isoformat(),
            "hora": datetime.now().strftime("%H:%M:%S"),
            "notas": "Ejemplo rápido - 50 rebanadoras $0.37",
        })
        self._guardar()
        pausar()

# ═══════════════════════════════════════════════════════════════════════════════
#   PUNTO DE ENTRADA
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    """Punto de entrada principal del motor ZYNC."""
    try:
        engine = ZYNCEngine()
        engine.menu_principal()
    except KeyboardInterrupt:
        print(f"\n\n  {Color.DORADO_BR}Interrumpido por usuario. Hasta luego.{Color.RESET}\n")
        sys.exit(0)
    except Exception as e:
        error(f"Error inesperado: {e}")
        print(f"  {Color.DIM}Tipo: {type(e).__name__}{Color.RESET}")
        import traceback
        traceback.print_exc()
        pausar()

if __name__ == "__main__":
    main()
