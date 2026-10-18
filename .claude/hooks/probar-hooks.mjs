// Prueba de los hooks de Claude Code de este repo (no necesita Claude Code).
// Uso: node .claude/hooks/probar-hooks.mjs   → debe terminar con "Hooks OK".
// Los valores "reales" de prueba se arman en tiempo de ejecución: este archivo no contiene datos reales.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cargarListaPrivada } from './datos-reales.mjs';

const carpeta = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(carpeta, '..', '..');
const ejecutar = (hook, entrada) => {
  const r = spawnSync(process.execPath, [path.join(carpeta, hook)], {
    input: JSON.stringify({ cwd: raiz, ...entrada }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: raiz },
    encoding: 'utf8',
  });
  if (r.status === 2) return 'BLOQUEA';
  if (r.status === 0 && r.stdout.includes('"ask"')) return 'PREGUNTA';
  if (r.status === 0) return 'PERMITE';
  return `ERROR(${r.status}) ${r.stderr}`;
};
const archivo = (ruta, contenido = 'export const x = 1;\n') => ejecutar('proteger-archivos.mjs', {
  tool_name: 'Write', tool_input: { file_path: path.join(raiz, ruta), content: contenido } });
const comando = (cmd, herramienta = 'PowerShell') => ejecutar('vigilar-comandos.mjs', {
  tool_name: herramienta, tool_input: { command: cmd } });
const lectura = (entrada, herramienta = 'Read') => ejecutar('proteger-lectura.mjs', {
  tool_name: herramienta, tool_input: entrada });

const rucFicticioNoDemo = `20${'7'.repeat(9)}`;    // forma de RUC que no es de demostración
const correoPersonal = ['persona', 'gmail.com'].join('@');
const privado = cargarListaPrivada(raiz);

