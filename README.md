# 💅 Nail Studio Pro

**Sistema POS completo para nail studios y nailistas** — Agenda, clientas, servicios, materiales y caja dual $/Bs.

> Desarrollado por **A2K Digital Studio**

---

## 🚀 Despliegue

- **URL en producción:** [https://tiendadigitalaipro.github.io/nail-studio-pro/](https://tiendadigitalaipro.github.io/nail-studio-pro/)
- **Hosting:** GitHub Pages
- **Arquitectura:** 100% client-side (sin backend, sin Firebase)

---

## 📦 Archivos del Proyecto

| Archivo | Descripción |
|---|---|
| `index.html` | Punto de entrada — redirige a la app principal |
| `nail-studio-pro.html` | App principal (~4551 líneas) |
| `ns-admin-licencias.html` | Panel de administración de licencias |
| `ESTRUCTURA.md` | Mapa detallado de archivos y secciones |
| `MANTENIMIENTO.md` | Guía rápida de modificaciones comunes |

---

## ✨ Funcionalidades

| Módulo | Descripción |
|---|---|
| **Dashboard** | Resumen general del negocio |
| **POS/Cobro** | Punto de venta con carrito y checkout |
| **Agenda** | Gestión de citas y turnos |
| **Servicios** | Catálogo de servicios con 9 categorías |
| **Clientas** | Base de datos de clientas |
| **Materiales** | Control de materiales e insumos |
| **Caja** | Apertura/cierre de caja |
| **Reportes** | Estadísticas y reportes |
| **Config** | Configuración general |

### Características Especiales

- 📷 **Escáner QR** integrado
- 📲 **Recibos por WhatsApp** (envío directo)
- 💅 **Preferencias de forma de uña** (stiletto, coffin, almond, etc.)

---

## 💰 Métodos de Pago

Se soportan **10 métodos de pago** con moneda dual (**$ / Bs**).

---

## 🔐 Sistema de Licencias (IRON LOCK)

| Parámetro | Valor |
|---|---|
| **Salt** | `NAILSTUDIO2026` |
| **Admin Password** | `NS2026ADMIN` |
| **Master Codes** | `NSPRO-DEMO-2024`, `NSPRO-A2K-2026`, `NSPRO-MAST-2026` |
| **Prefijo localStorage** | `ns_` |
| **Demo** | 5 días, una sola vez por dispositivo |

---

## 📊 Datos por Defecto

- **32 servicios** preconfigurados en **9 categorías**

---

## 🎨 Identidad Visual

```css
--rose: #C9956A;     /* Dorado/rosado principal */
--fuchsia: #D63384;  /* Fucsia acento */
--lila: #B388FF;     /* Lila complementario */
```

---

## 🛠️ Stack Técnico

- HTML5 + CSS3 + JavaScript vanilla
- localStorage para persistencia de datos
- Sin dependencias externas
- Compatible con dispositivos móviles y escritorio
