# 🔧 MANTENIMIENTO — Nail Studio Pro

Guía rápida para modificaciones comunes. Todas las ediciones se realizan en `nail-studio-pro.html` salvo indicación contraria.

---

## 🎨 Cambiar Colores

**Archivo:** `nail-studio-pro.html` → **Líneas 14–48** (CSS Variables)

```css
:root {
  --rose: #C9956A;     /* Color principal — cambiar aquí */
  --fuchsia: #D63384;  /* Acento fucsia */
  --lila: #B388FF;     /* Lila complementario */
  --bg: #0a0a0a;       /* Fondo general */
  /* ... más variables */
}
```

> Modifica los valores hexadecimales para ajustar la paleta completa de la app.

---

## 🏪 Cambiar Nombre del Negocio

**Opción 1 — Desde la app:** Ir a **Config** y editar el nombre.

**Opción 2 — Valor por defecto en código:**
`nail-studio-pro.html` → **Línea ~3108** (función `getCfg()`)

```javascript
function getCfg() {
  return JSON.parse(localStorage.getItem('ns_config')) || {
    nombre: 'Nail Studio Pro',  // Cambiar aquí
    tasa: 50.00,
    adminPass: 'NS2026ADMIN',
    // ...
  };
}
```

---

## 💅 Agregar / Editar Servicios

**Archivo:** `nail-studio-pro.html` → **Líneas 3139–3184**

Cada servicio se define como un objeto:

```javascript
{
  id: 1,
  nombre: 'Uñas Acrílicas',
  precio: 25,
  duracion: 60,
  categoria: 'Uñas'
}
```

**9 categorías por defecto:** Uñas, Diseño, Manicura, Pedicura, Retiro, Tratamiento, depilación cejas, depilación facial, Otros.

---

## 💳 Configurar Métodos de Pago

**Opción 1 — Desde la app:** Ir a **Config** → Métodos de pago.

**Opción 2 — Desde el código:** Los métodos se configuran en la sección de Config del JavaScript.

---

## 🔑 Cambiar Contraseña de Admin

**Opción 1 — Desde la app:** Ir a **Config** → Contraseña admin.

**Opción 2 — Valor por defecto en código:**
`nail-studio-pro.html` → **Línea ~3108** (dentro de `getCfg()`)

```javascript
adminPass: 'NS2026ADMIN'  // Cambiar aquí
```

> ⚠️ Este valor solo aplica si no hay configuración guardada en localStorage.

---

## 🔐 Cambiar Salt del Sistema de Licencias

**Archivo:** `nail-studio-pro.html` → **Línea 2651**

```javascript
const SALT = 'NAILSTUDIO2026';  // Cambiar aquí
```

> ⚠️ **Importante:** Cambiar el salt invalidará todas las licencias activas existentes.

---

## 💱 Cambiar Tasa de Cambio

**Opción 1 — Desde la app:** Ir a **Config** → Tasa de cambio.

**Opción 2 — Valor por defecto:**
`nail-studio-pro.html` → **Línea ~3108** (dentro de `getCfg()`)

```javascript
tasa: 50.00  // Tasa por defecto (1 USD = 50 Bs)
```

---

## 🔄 Resetear Demo / Datos

### Resetear solo la licencia demo

```javascript
// Eliminar marcador de demo usada
Object.keys(localStorage)
  .filter(k => k.startsWith('ns_demo_used_'))
  .forEach(k => localStorage.removeItem(k));
localStorage.removeItem('ns_licencia_activa');
location.reload();
```

### Resetear TODOS los datos

```javascript
localStorage.clear();
location.reload();
```

Ejecutar en la **consola del navegador** (F12 → Console).

---

## 📱 Funciones Especiales

### Escáner QR

Integrado directamente en la app, se activa desde el módulo POS. Utiliza la cámara del dispositivo para leer códigos QR.

### Recibos por WhatsApp

Permite enviar recibos de compra directamente por WhatsApp. Configurar número destino desde el módulo Config.

### Preferencias de Forma de Uña

Las clientas pueden tener configurada su forma de uña preferida (stiletto, coffin, almond, square, round, oval, squoval). Se almacena en el perfil de cada clienta.
