# Contrato con la API (resumen para el frontend)

La API (`inventario-syp-api`) es **privada**; este documento resume lo que el frontend necesita. La fuente exacta es el **OpenAPI** que la API genera con `pnpm run openapi` en `../inventario-syp-api/docs/openapi.json`. De ahí salen los tipos de este repo:

```powershell
pnpm run api:tipos     # openapi-typescript ../inventario-syp-api/docs/openapi.json -o src/api/esquema.d.ts
```

- `src/api/esquema.d.ts` es **generado**: no se edita a mano (lo bloquean los hooks). Se regenera al empezar la parte WEB de cada sprint.
- Si un tipo no existe todavía, se pide primero en la API (otro repo) y luego se regenera. No se "inventan" campos en el front.

## 1. Base y entornos

| Entorno | El navegador llama a | Quién reenvía a la API |
|---|---|---|
| Desarrollo | `http://localhost:5173/api/inventario/v1/...` | proxy de Vite → `API_PROXY_TARGET` (por defecto `http://localhost:3000`) |
| Nube | `https://<dominio-vercel>/api/inventario/v1/...` | reescritura de `vercel.json` → Render |
| Red local | `https://<IP-del-servidor>/api/inventario/v1/...` | Caddy (`infra/Caddyfile`) → contenedor `api` |

La base **`/api/inventario/v1`** vive en una sola constante de `src/api/cliente.ts`. Siempre el mismo origen: la cookie de sesión funciona sin CORS.

## 2. Convenciones

- JSON en camelCase. **Decimales como string** (`"12.5000"`, `"3480.0000000000"`): nunca se convierten a `number` para calcular; se formatean con `lib/formato.ts` y se envían como string.
- Fechas de negocio `YYYY-MM-DD` (se muestran `dd/mm/aaaa`).
- Listados: `?pagina=1&tamano=50` → `{ datos: [...], total, pagina, tamano }`.
- Errores: `{ codigo, mensaje, detalle? }` (mensajes de pantalla en `docs/UI-UX.md` §6). Validación: 400 `VALIDACION` con `detalle.campos`.
- Todas las respuestas traen `Cache-Control: no-store`.
- Archivos (`formato=pdf|xlsx`, respaldos): respuesta binaria con `Content-Disposition: attachment; filename="…"`; se descargan como blob con `BotonDescarga`.
- Escrituras que afectan el kardex aceptan `confirmarStockNegativo: true` (ver §5).

## 3. Sesión

```
POST /auth/login {email, password}
  → 200 { accessToken, usuario: { id, email, nombre, roles: ["inventario:CONTADOR"], debeCambiarPassword } }
  + cookie de refresh HttpOnly (Path=/api/inventario/v1/auth): el front no la ve ni la toca
Cada petición: Authorization: Bearer <accessToken>        (el token vive SOLO en memoria)
401 → POST /auth/refresh  (cookie + header X-Requested-With: inventario-syp-web)
      → nuevo accessToken → se repite UNA vez la petición original
      si el refresh falla → limpiar sesión → /login
POST /auth/logout (con el mismo header) → borra la cookie
```

- **Single-flight**: si varias peticiones reciben 401 a la vez, se hace **un solo** refresh y todas esperan su resultado.
- **Sin refresh automático** para `/auth/login` ni `/auth/refresh`: un 401 ahí se muestra o lleva a `/login` (si no, se crearía un bucle). Tampoco se refresca un 401 `CREDENCIALES_INVALIDAS` en otra ruta (p. ej. contraseña actual incorrecta en `/auth/cambiar-password`): no es un token vencido.
- Login fallido: 401 `CREDENCIALES_INVALIDAS` (mismo mensaje para contraseña incorrecta y cuenta bloqueada); demasiados intentos: 429 `DEMASIADAS_SOLICITUDES`.
- Al cargar la app primero se despierta la API con `GET /salud` y luego se intenta un refresh silencioso para recuperar la sesión (si hay cookie válida).
- Nunca `localStorage` ni `sessionStorage` para tokens.
- Roles con prefijo de módulo: se consultan solo con `lib/roles.ts` → `tieneRol('inventario', 'CONTADOR')`.
- Access token de 15 min; sesión (refresh) de 12 h **desde el login** (el refresh rotado hereda el vencimiento); 5 intentos fallidos bloquean 15 min (la respuesta sigue siendo `CREDENCIALES_INVALIDAS`).
- Si el refresh responde 429 o 5xx, la sesión **no** se cierra (la API no usó la cookie); solo 401/403 la cierran.

