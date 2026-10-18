// Hook PreToolUse (Bash|PowerShell) del repo PÚBLICO inventario-syp-web.
// Revisa el comando ANTES de ejecutarlo:
//   - bloquea (código 2) lo prohibido: npm/yarn/npx, versiones no aprobadas, leer .env o secretos, acceder al
//     repo privado (salvo su contrato docs/openapi.json), cambiar la identidad de Git, forzar push…
//   - pide confirmación ("ask") para lo destructivo pero legítimo: git push, git reset --hard, borrados recursivos…
// Complementa .claude/settings.json (reglas para Bash y PowerShell). Prueba: node .claude/hooks/probar-hooks.mjs
import { readFileSync } from 'node:fs';

const REPO_PRIVADO = 'inventario-syp-api';

// Versiones aprobadas (CLAUDE.md "Stack fijado"). Un paquete de esta lista se instala SIEMPRE con versión explícita.
const VERSIONES = {
  react: /^\^?19(\.|$)/,
  'react-dom': /^\^?19(\.|$)/,
  'react-router': /^\^?8\.4(\.|$)/,
  '@tanstack/react-query': /^\^?5(\.|$)/,
  '@tanstack/react-table': /^\^?8\.21(\.|$)/,
  zod: /^\^?4(\.|$)/,
  'react-hook-form': /^\^?7(\.|$)/,
  '@hookform/resolvers': /^\^?5(\.|$)/,
  sonner: /^\^?2(\.|$)/,
  recharts: /^\^?3(\.|$)/,
  'big.js': /^\^?7(\.|$)/,
  vite: /^\^?8(\.|$)/,
  '@vitejs/plugin-react': /^\^?6(\.|$)/,
  typescript: /^~?5\.9(\.\d+)?$/,
  tailwindcss: /^\^?4(\.|$)/,
  '@tailwindcss/vite': /^\^?4(\.|$)/,
  vitest: /^\^?4\.1(\.|$)/,
  '@vitest/coverage-v8': /^\^?4\.1(\.|$)/,
  'openapi-typescript': /^\^?7(\.|$)/,
  '@playwright/test': /^\^?1\.64(\.|$)/,
  shadcn: /^\^?4(\.|$)/,
};

let entrada = {};
try {
  entrada = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}
const comando = String(entrada?.tool_input?.command ?? '');
if (!comando.trim()) process.exit(0);
// Mensajes de commit: texto libre que no se analiza como comando ("data/fixtures del Excel" no es un borrado).
// Solo se quita el argumento de -m/--message de un `git commit` (comillas simples o dobles sin sustituciones,
// here-string de PowerShell o el heredoc `-m "$(cat <<'EOF' … EOF)"` que usa Claude Code); el resto se revisa completo.
const quitarMensajes = (t) => (/\bgit\b[^;&|\n]*\bcommit\b/i.test(t) ? t
  .replace(/(\s(?:-m|--message)(?:=|\s+))"\$\(cat\s+<<-?\s*(['"]?)([A-Za-z_]\w*)\2[ \t]*\r?\n[\s\S]*?\r?\n[ \t]*\3[ \t]*\r?\n?\s*\)"/g, '$1"texto"')
  .replace(/(\s(?:-m|--message)(?:=|\s+))(@"[\s\S]*?"@|@'[\s\S]*?'@|"(?:[^"\\`$]|\\.|\$(?!\())*"|'[^']*')/g, '$1"texto"')
  : t);
const c = quitarMensajes(comando).replace(/\s+/g, ' ').toLowerCase();
const inicio = String.raw`(?:^|[\s;&|(){}'"])`;

const bloquear = (motivo) => {
  process.stderr.write(`Bloqueado por .claude/hooks/vigilar-comandos.mjs: ${motivo}\n`);
  process.exit(2);
};
const preguntar = (motivo) => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: motivo },
  }));
  process.exit(0);
};
const hay = (patron) => new RegExp(patron, 'i').test(c);

