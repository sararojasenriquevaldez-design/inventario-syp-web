# AVANCE — inventario-syp-web

> Bitácora del frontend. Claude Code la lee al empezar cada sesión y la actualiza al terminar cada sprint (`/cerrar-sprint`).
> Formato por sprint: qué se hizo · decisiones · pendientes · cómo probar.
> La bitácora general del proyecto y las evidencias del TAP están en el repo privado de la API (`../inventario-syp-api/docs/AVANCE.md` y `../inventario-syp-api/docs/tap/`).

## Estado actual

| Sprint | Estado | Rama | Fecha de cierre |
|---|---|---|---|
| S0 Preparación | ✅ terminado (ver la bitácora de la API) | — | 18/10/2026 |
| S5 Base de la web | ✅ terminado | `sprint/05-base-web` | 25/10/2026 |
| S5 Corrección del CI (fix-ci) | ✅ terminado | `sprint/05-fix-ci` | 25/10/2026 |
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

### S05 — base-web (25/10/2026)

Rama `sprint/05-base-web`.

**Qué se hizo**
- Plantilla `create-vite@9.2.1` (react-ts) movida a la raíz sin tocar los archivos del kit; `.gitignore` fusionado. Vite 8.3.5, React 19.3, oxlint 1.89.
- `package.json`: `inventario-syp-web`, `packageManager: pnpm@12.10.1`, `engines.node: 24.x`, TypeScript **5.9.3** con `"strict": true` explícito en `tsconfig.app.json` y `tsconfig.node.json` (`pnpm exec tsc -b` sin errores). Alias `@/*` → `src/*`. Scripts `test`, `test:cov`, `api:tipos` y `revisar:datos`.
- Dependencias con las versiones del plan: react-router 8.4.0, TanStack Query 5.104.1, TanStack Table 8.21.3, zod 4.6.5, react-hook-form 7.89.0, @hookform/resolvers 5.9.1, sonner 2.0.8, recharts 3.10.1, big.js 7.0.1, lucide-react; dev: tailwindcss y @tailwindcss/vite 4.3.3, vitest y @vitest/coverage-v8 4.1.11, Testing Library, jsdom, openapi-typescript 7.13.0. Ningún paquete nuevo en `allowBuilds`.
- Tailwind 4 con `@tailwindcss/vite` (sin `tailwind.config.js`) y **shadcn 4.22.1** (`init --base=radix --preset=nova`, sin preguntas). Los 30 componentes de `docs/UI-UX.md` §4 en `src/componentes/ui/`, todos disponibles (ninguno reemplazado). Tokens de §2 en `src/estilos/globals.css` (claro y `.dark`, `success`/`warning` registrados, `--radius`, pila del sistema, foco de 2 px con `--ring`).
- Router en modo datos (`src/app/router.tsx`): `/login`, `/cambiar-password`, `/` → `/inventario`, todas las rutas de §3 con sus roles (`src/app/paginas.ts` es la única definición, la usan el router y el menú) y `*` → Página no encontrada. Las pantallas que faltan muestran "En construcción · Sprint N".
- `src/api/cliente.ts`: base `/api/inventario/v1`, token solo en memoria (`lib/sesion.ts`), refresh single-flight + candado entre pestañas (`coordinacion-pestanas.ts`), un reintento tras 401, `CAMBIO_PASSWORD_REQUERIDO` → `/cambiar-password` sin refresh, errores `{codigo, mensaje, detalle}` → `ErrorApi` y mensajes de §6 (`lib/errores.ts`), "Despertando el servidor…" (`estado-servidor.ts` + `BannerServidor`). Tipos de `src/api/esquema.d.ts` generados con `pnpm run api:tipos`.
- `lib/formato.ts` (big.js, es-PE, fechas partiendo el texto, "Setiembre") y `lib/roles.ts` (`tieneRol('inventario', 'CONTADOR')`).
- Pantallas: Iniciar sesión, Cambiar contraseña (obligatoria si `debeCambiarPassword`, con indicador de seguridad en texto y barra), layout con Sidebar plegable a íconos filtrado por rol, encabezado con migas y menú de usuario (Cambiar contraseña, Tema claro/oscuro, Salir) e Inicio vacío.
- `vite.config.ts`: proxy `/api` → `API_PROXY_TARGET` con `loadEnv(mode, cwd, '')` (por defecto `http://localhost:3000`), también en `preview`; configuración de Vitest (jsdom).
- CI: `.github/workflows/ci.yml` copiado de `docs/referencia/ci-web.yml`.
- `docs/CONTRATO-API.md`: §3.1 `CAMBIO_PASSWORD_REQUERIDO`, §3.2 refresh entre pestañas, reglas de reintento de §4, `/auth/*` y `/usuarios` completos, y `/catalogos` con token.

