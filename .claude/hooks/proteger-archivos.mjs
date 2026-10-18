// Hook PreToolUse (Write|Edit|NotebookEdit) del repo PÚBLICO inventario-syp-web.
// Bloquea (código 2; el mensaje de stderr lo ve Claude):
//   - archivos protegidos: .env*, el contrato generado, el lockfile;
//   - escribir fuera de este repo (sobre todo en el repo privado inventario-syp-api);
//   - contenido con datos reales (RUC, DNI, razones sociales, correos personales) o secretos.
// Prueba: node .claude/hooks/probar-hooks.mjs
import { readFileSync } from 'node:fs';
import { buscarDatosReales, cargarListaPrivada } from './datos-reales.mjs';

let entrada = {};
try {
  entrada = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}

const normalizar = (p) => String(p ?? '').replace(/\\/g, '/');
const herramienta = entrada?.tool_input ?? {};
const ruta = normalizar(herramienta.file_path ?? herramienta.notebook_path);
if (!ruta) process.exit(0);

const raiz = normalizar(process.env.CLAUDE_PROJECT_DIR || entrada?.cwd || process.cwd()).replace(/\/+$/, '');
const dentro = ruta.toLowerCase().startsWith(`${raiz.toLowerCase()}/`);
const relativa = dentro ? ruta.slice(raiz.length + 1) : ruta;
const relMin = relativa.toLowerCase();
const nombre = ruta.split('/').pop() ?? '';
// Write (content), Edit (new_string), NotebookEdit (new_source) y MultiEdit (edits[].new_string)
const contenido = [herramienta.content, herramienta.new_string, herramienta.new_source,
  ...(Array.isArray(herramienta.edits) ? herramienta.edits.map((e) => e?.new_string) : [])]
  .filter((x) => typeof x === 'string').join('\n');

const bloquear = (motivo) => {
  process.stderr.write(`Bloqueado por .claude/hooks/proteger-archivos.mjs: "${relativa}" — ${motivo}.\n`);
  process.exit(2);
};

if (ruta.toLowerCase().includes('/inventario-syp-api/')) bloquear('desde el repo público no se escribe en el repo privado inventario-syp-api');
if (/^\.env(\..+)?$/i.test(nombre) && nombre.toLowerCase() !== '.env.example') bloquear('archivo de variables de entorno (.env)');
if (relMin === 'src/api/esquema.d.ts') bloquear('contrato generado: se regenera con `pnpm run api:tipos`');
if (nombre.toLowerCase() === 'pnpm-lock.yaml') bloquear('lockfile (lo actualiza pnpm install/add)');
if (relMin === 'docs/archivos-revisados.txt') bloquear('la revisión de imágenes, PDF y Excel la registra una PERSONA después de abrir cada archivo');

// Secretos
if (/-----BEGIN (EC |RSA |ENCRYPTED )?PRIVATE KEY-----/.test(contenido)) bloquear('contiene una clave privada');
if (/LS0tLS1CRUdJTiB(QUklWQVRF|FQyBQUklWQVRF|SU0EgUFJJVkFURSBLRVkt|FTkNSWVBURUQgUFJJVkFURSBLRVkt)/.test(contenido)) {
  bloquear('contiene una clave privada codificada en base64');
}
if (/postgres(ql)?:\/\/[^:\s'"]+:[^@\s'"]{6,}@/i.test(contenido)) bloquear('contiene una cadena de conexión con contraseña');
if (/\bVITE_[A-Z0-9_]*(SECRET|TOKEN|PASSWORD|CLAVE|KEY)[A-Z0-9_]*\s*=/i.test(contenido)) {
  bloquear('las variables VITE_* llegan al navegador: nunca guardes secretos en ellas');
}

// Datos reales (este repo es PÚBLICO). Los archivos del detector y su prueba se revisan igual.
const hallazgos = buscarDatosReales(contenido, cargarListaPrivada(raiz));
if (hallazgos.length > 0) {
  const detalle = hallazgos.slice(0, 5).map((h) => `${h.tipo} [${h.muestra}]`).join('; ');
  bloquear(`posible dato real en un repo PÚBLICO: ${detalle}. Usa datos de demostración (docs/UI-UX.md §10)`);
}
process.exit(0);