### 3.1 Cambio de contraseña obligatorio (pendiente del S4 de la API)

- Si `usuario.debeCambiarPassword` es `true` (primer ingreso o contraseña restablecida), el usuario solo puede usar `/auth/me`, `/auth/cambiar-password` y `/auth/logout`. El resto responde **403 `CAMBIO_PASSWORD_REQUERIDO`**.
- Es 403 y **no** 401 a propósito: el cliente **no intenta refresh ni reintento**; marca la sesión con `debeCambiarPassword: true` y navega a **`/cambiar-password`**. `RutaProtegida` no deja entrar a ninguna página del módulo hasta cambiarla.
- `POST /auth/cambiar-password {actual, nueva}` (nueva: 12 a 200 caracteres) responde **200 con una sesión nueva** (`{accessToken, usuario}`) y revoca las anteriores.

### 3.2 Un solo refresh a la vez, también entre pestañas (pendiente del S4 de la API)

La cookie de refresh es **una sola para todas las pestañas** y la API la **rota** en cada uso. Si dos pestañas envían a la vez la **misma** cookie, la API lo toma como reutilización (`REFRESH_REUTILIZADO`), revoca la familia y **cierra la sesión**. Por eso (`src/api/coordinacion-pestanas.ts`):

1. Dentro de la pestaña: *single-flight* (una sola promesa de refresh compartida).
2. Entre pestañas: un candado. Se usa **`navigator.locks`** (Web Locks API, nombre `inventario-syp:refresh`). Si no existe, un **candado de respaldo con `BroadcastChannel`** (`inventario-syp:sesion`): la pestaña anuncia `refresh-iniciado` con un id aleatorio, espera 50 ms para detectar empates (gana el id menor) y avisa `refresh-terminado` al acabar; el candado de una pestaña que se cerró a medias vence a los 30 s. Si tampoco hay `BroadcastChannel`, solo queda el single-flight de la pestaña.
3. La pestaña que esperaba, al obtener el candado, hace **su propio** refresh con la cookie **ya rotada**: es secuencial, no reutilización.
4. **El access token nunca viaja entre pestañas.** Cada una guarda solo el suyo en memoria. Por el canal solo pasan avisos sin secretos: `refresh-terminado`, `logout` (cierra la sesión en todas las pestañas) y, solo en el candado de respaldo, `refresh-iniciado` con el id aleatorio. Una prueba (`cliente.test.ts`) verifica que ningún mensaje contiene el token ni datos del usuario.
5. El refresh **no** se repite ante 504 o tiempo agotado (si la API lo hubiera procesado, repetirlo con la cookie vieja sería reutilización); sí ante 502/503.

## 4. Servidor dormido (plan gratuito)

Render duerme la API tras 15 min sin uso; despertar tarda ~1 min. Ante **502, 503, 504 o tiempo agotado** (30 s por intento) el cliente reintenta con esperas crecientes (2, 4, 8, 16, 32 s) hasta ~90 s mostrando `BannerServidor`. `GET /salud` no toca la base y sirve para despertar; `GET /salud/bd` despierta también la base (Neon).

- **502/503** (la API no recibió la petición): se reintenta cualquier método.
- **504 o tiempo agotado** (la API quizá la procesó): solo se reintentan los GET y el login. Una escritura no se repite (podría duplicar un comprobante): se muestra "El servidor no respondió a tiempo. Si estabas guardando algo, revisa si se registró antes de repetirlo." (`SIN_RESPUESTA`, código propio del cliente).

## 5. Stock negativo