**Decisiones**
- **Refresh entre pestañas**: `navigator.locks` y, si no existe, un candado con `BroadcastChannel`. El token **no viaja** por ningún canal: cada pestaña hace su propio refresh, de una en una. Por el canal solo pasan `refresh-terminado`, `logout` y, en el respaldo, `refresh-iniciado` con un id aleatorio (necesario para que el candado funcione sin Web Locks). Una prueba verifica que ningún mensaje contiene el token ni datos del usuario.
- **Reintentos**: 502/503 se repiten siempre; 504 o tiempo agotado solo en GET y login. Una escritura no se repite, para no duplicar comprobantes. El refresh tampoco se repite ante 504, porque reenviar una cookie ya rotada sería reutilización. Al abrir la app primero se despierta la API con `GET /salud` y después se hace el refresh silencioso.
- Un 401 `CREDENCIALES_INVALIDAS` nunca dispara refresh (tampoco en `cambiar-password`); un refresh con 429/5xx no cierra la sesión.
- **shadcn**: el CLI usa el paquete `cn` (oficial de shadcn: repositorio `shadcn-ui/cn`, reemplaza a clsx + tailwind-merge), `radix-ui`, `cmdk`, `class-variance-authority`, `tw-animate-css` y `shadcn` (su `tailwind.css`). Quitados: `@fontsource-variable/geist` (§2 pide la pila del sistema) y `next-themes` (inyecta un script en línea que la CSP bloquea): `ui/sonner.tsx` usa `app/tema.ts`. Ajustes en `ui/`: textos para lectores de pantalla en español (Cerrar, Más, Anterior/Siguiente, menú), Sidebar de 240 px y spinner "Cargando".
- El hook `vigilar-comandos.mjs` lee `vite` (en `init -t vite`) y `sonner` (en `add sonner`) como paquetes sin versión: se usaron `--template=vite` y `@shadcn/sonner`, que son equivalentes. No se tocó el hook; el equipo puede decidir si lo ajusta para `pnpm dlx shadcn@4 …`.
- `public/favicon.svg` de Vite reemplazado por un ícono propio: una coordenada de su trazo coincidía con un importe de la lista privada (falso positivo de `revisar:datos`).
- Carpetas que no están en el mapa de `CLAUDE.md`: `src/hooks/` (la crea shadcn: `use-mobile.ts`) y `src/pruebas/` (configuración y dobles de prueba).
- El tema (`inventario-syp:tema`) es lo único que va a `localStorage`.

**Pendientes**
- Selector de periodo y chip Abierto/Cerrado de la barra superior: con Periodos (S9). Etiqueta "DEMOSTRACIÓN": S13.
- Bundle de 689 kB: dividir con rutas *lazy* cuando existan pantallas reales (S7–S8).
- Revisión `revisor-ux` de Login, Cambiar contraseña y layout (contraste del foco en ambos temas).
- Advertencias de oxlint solo en archivos de shadcn (`only-export-components`, `set-state-in-effect`): sin cambios, porque `ui/` solo admite ajustes de estilo.

