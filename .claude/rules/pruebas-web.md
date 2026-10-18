---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "e2e/**"
  - "vitest.config.*"
  - "playwright.config.*"
---

# Pruebas del frontend (Vitest 4 + Testing Library + jsdom · Playwright 1.64)

- **Solo datos de demostración** (`docs/UI-UX.md` §10): RUC `20000000001`, `20000000010`, `20000000028`, `10000000006`; DNI `00000001`; "PROVEEDOR DEMO S.A.C.", "CLIENTE DEMO S.A.C."; usuarios `*.demo@syp.invalid`. Los hooks bloquean cualquier otro RUC, DNI o correo personal.
- Pruebas junto al código (`*.test.ts(x)`), nombres en español que describen el comportamiento ("muestra el diálogo de stock negativo y reenvía con confirmación").
- Consultar por rol y texto accesible (`getByRole`, `getByLabelText`), no por clases CSS. Interacciones con `user-event`.
- Mock de la red en el borde (`fetch` o el cliente de `src/api/cliente.ts`); nada de llamadas reales en pruebas unitarias.
- Cubrir siempre: estados de carga, vacío y error; validaciones en español; envío con decimales como string; errores 409/422 por `codigo`; permisos (CONSULTA no ve acciones de escritura).
- `cliente.ts`: refresh single-flight (varias 401 → un solo refresh), un solo reintento y modo "Despertando el servidor…".
- E2E (Sprint 13, carpeta `e2e/`): contra la API local levantada con la base de **demostración** (en la API: `pnpm run db:demo` y `pnpm run start:demo`); usuarios `*.demo@syp.invalid` y contraseña desde la variable de entorno `E2E_PASSWORD` (nunca escrita en el código ni en archivos). Nunca contra la nube ni con datos reales; capturas solo de la base de demostración.
- Sin `.only` ni `.skip` en lo que se commitea.
