// Hook PreToolUse (Read|Grep|Glob) del repo PÚBLICO inventario-syp-web.
// Desde este repo NO se leen los datos reales, los .env ni la documentación interna de costos del repo privado
// hermano (../inventario-syp-api). Solo se permite leer de allí:
//   docs/openapi.json (contrato), docs/11-PROMPTS-CLAUDE-CODE.md, docs/09-PLAN-DE-TRABAJO.md, docs/AVANCE.md y docs/tap/*.md
// Prueba: node .claude/hooks/probar-hooks.mjs
import { readFileSync } from 'node:fs';

const PERMITIDOS = /inventario-syp-api\/+docs\/+(openapi\.json|11-prompts-claude-code\.md|09-plan-de-trabajo\.md|avance\.md|tap\/+[^/]+\.md)$/;

let entrada = {};
try {
  entrada = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}
const valores = Object.values(entrada?.tool_input ?? {})
  .filter((v) => typeof v === 'string')
  .map((v) => v.replace(/\\/g, '/').toLowerCase());

for (const v of valores) {
  if (!v.includes('inventario-syp-api')) continue;
  if (PERMITIDOS.test(v.trim())) continue;
  process.stderr.write('Bloqueado por .claude/hooks/proteger-lectura.mjs: desde el repo público solo se lee del repo privado '
    + 'su contrato (docs/openapi.json), los prompts, el plan, el avance y docs/tap. Para trabajar con datos o reglas de costos '
    + 'abre Claude Code en inventario-syp-api.\n');
  process.exit(2);
}
process.exit(0);