**Cómo probar**
```
pnpm install ; pnpm run lint ; pnpm test ; pnpm run build ; pnpm run revisar:datos
node .claude/hooks/probar-hooks.mjs
pnpm run dev  →  http://localhost:5173/login   (con la API en http://localhost:3000)
```
1. Con la base de demostración de la API (`pnpm run db:demo` y `pnpm run start:demo`) entra con `contadora.demo@syp.invalid` (o `admin@syp.invalid` en dev). Con una contraseña incorrecta debe salir "Correo o contraseña incorrectos…".
2. Si es el primer ingreso, la app lleva a Cambiar contraseña y no deja navegar hasta cambiarla (mínimo 12 caracteres).
3. En Inicio, el menú muestra solo lo que permite el rol (`consulta.demo@syp.invalid` no ve Compra, Merma ni Administración). Kardex muestra "En construcción · Sprint 9".
4. F5 mantiene la sesión (refresh silencioso). Con dos pestañas recargadas casi a la vez, ninguna pierde la sesión. **Salir** en una cierra también la otra.
5. Tema oscuro desde el menú de usuario; foco visible al recorrer con Tab.

**Números**: 61 pruebas en 8 archivos (cliente 20, coordinación 6, formato 9, roles 4, errores 5, login 8, ruta protegida 5, menú 4). Cobertura total 74 % de líneas; `cliente.ts` 92 %, `formato.ts` 100 %.

### S05 — fix-ci (25/10/2026)

Rama `sprint/05-fix-ci`. Corrige el CI de `main`, que falló en `pnpm audit --prod --audit-level high` con 2 vulnerabilidades altas:
- `zod` < 4.6.6 (GHSA-mrhx-c7xc-m3w5): por la dependencia directa `zod@4.6.5` y por `shadcn`.
- `body-parser` >= 2.0.0 < 2.4.0 (GHSA-27r3-jxmh-p828): solo por `shadcn` > `@modelcontextprotocol/sdk` > `express`.

**Qué se hizo**
- `shadcn` 4.22.1 pasa de `dependencies` a `devDependencies` (`pnpm remove shadcn` y `pnpm add -D shadcn@4.22.1`). Al reinstalarse, `body-parser` quedó en 2.4.0 (ya corregida).
- `zod` 4.6.5 → **4.6.6** (`pnpm add zod@4.6.6`); queda una sola versión en el árbol.
- `vitest` y `@vitest/coverage-v8` 4.1.11 → **4.1.12** (`pnpm add -D vitest@4.1.12 @vitest/coverage-v8@4.1.12`): corrige 2 moderadas solo de desarrollo en `@vitest/mocker` 4.1.11 (GHSA-qxg6-89mg-rqv8 y GHSA-xp26-3454-mjgp).
- Resultado: `pnpm audit --prod --audit-level high` y `pnpm audit` completo → sin vulnerabilidades.

**Decisiones**
- `shadcn` es un CLI: en el código solo aparece en `src/estilos/globals.css` (`@import "shadcn/tailwind.css"`), que Tailwind incorpora al CSS al compilar; el navegador nunca carga el paquete. Estaba en `dependencies` y por eso todo su árbol (servidor MCP, express…) contaba como producción. El CSS compilado sigue incluyendo las variantes `data-open`/`data-closed`, los tokens y `tw-animate-css`.
- Revisión de `dependencies`: ninguna otra herramienta de línea de comandos. `cn` trae un binario, pero es la librería de clases que importan los componentes de `ui/` y `lib/utils.ts`: se queda.
- Las moderadas de `@vitest/mocker` se resolvieron subiendo vitest dentro de la línea 4.1 del stack, **sin override**: un override habría desalineado los paquetes de vitest.

**Pendientes**
- Ninguno propio de esta corrección. Siguen los pendientes de S05 — base-web.

**Cómo probar**
```
pnpm install ; pnpm audit ; pnpm audit --prod --audit-level high
pnpm run lint ; pnpm test ; pnpm run test:cov ; pnpm run build ; pnpm run revisar:datos
node .claude/hooks/probar-hooks.mjs
pnpm run dev  →  http://localhost:5173/login   (con la API en http://localhost:3000)
```
1. Los dos `pnpm audit` deben decir "No known vulnerabilities found".
2. Con la base de demostración de la API, entra con `contadora.demo@syp.invalid` y abre el menú de usuario: se despliega con animación y los estilos son los mismos que antes (los aporta `shadcn/tailwind.css` aunque ahora sea dependencia de desarrollo).
3. En GitHub → Actions, el CI de `main` queda en verde.

**Números**: 61 pruebas en 8 archivos, todas en verde; cobertura 74,6 % de líneas (`cliente.ts` 91,8 %, `formato.ts` 100 %).
