// Revisa que el repo PÚBLICO no tenga datos reales (RUC, DNI, razones sociales, correos personales) ni secretos.
//
// Uso:  node scripts/revisar-datos-publicos.mjs        (o `pnpm run revisar:datos` desde el Sprint 5)
// - Revisa los archivos versionados (`git ls-files`) y los nuevos aún sin commit (no ignorados).
// - Si en esta PC existe ../inventario-syp-api/data, también busca los documentos y nombres reales.
// - En GitHub Actions solo aplica los patrones (el repo privado no está ahí).
// - Imágenes, PDF y Excel no se pueden leer como texto: cada uno debe estar REVISADO por una persona y anotado
//   (huella SHA-256 + ruta) en docs/archivos-revisados.txt. Si cambia el archivo, cambia la huella y hay que revisarlo otra vez.
// Termina con código 1 si encuentra algo: así lo usan /cerrar-sprint y el CI.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buscarDatosReales, cargarListaPrivada } from '../.claude/hooks/datos-reales.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BINARIOS = /\.(png|jpe?g|gif|ico|webp|bmp|tiff?|pdf|xlsx?|docx?|pptx?|zip|gz)$/i; // requieren revisión humana
const FUENTES = /\.(woff2?|ttf|otf|eot)$/i;                                                  // no contienen datos
const IGNORAR = new Set(['pnpm-lock.yaml']);

const listar = (args) => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8' }).split('\n').filter(Boolean);
let archivos;
try {
  archivos = [...new Set([...listar(['ls-files']), ...listar(['ls-files', '--others', '--exclude-standard'])])];
} catch {
  console.error('No es un repositorio git (ejecuta este script dentro de inventario-syp-web).');
  process.exit(1);
}

const lista = cargarListaPrivada(RAIZ);
const problemas = [];
const REVISADOS = path.join(RAIZ, 'docs', 'archivos-revisados.txt');
const revisados = new Set(existsSync(REVISADOS)
  ? readFileSync(REVISADOS, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    // acepta la huella en mayúsculas (Get-FileHash) y cualquier cantidad de espacios entre huella y ruta
    .map((l) => l.replace(/^([0-9a-f]{64})\s+(.+)$/i, (_, h, r) => `${h.toLowerCase()}  ${r.replace(/\\/g, '/')}`)) : []);
const sinRevisar = [];
for (const relativo of archivos) {
  if (BINARIOS.test(relativo)) {
    try {
      const huella = createHash('sha256').update(readFileSync(path.join(RAIZ, relativo))).digest('hex');
      const linea = `${huella}  ${relativo.replace(/\\/g, '/')}`;
      if (!revisados.has(linea)) sinRevisar.push(linea);
    } catch {
      // borrado y aún no confirmado
    }
    continue;
  }
  if (FUENTES.test(relativo) || IGNORAR.has(path.basename(relativo))) continue;
  const ruta = path.join(RAIZ, relativo);
  try {
    if (statSync(ruta).size > 2_000_000) continue;
  } catch {
    continue; // borrado y aún no confirmado
  }
  const lineas = readFileSync(ruta, 'utf8').split(/\r?\n/);
  lineas.forEach((linea, i) => {
    for (const h of buscarDatosReales(linea, lista)) problemas.push(`${relativo}:${i + 1}  ${h.tipo} [${h.muestra}]`);
  });
  const nombre = path.basename(relativo);
  if (/^\.env(\..+)?$/i.test(nombre) && nombre !== '.env.example') problemas.push(`${relativo}  archivo .env versionado`);
}

for (const linea of sinRevisar) problemas.push(`${linea.split('  ')[1]}  archivo binario sin revisar (imagen, PDF o Excel)`);
console.log(`Archivos revisados: ${archivos.length} · lista privada: ${lista.disponible ? 'cargada' : 'no disponible (solo patrones)'}`);
if (sinRevisar.length > 0) {
  console.log('\nAbre cada archivo binario, confirma que solo muestra datos de DEMOSTRACIÓN y agrega su línea a'
    + ' docs/archivos-revisados.txt (una persona, no Claude Code):');
  for (const linea of sinRevisar) console.log(`  ${linea}`);
}
if (problemas.length === 0) {
  console.log('SIN DATOS REALES: el repo público está limpio.');
} else {
  console.log(problemas.join('\n'));
  console.log(`\n${problemas.length} posible(s) dato(s) real(es). Reemplázalos por datos de demostración (docs/UI-UX.md §10) antes de hacer push.`);
  process.exitCode = 1;
}
