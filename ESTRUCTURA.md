# 📁 ESTRUCTURA — Nail Studio Pro

Mapa completo de archivos y secciones de código.

---

## 🗂️ Archivos

| Archivo | Líneas | Descripción |
|---|---|---|
| `index.html` | — | Punto de entrada. Redirige automáticamente a `nail-studio-pro.html` |
| `nail-studio-pro.html` | ~4551 | App principal (CSS + HTML + JS en un solo archivo) |
| `ns-admin-licencias.html` | ~449 | Panel de administración de licencias |

---

## 📐 nail-studio-pro.html — Mapa General

El archivo está organizado en tres grandes bloques:

| Bloque | Líneas aprox. | Tamaño |
|---|---|---|
| **CSS** | 1–1374 | ~1374 líneas |
| **HTML** | ~1375–2614 | ~1240 líneas |
| **JavaScript** | ~2615–4551 | ~1937 líneas |

---

## 🎨 CSS (Líneas 1–1374)

| Líneas | Sección |
|---|---|
| 1–13 | Meta tags, título, fuentes externas |
| **14–48** | **Variables CSS** (colores, fuentes, spacing) |
| 49–1374 | Estilos generales, componentes, tarjetas, tablas, modales |

---

## 🏗️ HTML (Líneas ~1375–2614)

La interfaz contiene **11 modales** y secciones para cada módulo:

| Sección | Módulo |
|---|---|
| Dashboard | Resumen general |
| POS/Cobro | Punto de venta |
| Agenda | Gestión de citas |
| Servicios | Catálogo de servicios |
| Clientas | Base de datos |
| Materiales | Inventario de insumos |
| Caja | Arqueo de caja |
| Reportes | Estadísticas |
| Config | Configuración |
| Modal 1–11 | Diálogos y formularios |

---

## ⚙️ JavaScript (Líneas ~2615–4551)

| Líneas | Sección |
|---|---|
| **~2623** | **DB helper** — Función de acceso a localStorage |
| **2645–2974** | **Sistema de licencias IRON LOCK** |
| ~2975–3107 | Utilidades y funciones auxiliares |
| **~3108** | **getCfg()** — Configuración por defecto (nombre, admin pass, tasa) |
| 3109–3138 | Funciones de inicialización |
| **3139–3184** | **Datos por defecto** (32 servicios, 9 categorías) |
| 3185–3400 | Lógica POS y carrito |
| 3401–3600 | Lógica Agenda |
| 3601–3800 | Clientas y Servicios CRUD |
| 3801–4000 | Materiales e inventario |
| 4001–4200 | Caja y Reportes |
| 4201–4400 | QR Scanner y WhatsApp |
| 4401–4551 | Event listeners y configuración final |

---

## 🔧 ns-admin-licencias.html — Mapa (~449 líneas)

| Líneas | Sección |
|---|---|
| 1–200 | HTML y estilos del panel admin |
| ~200–350 | Lógica de validación y autenticación |
| 351–449 | Gestión de licencias y funciones CRUD |

---

## 🗄️ Claves localStorage

| Prefijo | Clave | Descripción |
|---|---|---|
| `ns_` | `ns_licencia_activa` | Estado de licencia |
| `ns_` | `ns_demo_used_{deviceId}` | Control de demo usada por dispositivo |
| `ns_` | `ns_config` | Configuración general |
| `ns_` | `ns_servicios` | Servicios personalizados |
| `ns_` | `ns_clientas` | Base de datos de clientas |
| `ns_` | `ns_materiales` | Inventario de materiales |
| `ns_` | `ns_ventas` | Historial de ventas |
| `ns_` | `ns_caja` | Estado de caja |
| `ns_` | `ns_agenda` | Citas y turnos |

> Para resetear toda la app: `localStorage.clear()` en consola del navegador.
