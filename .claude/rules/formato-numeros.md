---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Números, importes y fechas en el frontend

- La API envía y recibe decimales como **string** (`"12.5000"`). Se muestran con `src/lib/formato.ts` y se envían como string. Nunca `Number(...)`, `parseFloat`, `toFixed` ni aritmética de `number` sobre cantidades o importes.
- Las vistas previas (importe de una línea, total del formulario) se calculan con **big.js** y se rotulan como vista previa: el valor oficial lo devuelve la API.
- Formato es-PE: miles con coma y decimales con punto (`1,234.56`). Toneladas con 4 decimales, soles con 2 (`S/ 1,234.56`), CU con 2 (4 en el detalle), tipo de cambio con 3. Negativos con signo menos, en `text-destructive` y con ícono (nunca ocultos ni entre paréntesis).
- Celdas numéricas alineadas a la derecha con `tabular-nums`.
- Fechas de negocio `YYYY-MM-DD` ↔ `dd/mm/aaaa` partiendo el texto; nunca `new Date('YYYY-MM-DD')` (se corre un día por la zona horaria). Periodos: "Marzo 2026", con "Setiembre".
- Documentos: `F001-0000123` (número con 7 dígitos), RUC y cuentas en `font-mono`.
- `CampoDecimal` acepta coma o punto, limita decimales (4 TN, 6 precios, 3 tipo de cambio) y entrega string normalizado con punto.