// 1. Gestor de paquetes: solo pnpm 12.10.1, con versiones aprobadas
if (hay(`${inicio}npm(\\.cmd)?\\s+(install|i|ci|add|update|up|upgrade|uninstall|remove|rm|un|link|exec|x)(\\s|$)`)) {
  bloquear('este repo usa SOLO pnpm 12.10.1 (`pnpm add`, `pnpm install`, `pnpm exec`, `pnpm dlx`). `npm view` sí está permitido.');
}
if (hay(`${inicio}(yarn|corepack)(\\.cmd)?(\\s|$)`) || hay(`${inicio}bun\\s+(install|add|i|x)(\\s|$)`)) {
  bloquear('yarn, bun y corepack no se usan en este proyecto.');
}
if (hay(`${inicio}npx(\\.cmd)?\\s`)) bloquear('usa `pnpm exec <herramienta>` o `pnpm dlx <paquete>@<versión>` en lugar de npx.');
if (hay(`${inicio}pnpm\\s+(approve-builds|self-update|setup)(\\s|$)`)) {
  bloquear('`pnpm approve-builds` es interactivo y `self-update` tiene un error conocido con pnpm 12: decide en `allowBuilds` de pnpm-workspace.yaml.');
}
if (hay(`${inicio}pnpm\\s+(add|install|i)\\s.*(\\s|^)(-g|--global)(\\s|$)`)) bloquear('no instales paquetes globales desde Claude Code.');
if (hay(`${inicio}pnpm\\s+(update|up|upgrade)\\b.*(\\s--latest\\b|\\s-l\\b)`)) {
  bloquear('`--latest` saltaría a versiones mayores no aprobadas: actualiza paquete por paquete con versión explícita.');
}
if (hay('react-router-dom') && hay(`${inicio}pnpm\\s+(add|install|i)\\b`)) {
  bloquear('con React Router 8 se usa el paquete `react-router` (y `react-router/dom`), no `react-router-dom`.');
}
for (const m of comando.matchAll(/(?:^|[\s;&|(])pnpm\s+(add|install|i|dlx|update|up|upgrade)\s+([^;&|]*)/gi)) {
  for (const token of m[2].split(/\s+/).filter((t) => t && !t.startsWith('-'))) {
    const arroba = token.lastIndexOf('@');
    const nombre = (arroba > 0 ? token.slice(0, arroba) : token).toLowerCase();
    const version = arroba > 0 ? token.slice(arroba + 1) : '';
    const regla = VERSIONES[nombre];
    if (regla && (!version || !regla.test(version))) {
      bloquear(`"${token}": versión no aprobada o sin versión explícita (TS 6/7, TanStack Table 9, Vitest 5, React Router distinto de 8.4 no se usan). `
        + 'Instala con la versión de CLAUDE.md "Stack fijado", por ejemplo `pnpm add @tanstack/react-table@8.21.3`.');
    }
  }
}

// 2. Secretos (.env; se permite .env.example) y scripts de una línea que leen el entorno
if (hay(String.raw`(^|[\s'"=<>/\\:])\.env(\.(?!example\b)[\w.-]+)?(?=$|[\s'";|&)>,])`)) {
  bloquear('Claude Code no lee ni modifica archivos .env (usa .env.example).');
}
if (hay(String.raw`(\bnode(\.exe)?\s+(-e|--eval|-p|--print)\b|\b(py|python3?)(\.exe)?\s+(-i\s+)?-c\b)`)
  && hay(String.raw`(dotenv|process\.env|os\.environ|getenv|inventario-syp-api)`)) {
  bloquear('scripts de una línea que leen variables de entorno o el repo privado no se ejecutan desde Claude Code.');
}

// 3. Repo privado: desde aquí solo se usa su contrato (docs/openapi.json); nada de datos, docs internas ni escritura
const menciones = c.match(new RegExp(`${REPO_PRIVADO}`, 'g'))?.length ?? 0;
const alContrato = c.match(new RegExp(`${REPO_PRIVADO}[\\\\/]+docs[\\\\/]+openapi\\.json`, 'g'))?.length ?? 0;
if (menciones > alContrato || (menciones > 0 && hay(`\\bcd\\b|set-location|push-location|\\bpushd\\b`))) {
  bloquear(`desde el repo público solo se usa ${REPO_PRIVADO}/docs/openapi.json (con \`pnpm run api:tipos\`); `
    + 'para trabajar en la API abre Claude Code en esa carpeta.');
}

// 4. Identidad de Git: siempre la del equipo (archivo ../.gitconfig-equipo)
if (hay(String.raw`git\s+config\s+(--(local|global|system|worktree)\s+|--file\s+\S+\s+|-f\s+\S+\s+)?(user\.(name|email)|credential\.|includeif\.)`)
  || hay(String.raw`git\s+(-c\s+(user|credential)\.)`) || hay(String.raw`git\s+.*\bcommit\b.*--author\b`)
  || hay(String.raw`git_(author|committer)_(name|email|date)`)) {
  bloquear('la identidad de Git del equipo no se cambia desde Claude Code (LÉEME, paso 4). Para leerla: `git config --get user.email`.');
}

// 5. Git: nunca forzar; el resto destructivo, con confirmación
if (hay(String.raw`git\s+push\b.*(\s--force\b|\s-f\b|\s--force-with-lease\b|\s--mirror\b|\s\+[\w/-]+)`)) bloquear('nunca se fuerza un push.');
if (hay(String.raw`git\s+push\b`)) preguntar('push al repositorio PÚBLICO: confirma que es parte de /cerrar-sprint y que `pnpm run revisar:datos` está en verde.');
if (hay(String.raw`git\s+(reset\s+--hard|clean\s+-[a-z]*f|checkout\s+--\s+\.|restore\s+\.|branch\s+-D|rebase\b|filter-branch|reflog\s+expire|commit\s+.*--amend)`)) {
  preguntar('comando de git que puede perder o reescribir trabajo: confirma que es lo que quieres.');
}

// 6. Borrados recursivos
if (hay(String.raw`(\brm\s+-[a-z]*r[a-z]*f?\s+(/|~|\.\.|[a-z]:[\\/]?)(\s|$))|remove-item\s+.*-recurse.*\s(/|~|\.\.|[a-z]:[\\/]?)(\s|$)`)) {
  bloquear('borrado recursivo sobre la raíz, el home o la carpeta padre.');
}
if (hay(String.raw`\brm\s+-[a-z]*r|remove-item\s+.*-recurse|\brmdir\s+/s|\brd\s+/s|\brimraf\b`)) {
  preguntar('borrado recursivo: revisa que la carpeta sea la correcta (p. ej. _plantilla, dist, coverage).');
}

process.exit(0);
