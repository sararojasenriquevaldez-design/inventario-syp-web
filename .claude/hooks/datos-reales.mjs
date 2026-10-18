// Detector de datos reales para el repo PÚBLICO inventario-syp-web.
//
// Este archivo NO contiene ningún dato real. Busca:
//   1. Números con forma de RUC (11 dígitos que empiezan con 10, 15, 16, 17 o 20) que no sean de demostración.
//   2. DNI escritos junto a la palabra "DNI" que no sean de demostración.
//   3. Correos que no sean de demostración (se aceptan solo @syp.invalid, dominios .invalid/.test/.example,
//      example.com/.org/.net y las direcciones noreply de GitHub).
//   4. Lo REAL de S&P que lee en tiempo de ejecución del repo privado hermano (../inventario-syp-api/data), solo si
//      existe en esta PC: RUC y DNI, razones sociales, comprobantes (serie-número) e importes y cantidades
//      característicos (no redondos: importes de 4 o más cifras con céntimos y cantidades con 4 decimales).
// Lo usan el hook proteger-archivos.mjs (antes de escribir) y scripts/revisar-datos-publicos.mjs (CI y cierre).
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** RUC de demostración permitidos: 20000000001, 20000000010, 20000000028, 10000000006 (dígito verificador válido). */
export const RUC_DEMO = /^(10|20)0{7}\d{2}$/;
/** DNI de demostración permitidos: 00000001 … 00000009. */
export const DNI_DEMO = /^0{7}\d$/;

const PATRON_RUC = /(?<![\d])(?:10|15|16|17|20)\d{9}(?![\d])/g;
const PATRON_DNI = /\bDNI\b[^\d\n]{0,12}(\d{8})(?!\d)/gi;
const PATRON_CORREO = /[A-Za-z0-9._%+-]+@((?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,})/g;
const DOMINIOS_PERMITIDOS = /^(syp\.invalid|example\.(com|org|net)|users\.noreply\.github\.com|noreply\.github\.com|.*\.(invalid|test|example|localhost))$/i;
const CORREOS_PERMITIDOS = new Set(['noreply@anthropic.com']); // coautor que agrega Claude Code en los commits
const PATRON_COMPROBANTE = /\b([A-Z][A-Z0-9]{2,3})-0*(\d{1,8})\b/g;
const PATRON_NUMERO = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d+/g;

/** Separa una línea CSV respetando comillas dobles. */
function partirCsv(linea) {
  const campos = [];
  let actual = '';
  let enComillas = false;
  for (let i = 0; i < linea.length; i += 1) {
    const c = linea[i];
    if (enComillas) {
      if (c === '"' && linea[i + 1] === '"') { actual += '"'; i += 1; }
      else if (c === '"') enComillas = false;
      else actual += c;
    } else if (c === '"') enComillas = true;
    else if (c === ',') { campos.push(actual); actual = ''; }
    else actual += c;
  }
  campos.push(actual);
  return campos;
}

function leerCsv(ruta) {
  const [cabecera, ...lineas] = readFileSync(ruta, 'utf8').split(/\r?\n/);
  const columnas = partirCsv(cabecera);
  return lineas.filter((l) => l.trim()).map((l) => {
    const campos = partirCsv(l);
    return Object.fromEntries(columnas.map((c, i) => [c, campos[i] ?? '']));
  });
}

/** Importe o cantidad "característico": no redondo y suficientemente largo para no chocar con ejemplos. */
function numeroCaracteristico(valor) {
  const t = String(valor ?? '').replace(/,/g, '').trim();
  if (!/^-?\d+(\.\d+)?$/.test(t)) return [];
  const n = Math.abs(Number(t));
  const salida = [];
  const dos = n.toFixed(2);
  if (n >= 1000 && !dos.endsWith('.00')) salida.push(dos);
  const cuatro = n.toFixed(4);
  if (n >= 10 && !/\.(0000|\d{2}00)$/.test(cuatro)) salida.push(cuatro);
  return salida;
}

