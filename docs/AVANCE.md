# AVANCE — inventario-syp-web

> Bitácora del frontend. Claude Code la lee al empezar cada sesión y la actualiza al terminar cada sprint (`/cerrar-sprint`).
> Formato por sprint: qué se hizo · decisiones · pendientes · cómo probar.
> La bitácora general del proyecto y las evidencias del TAP están en el repo privado de la API (`../inventario-syp-api/docs/AVANCE.md` y `../inventario-syp-api/docs/tap/`).

## Estado actual

| Sprint | Estado | Rama | Fecha de cierre |
|---|---|---|---|
| S0 Preparación | ⏳ en curso | — | |
| S5 Base de la web | pendiente | `sprint/05-base-web` | |
| S6 Nube temprana (WEB) | pendiente | `sprint/06-nube` | |
| S7 Maestros (WEB) | pendiente | `sprint/07-maestros` | |
| S8 Operaciones (WEB) | pendiente | `sprint/08-operaciones` | |
| S9 Kardex y periodos (WEB) | pendiente | `sprint/09-kardex-periodos` | |
| S10 Libros y reportes (WEB) | pendiente | `sprint/10-libros-reportes` | |
| S11 Contabilidad y control (WEB) | pendiente | `sprint/11-contabilidad-control` | |
| S12 Dashboard y datos (WEB) | pendiente | `sprint/12-dashboard-datos` | |
| S13 Calidad y entrega (WEB) | pendiente | `sprint/13-calidad-entrega` | |

## Línea base (kit inicial, 08/10/2026)

- `CLAUDE.md`, `docs/UI-UX.md` (diseño y pantallas), `docs/CONTRATO-API.md`, `vercel.json`, `infra/` (Docker y Caddy para la red local) y la configuración de Claude Code con protección de datos reales (`node .claude/hooks/probar-hooks.mjs` → Hooks OK; `node scripts/revisar-datos-publicos.mjs` → SIN DATOS REALES).
- El código se genera desde el Sprint 5 (prompts en `../inventario-syp-api/docs/11-PROMPTS-CLAUDE-CODE.md`).

## Bitácora

<!-- /cerrar-sprint agrega aquí una sección por sprint -->