Si una venta, merma o ajuste deja saldo negativo, la API responde **409**:
```json
{ "codigo": "STOCK_NEGATIVO_REQUIERE_CONFIRMACION", "mensaje": "…",
  "detalle": { "productoId": 1, "fecha": "2026-03-20", "saldoResultante": "-5.0000", "disponibleAntes": "40.0000" } }
```
El front muestra `DialogoStockNegativo` y, si el usuario confirma, **reenvía la misma petición** con `"confirmarStockNegativo": true`. Con la política `BLOQUEAR` la respuesta es 409 `STOCK_INSUFICIENTE` (sin opción de confirmar).

## 6. Endpoints

Roles: **A** ADMIN · **C** CONTADOR · **S** ASISTENTE · **Q** CONSULTA · "todos" = cualquier usuario autenticado.

| Método | Ruta | Roles | Pantalla |
|---|---|---|---|
| GET | `/salud` (`{estado, version, hora, demo}`), `/salud/bd` | público | cliente (despertar) y etiqueta de demostración |
| GET | `/catalogos` | todos (**requiere token desde el S4**; sin token, 401) | selects de Tablas SUNAT 2, 5, 6, 10, 12, 14 |
| POST | `/auth/login` (`{email, password}`, solo JSON) | público | Iniciar sesión → `{accessToken, usuario}` + cookie |
| POST | `/auth/refresh` (cookie + `X-Requested-With`) | público | cliente → `{accessToken, usuario}` + cookie rotada |
| POST | `/auth/logout` (`X-Requested-With`) | autenticado | menú de usuario → 204, borra la cookie |
| GET | `/auth/me` | todos (también con cambio pendiente) | menú de usuario → `usuario` |
| POST | `/auth/cambiar-password` (`{actual, nueva}`) | todos (también con cambio pendiente) | Cambiar contraseña → sesión nueva |
| GET | `/auth/jwks` | público | futuro login central (la web no lo usa) |
| GET / POST | `/usuarios` (`?pagina&tamano`) | A | Usuarios. Crear `{email, nombre, roles}` → contraseña temporal **una sola vez** |
| PATCH | `/usuarios/:id` (`{nombre?, roles?, activo?}`) | A | Usuarios. Desactivar o cambiar roles cierra sus sesiones |
| POST | `/usuarios/:id/restablecer-password` | A | Usuarios → contraseña temporal nueva (una vez) |