const casos = [
  ['editar .env', archivo('.env'), 'BLOQUEA'],
  ['editar .env.local', archivo('.env.local'), 'BLOQUEA'],
  ['editar .env.example', archivo('.env.example', 'API_PROXY_TARGET=http://localhost:3000\n'), 'PERMITE'],
  ['editar el contrato generado', archivo('src/api/esquema.d.ts'), 'BLOQUEA'],
  ['editar el lockfile', archivo('pnpm-lock.yaml'), 'BLOQUEA'],
  ['registrar revisión de capturas', archivo('docs/archivos-revisados.txt', 'abc  docs/x.png\n'), 'BLOQUEA'],
  ['escribir en el repo privado', archivo('../inventario-syp-api/src/x.ts'), 'BLOQUEA'],
  ['código normal', archivo('src/lib/formato.ts'), 'PERMITE'],
  ['RUC de demostración', archivo('src/x.test.ts', "const ruc = '20000000001';\n"), 'PERMITE'],
  ['RUC no de demostración', archivo('src/x.test.ts', `const ruc = '${rucFicticioNoDemo}';\n`), 'BLOQUEA'],
  ['DNI no de demostración', archivo('src/x.test.ts', `DNI ${'4'.repeat(8)}\n`), 'BLOQUEA'],
  ['correo personal', archivo('docs/x.md', `contacto: ${correoPersonal}\n`), 'BLOQUEA'],
  ['secreto en VITE_', archivo('src/config.ts', 'VITE_API_SECRET=abc\n'), 'BLOQUEA'],
  ['clave privada', archivo('src/x.ts', '-----BEGIN PRIVATE KEY-----'), 'BLOQUEA'],
  ['npm install', comando('npm install zod'), 'BLOQUEA'],
  ['npx', comando('npx vite', 'Bash'), 'BLOQUEA'],
  ['pnpm add normal', comando('pnpm add zod@4.6.5'), 'PERMITE'],
  ['react-router-dom', comando('pnpm add react-router-dom'), 'BLOQUEA'],
  ['TanStack Table 9', comando('pnpm add @tanstack/react-table@9.0.0'), 'BLOQUEA'],
  ['leer .env', comando('Get-Content .env'), 'BLOQUEA'],
  ['leer datos del repo privado', comando('Get-Content ../inventario-syp-api/data/historico/terceros.csv'), 'BLOQUEA'],
  ['copiar al repo privado', comando('Copy-Item src/x.ts ../inventario-syp-api/src/', 'PowerShell'), 'BLOQUEA'],
  ['generar tipos (permitido)', comando('pnpm run api:tipos'), 'PERMITE'],
  ['push forzado', comando('git push -f origin main'), 'BLOQUEA'],
  ['push normal (pregunta)', comando('git push origin main'), 'PREGUNTA'],
  ['borrar _plantilla (pregunta)', comando('Remove-Item -Recurse -Force _plantilla'), 'PREGUNTA'],
  ['pruebas', comando('pnpm test'), 'PERMITE'],
  ['vitest sin versión', comando('pnpm add -D vitest'), 'BLOQUEA'],
  ['react-router 8.4 (permitido)', comando('pnpm add react-router@8.4.0'), 'PERMITE'],
  ['entrar al repo privado', comando('cd ..\\inventario-syp-api; Get-Content data\\historico\\terceros.csv'), 'BLOQUEA'],
  ['leer el contrato (permitido)', comando('Get-Content ../inventario-syp-api/docs/openapi.json -TotalCount 20'), 'PERMITE'],
  ['leer docs internas del privado', comando('Get-Content ../inventario-syp-api/docs/10-DECISIONES.md'), 'BLOQUEA'],
  ['cambiar correo de Git', comando('git config user.email otra@syp.invalid'), 'BLOQUEA'],
  ['commit que menciona el repo privado (permitido)', comando('git commit -m "feat(api): tipos desde inventario-syp-api/docs/openapi.json"'), 'PERMITE'],
  ['commit + leer datos privados (bloquea)', comando('git commit -m "x"; Get-Content ../inventario-syp-api/data/historico/terceros.csv'), 'BLOQUEA'],
  ['correo de demostración (permitido)', archivo('src/x.test.ts', "const u = 'contadora.demo@syp.invalid';\n"), 'PERMITE'],
  ['correo corporativo', archivo('docs/x.md', `escribir a ${['ventas', 'empresa-real.com.pe'].join('@')}\n`), 'BLOQUEA'],
  ['Read de datos del repo privado', lectura({ file_path: path.join(raiz, '..', 'inventario-syp-api', 'data', 'historico', 'movimientos.csv') }), 'BLOQUEA'],
  ['Grep en datos del repo privado', lectura({ pattern: 'SAC', path: '../inventario-syp-api/data' }, 'Grep'), 'BLOQUEA'],
  ['Read del .env del repo privado', lectura({ file_path: '../inventario-syp-api/.env' }), 'BLOQUEA'],
  ['Read del contrato (permitido)', lectura({ file_path: '../inventario-syp-api/docs/openapi.json' }), 'PERMITE'],
  ['Read de .env.example privado', lectura({ file_path: '../inventario-syp-api/.env.example' }), 'BLOQUEA'],
  ['Read de reglas de costos privadas', lectura({ file_path: '../inventario-syp-api/docs/02-REGLAS-DE-NEGOCIO.md' }), 'BLOQUEA'],
  ['Read de los prompts (permitido)', lectura({ file_path: '../inventario-syp-api/docs/11-PROMPTS-CLAUDE-CODE.md' }), 'PERMITE'],
  ['Read del mapa del TAP (permitido)', lectura({ file_path: '../inventario-syp-api/docs/tap/00-MAPA-DEL-INFORME.md' }), 'PERMITE'],
  ['Glob sobre el repo privado', lectura({ pattern: '**/*.csv', path: '../inventario-syp-api' }, 'Glob'), 'BLOQUEA'],
  ['Read de código del propio repo (permitido)', lectura({ file_path: path.join(raiz, 'src', 'main.tsx') }), 'PERMITE'],
];
if (privado.disponible) {
  const [doc] = privado.documentos;
  const [nombre] = privado.nombres;
  const [comprobante] = privado.comprobantes;
  const [numero] = privado.numeros;
  if (comprobante) casos.push(['comprobante real (lista privada)', archivo('src/mock.ts', `const c = '${comprobante}';\n`), 'BLOQUEA']);
  if (numero) casos.push(['importe real (lista privada)', archivo('src/mock.ts', `const n = '${numero}';\n`), 'BLOQUEA']);
  casos.push(['documento real (lista privada)', archivo('src/mock.ts', `const d = '${doc}';\n`), 'BLOQUEA']);
  if (nombre) casos.push(['razón social real (lista privada)', archivo('src/mock.ts', `const n = '${nombre.toLowerCase()}';\n`), 'BLOQUEA']);
}

let fallas = 0;
for (const [nombre, obtenido, esperado] of casos) {
  const ok = obtenido === esperado;
  if (!ok) fallas += 1;
  console.log(`${ok ? 'OK ' : 'ERR'} ${nombre.padEnd(42)} ${obtenido}${ok ? '' : ` (esperado ${esperado})`}`);
}
console.log(privado.disponible
  ? '\nLista privada cargada desde ../inventario-syp-api/data (solo en esta PC).'
  : '\nAviso: no se encontró ../inventario-syp-api/data; solo se probaron los patrones.');
console.log(fallas === 0 ? 'Hooks OK' : `${fallas} casos fallaron`);
process.exitCode = fallas === 0 ? 0 : 1;