/** Lee del repo privado hermano los datos reales a vigilar (si no existe, listas vacías). */
export function cargarListaPrivada(raizWeb) {
  const datos = path.resolve(raizWeb, '..', 'inventario-syp-api', 'data');
  const documentos = new Set();
  const nombres = new Set();
  const comprobantes = new Set();
  const numeros = new Set();
  const intentar = (fn) => { try { fn(); } catch { /* el repo privado no está en esta PC (p. ej. en GitHub Actions) */ } };
  intentar(() => {
    for (const t of leerCsv(path.join(datos, 'historico', 'terceros.csv'))) {
      if (t.num_doc?.trim()) documentos.add(t.num_doc.trim());
      if ((t.razon_social ?? '').trim().length >= 8) nombres.add(t.razon_social.trim().toUpperCase());
    }
  });
  intentar(() => {
    const empresa = JSON.parse(readFileSync(path.join(datos, 'semilla', 'empresa.json'), 'utf8'));
    if (empresa.ruc) documentos.add(String(empresa.ruc));
  });
  intentar(() => {
    for (const m of leerCsv(path.join(datos, 'historico', 'movimientos.csv'))) {
      if (m.serie && m.numero && m.naturaleza !== 'MERMA') comprobantes.add(`${m.serie.toUpperCase()}-${Number(m.numero)}`);
      for (const v of [m.cantidad, m.costo_unitario]) numeroCaracteristico(v).forEach((x) => numeros.add(x));
    }
  });
  intentar(() => {
    for (const s of leerCsv(path.join(datos, 'historico', 'saldos_iniciales.csv'))) {
      for (const v of [s.cantidad, s.costo_total]) numeroCaracteristico(v).forEach((x) => numeros.add(x));
    }
  });
  intentar(() => {
    for (const r of leerCsv(path.join(datos, 'fixtures', 'resumen_mensual_esperado.csv'))) {
      for (const [k, v] of Object.entries(r)) if (/cantidad|costo|ventas|compras|mermas/.test(k)) numeroCaracteristico(v).forEach((x) => numeros.add(x));
    }
  });
  intentar(() => {
    for (const a of leerCsv(path.join(datos, 'fixtures', 'asientos_esperados.csv'))) {
      for (const v of [a.debe, a.haber]) numeroCaracteristico(v).forEach((x) => numeros.add(x));
    }
  });
  return { documentos, nombres, comprobantes, numeros, disponible: documentos.size > 0 };
}

const ocultar = (valor) => `${String(valor).slice(0, 3)}…(${String(valor).length})`;

/** Devuelve la lista de hallazgos [{ tipo, muestra }] sin repetir el dato completo. */
export function buscarDatosReales(texto, lista = {}) {
  const { documentos = new Set(), nombres = new Set(), comprobantes = new Set(), numeros = new Set() } = lista;
  const hallazgos = [];
  const contenido = String(texto ?? '');
  for (const m of contenido.matchAll(PATRON_RUC)) {
    if (!RUC_DEMO.test(m[0])) hallazgos.push({ tipo: 'número con forma de RUC (usa 20000000001, 20000000010, 20000000028 o 10000000006)', muestra: ocultar(m[0]) });
  }
  for (const m of contenido.matchAll(PATRON_DNI)) {
    if (!DNI_DEMO.test(m[1])) hallazgos.push({ tipo: 'DNI (usa 00000001)', muestra: ocultar(m[1]) });
  }
  for (const m of contenido.matchAll(PATRON_CORREO)) {
    if (!DOMINIOS_PERMITIDOS.test(m[1]) && !CORREOS_PERMITIDOS.has(m[0].toLowerCase())) hallazgos.push({ tipo: 'correo que no es de demostración (usa @syp.invalid)', muestra: ocultar(m[0]) });
  }
  for (const doc of documentos) {
    if (doc.length >= 8 && contenido.includes(doc)) hallazgos.push({ tipo: 'documento REAL de un cliente, proveedor o de la empresa', muestra: ocultar(doc) });
  }
  const mayusculas = contenido.toUpperCase();
  for (const nombre of nombres) {
    if (mayusculas.includes(nombre)) hallazgos.push({ tipo: 'razón social REAL de un cliente o proveedor', muestra: ocultar(nombre) });
  }
  if (comprobantes.size > 0) {
    for (const m of mayusculas.matchAll(PATRON_COMPROBANTE)) {
      if (comprobantes.has(`${m[1]}-${Number(m[2])}`)) hallazgos.push({ tipo: 'comprobante REAL (serie-número)', muestra: ocultar(m[0]) });
    }
  }
  if (numeros.size > 0) {
    for (const m of contenido.matchAll(PATRON_NUMERO)) {
      if (numeroCaracteristico(m[0]).some((x) => numeros.has(x))) hallazgos.push({ tipo: 'importe o cantidad REAL del kardex', muestra: ocultar(m[0]) });
    }
  }
  return hallazgos;
}
