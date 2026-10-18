---
paths:
  - "src/componentes/**"
  - "src/funcionalidades/**"
  - "src/app/**"
  - "src/estilos/**"
---

# Componentes y pantallas (detalle en `docs/UI-UX.md`)

- Cada pantalla sigue su sección de `docs/UI-UX.md` §5; rutas y roles de §3; componentes comunes de §4 (reutilizar antes de crear).
- Estilos solo con tokens de shadcn (`bg-primary`, `bg-muted`, `text-muted-foreground`, `text-destructive`, `bg-success`, `text-warning`…). Nada de colores hexadecimales, estilos en línea ni fuentes externas.
- `src/componentes/ui/` es de shadcn: solo ajustes de estilo; la lógica va en `comunes/` o en la funcionalidad.
- Permisos con `tieneRol('inventario', …)` de `lib/roles.ts`: lo que no se puede hacer no se muestra.
- Estados completos en cada pantalla: carga (esqueleto), vacío (con acción), error (mensaje del `codigo` de §6 + Reintentar), éxito (toast), servidor dormido (`BannerServidor`).
- Mutaciones con TanStack Query; después de escribir, invalidar kardex, stock, dashboard, periodos y comprobantes según corresponda. 409 `STOCK_NEGATIVO_REQUIERE_CONFIRMACION` → `DialogoStockNegativo` y reenvío con `confirmarStockNegativo: true`.
- Formularios: react-hook-form + zod (mensajes en español), "Guardar" deshabilitado mientras envía, `Alt+N` nueva línea, `Ctrl+Enter` guardar, foco en el primer error.
- Accesibilidad §7: `<label>` siempre, `aria-describedby` en errores, foco visible, teclado completo, `aria-sort` y `caption` en tablas, alertas con ícono **y** texto, `aria-live` para mensajes.
- Textos de interfaz en español (Perú), con los nombres que usa la contadora (SALDO INICIAL, COSTO DE VENTAS, TOTAL SALIDAS VALORIZADAS).
- Sin `any`, `dangerouslySetInnerHTML` ni `console.log`.