En `/usuarios` los roles van **sin prefijo** (`"CONTADOR"`); en el token y en `/auth/*`, **con prefijo** (`"inventario:CONTADOR"`). Un ADMIN no puede quitarse su rol ni desactivarse, y la API nunca deja el sistema sin ADMIN. Límites: login y cambiar-password 5/min, refresh 30/min.
| GET / PATCH | `/configuracion` | todos / A (C: libro y WinConta) | Configuración |
| GET / PUT | `/configuracion/libro-modo/:anio` | todos / A, C | Configuración → Libro 12.1 |
| GET / POST / PATCH | `/establecimientos` | todos / A | Maestros |
| GET / POST / PATCH | `/productos` | todos / A, C | Maestros |
| GET | `/productos/stock` | todos | Dashboard, Kardex |
| GET / POST / PATCH | `/terceros` (`?q=&rol=`) | todos / A, C, S | Maestros, `SelectorTercero` |
| GET | `/terceros/validar-documento?tipo=&numero=` | todos | validación en vivo |
| GET / POST / PATCH | `/reglas-contables` | todos / A, C | Maestros |
| GET | `/comprobantes` · `/comprobantes/:id` | todos | Comprobantes |
| POST | `/comprobantes/compras` · `/comprobantes/ventas` | A, C, S | Compra, Venta |
| POST | `/comprobantes/mermas` (13 merma o 14 desmedro) · `/comprobantes/ajustes` | A, C | Merma o desmedro, Ajuste |
| PATCH | `/comprobantes/:id` | A, C (S: sus compras y ventas) | Comprobantes |
| POST | `/comprobantes/:id/anular` (`{motivo}`) | A, C | Comprobantes |
| POST | `/movimientos/:id/mover` (`{direccion: "ARRIBA"\|"ABAJO"}`) | A, C | Kardex |
| POST | `/comprobantes/simular-salida` | A, C, S | Venta (disponible y costo estimado) |
| GET | `/kardex?productoId&anio&mes` · `/kardex/alertas?anio` | todos | Kardex, Dashboard |
| POST | `/kardex/recalcular` | A | Kardex |
| GET | `/periodos?anio` | todos | Periodos |
| POST | `/periodos/:anio/:mes/cerrar` · `/reabrir` (`{motivo}`) | A, C | Periodos |
| POST | `/periodos/cerrar-en-bloque` | A | Periodos |
| GET / POST | `/periodos/:anio/cierre-anual/vista-previa` · `/periodos/:anio/cierre-anual` (`{confirmarReemplazo}`) | A, C | Cierre anual |
| GET / PUT | `/saldos-iniciales?anio` · `/saldos-iniciales/:id` | todos / A, C | Saldos iniciales |
| GET | `/libros/12-1?anio&mes&productoId&formato=json\|pdf` | todos | Libro 12.1 |
| GET | `/libros/12-1/prueba-margenes?formato=pdf` | A, C | Libro 12.1 |
| GET / POST | `/libros/12-1/impresiones` | todos / A, C | Libro 12.1, Periodos |
| GET | `/libros/13-1?anio&mes&productoId&detallado&formato=json\|pdf\|xlsx` | todos | Libro 13.1, Kardex |
| GET | `/reportes/toneladas` · `/costo-ventas` · `/resumen-anual` · `/margen` (`?anio&formato`) | todos | Reportes |
| GET | `/reportes/excel-contadora?anio` | A, C | Excel contadora |
| GET | `/asientos?anio&mes` (por tipo de asiento) · `/asientos/exportados?anio` | todos | Asientos |
| POST | `/asientos/winconta` (`{anio, mes, tipoAsiento, numeroAsiento, tipoCambio}`) | A, C | Asientos (descarga .xlsx) |
| GET / PUT | `/control-tonelaje?anio&formato` · `/control-tonelaje/:anio/:mes` | todos / A, C | Control de tonelaje |
| GET / POST | `/tomas-inventario` | todos / A, C | Toma de inventario |
| POST | `/tomas-inventario/:id/resolver` | A, C | Toma de inventario |
| GET | `/dashboard?anio` | todos | Dashboard |
| POST | `/importacion/historico` | A | Importación y paridad |
| GET | `/importacion/paridad?anio` | A, C | Importación y paridad, Paridad con Excel |

Con la API en modo demostración (`/salud` → `demo: true`), `/importacion/*` responde 409 `NO_DISPONIBLE_EN_DEMO`.
| GET | `/respaldo/descargar` · `/respaldo/exportar-datos` | A | Respaldo |
| GET | `/auditoria` · `/auditoria/accesos` | A | Auditoría |

## 7. Ejemplos (datos de demostración)

`POST /comprobantes/compras`
```json
{
  "tipoComprobante": "01", "serie": "F001", "numero": "123", "fecha": "2026-03-15",
  "terceroId": 2, "guiaRemision": "T001-0000456", "ticketBalanza": "B-0001",
  "lineas": [
    { "productoId": 1, "descripcion": "Chatarra pesada", "cantidad": "10.0000", "costoUnitario": "100.000000" },
    { "productoId": 2, "descripcion": "Chatarra inox B", "cantidad": "2.5000", "costoUnitario": "1000.000000" }
  ]
}
```

`POST /comprobantes/ventas` (exportación en dólares)
```json
{
  "tipoComprobante": "01", "serie": "E001", "numero": "45", "fecha": "2026-03-20",
  "terceroId": 5, "tipoOperacion": "17", "moneda": "USD", "tipoCambio": "3.700",
  "lineas": [ { "productoId": 2, "descripcion": "Contenedor 1x20", "cantidad": "20.0000", "valorVentaUnitario": "900.00" } ]
}
```

Respuesta 201 de cualquier escritura: el comprobante con sus líneas y, por cada kardex afectado, `{ productoId, anio, saldoFinal: { cantidad, costoTotal, costoUnitario }, alertas: [...] }` → invalidar en TanStack Query: kardex, stock, dashboard, periodos y comprobantes.
