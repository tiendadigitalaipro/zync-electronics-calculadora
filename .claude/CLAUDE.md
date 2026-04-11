# CLAUDE.md — Nail Studio Pro (A2K Digital Studio)

## ROL DEL AGENTE
Eres el Agente Técnico Senior de Nail Studio Pro, app POS para nail studios venezolanos, desarrollada por A2K Digital Studio.

## ARCHIVO PRINCIPAL
`nail-studio-pro.html` — monolítico (~4200 líneas, ~175KB). Todo CSS + JS inline.

## ESTRUCTURA
```
nail-studio-pro/
├── nail-studio-pro.html     <- App principal (ARCHIVO ÚNICO)
├── ns-admin-licencias.html  <- Panel admin de licencias
├── index.html               <- Redirect a nail-studio-pro.html
├── README.md
└── .claude/
    └── CLAUDE.md            <- Este archivo
```

## DISEÑO
- Tema: Dark elegant con rose/fuchsia/lila/gold
- Variables: --rose #C9956A, --fuchsia #D63384, --lila #B388FF, --gold #F4C97A
- Fuentes: Playfair Display (display), Inter (body), JetBrains Mono (mono)
- NO simplificar ni reemplazar el diseño visual

## IRON LOCK
- Registro primera vez -> login sesiones posteriores
- PRO: NS-PRO-DEVHASH6-RAND4-CHECK4 (vinculada a Device ID)
- DEMO: NS-DEMO-RAND6-CHECK4 (5 días, sin vincular a device)
- MASTER codes: NSPRO-DEMO-2024, NSPRO-A2K-2026, NSPRO-MAST-2026

## PAGINAS
| ID | Modulo |
|---|---|
| dashboard | Dashboard / Resumen |
| pos | Cobro / POS |
| historial | Historial de ventas |
| agenda | Agenda semanal |
| servicios | Catalogo de servicios |
| clientas | Gestion de clientas |
| materiales | Inventario de materiales |
| caja | Gestion de caja |
| reportes | Reportes y analisis |
| config | Configuracion |

## STORAGE
Todo en localStorage via funcion `DB`:
- `ns_cuenta` — datos del salon/usuario
- `licencia_activa` — licencia en uso
- `servicios` — catalogo de servicios
- `clientas` — clientas registradas
- `citas` — agenda de citas
- `ventas` — historial de cobros (POS + agenda)
- `materiales` — inventario
- `caja_actual` — turno de caja actual
- `caja_historial` — cierres anteriores
- `config` — configuracion del sistema
- `licencias_generadas` — licencias generadas por admin

## FUNCIONES CLAVE
| Funcion | Descripcion |
|---|---|
| `showPage(page, el)` | Navega entre paginas |
| `renderDashboard()` | Renderiza dashboard con badges |
| `renderHistorial()` | Historial de ventas con filtros |
| `renderAgenda()` | Agenda semanal |
| `renderServicios()` | Lista servicios (usa IDs: serv-buscar, serv-cat-filtro) |
| `renderClientas()` | Grid de clientas (usa ID: cli-buscar) |
| `renderMateriales()` | Tabla materiales (usa IDs: mat-buscar, mat-cat-filtro) |
| `renderCaja()` | Estado de caja |
| `renderReportes()` | Reportes con filtros |
| `renderConfig()` | Config del salon |
| `confirmarCobroNS()` | Procesa cobro POS — muestra recibo |
| `guardarCita()` | Guarda cita en agenda |
| `verClienta(id)` | Abre ficha completa de clienta |
| `mostrarInfoLicencia()` | Modal con info de licencia |
| `exportarDatos()` | Backup JSON |
| `importarDatos(input)` | Restore JSON |

## BUGS CORREGIDOS (2026-04-06)
1. IDs de busqueda unificados: serv-buscar, cli-buscar, mat-buscar, serv-cat-filtro, mat-cat-filtro
2. Aliases de navegacion agenda: semanaAnterior(), semanaHoy(), semanaSiguiente()
3. renderAgenda() usa gel('agenda-rango-fecha') correctamente
4. guardarCita() lee estado del select cita-estado
5. renderMateriales() tiene columna Estado (8 columnas)
6. filtrarServicios(), filtrarClientas(), filtrarMateriales() implementadas
7. autoFillCita() muestra info de clienta con sus preferencias
8. mostrarInfoLicencia() implementada
9. exportarReporte() CSV correcto (resuelve clienta desde clientaId, servicio desde items o citaId)
10. renderCaja() usa IDs correctos del HTML
11. abrirMovimientoCaja() es alias de abrirMovCaja()

## MEJORAS IMPLEMENTADAS (2026-04-06)
1. Pagina Historial de Ventas (#page-historial) con filtros, stats y tabla
2. Ficha completa de clienta (#modalFichaClienta) con historial, total gastado, WA
3. Alertas de stock bajo en Dashboard con badge en sidebar
4. Modal Recibo (#modalRecibo) con print CSS despues de cobro POS
5. Boton WhatsApp en clienta cards
6. Badge agenda (citas pendientes hoy) en sidebar
7. Config completa: admin password, backup/restore, licencias, hardware
8. Exportar/importar datos JSON

## REPOSITORIO
- Repo: `tiendadigitalaipro/nail-studio-pro`
- URL: `https://github.com/tiendadigitalaipro/nail-studio-pro`
- Branch: `main`
- Ruta local: `C:\Users\ASUS\Desktop\nail-studio-pro\`

## REGLAS
- Usar `gel()` para getElementById
- Usar `DB.get()` y `DB.set()` para localStorage
- No eliminar CSS ni funciones existentes
- Mantener el diseno dark con colores rose/fuchsia/lila/gold
- NUNCA modificar Iron Lock
