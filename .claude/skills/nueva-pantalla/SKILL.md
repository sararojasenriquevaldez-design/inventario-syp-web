---
name: nueva-pantalla
description: Crea una pantalla del frontend siguiendo docs/UI-UX.md (ruta y roles, componentes comunes, formatos, estados, accesibilidad, datos de demostración y pruebas). Úsala cuando haya que construir o rehacer una pantalla del módulo /inventario.
argument-hint: "<sección de UI-UX §5 o ruta>  (ej.: 5.3 Registrar compra, /inventario/kardex)"
arguments: [pantalla]
---

# Nueva pantalla: $ARGUMENTS

Antes de escribir código:
1. Lee `docs/UI-UX.md`: §3 (ruta y roles), §4 (componentes), la sección de §5 de **$pantalla**, §6 (mensajes), §7 (accesibilidad) y §9 (formatos).
2. Lee `docs/CONTRATO-API.md` y busca en `src/api/esquema.d.ts` los tipos de los endpoints que usa. Si falta un endpoint o un campo, **detente**: se pide primero en la API (otro repo) y luego `pnpm run api:tipos`. No inventes campos.
3. Presenta el **plan** (archivos, componentes reutilizados, consultas y mutaciones, pruebas) y espera el OK.

## Estructura
```
src/funcionalidades/<modulo>/
├─ paginas/<Pantalla>Pagina.tsx      # la ruta: compone y orquesta
├─ componentes/                       # piezas propias del módulo
├─ consultas.ts                       # useQuery/useMutation con claves por recurso y filtros
├─ esquemas.ts                        # zod con mensajes en español (decimales como string)
└─ *.test.tsx                         # Vitest + Testing Library
```
Registra la ruta en `src/app/router.tsx` dentro de `RutaProtegida` con los roles de §3 y agrega el ítem al menú si corresponde.

## Reglas
- Reutiliza `src/componentes/comunes` (`TablaDatos`, `Cifra`, `CampoDecimal`, `CampoFecha`, `SelectorTercero`, `SelectorProducto`, `DialogoConfirmacion`, `DialogoStockNegativo`, `BotonDescarga`, `EstadoVacio`, `EstadoError`). Si creas uno nuevo y es reutilizable, va a `comunes/` con su prueba.
- Números con `lib/formato.ts`; decimales siempre string; vistas previas con big.js; nada de `Number(...)` sobre importes.
- Acciones visibles solo con permiso (`tieneRol('inventario', …)`); la API igual valida.
- Estados completos: carga (esqueleto), vacío (con acción), error (mensaje del `codigo` + Reintentar), éxito (toast) y servidor dormido.
- Después de una mutación: invalidar kardex, stock, dashboard, periodos y comprobantes según corresponda.
- Accesibilidad §7: labels, `aria-describedby`, foco, teclado, `aria-sort`, nada solo por color.
- **Datos de demostración** (§10) en pruebas y mocks. Nunca datos reales.

## Pruebas mínimas
- Render con datos de demostración (mock de `fetch` o del cliente) y estados de carga, vacío y error.
- Formulario: validaciones en español, envío correcto (decimales como string) y 409 de negocio (periodo cerrado, duplicado, stock negativo con su diálogo).
- Permisos: un usuario CONSULTA no ve los botones de escritura.

## Al terminar
`pnpm run lint`, `pnpm test`, `pnpm run build` y `pnpm run revisar:datos` en verde. Resume cómo probarla (URL, usuario de demostración y pasos) y sugiere pedir al subagente `revisor-ux` una revisión si la pantalla es de las principales (compra, venta, kardex, libro 12.1, asientos).
