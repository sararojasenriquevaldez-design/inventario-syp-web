---
name: retomar
description: Retoma el trabajo después de /clear o de un día sin trabajar en inventario-syp-web. Resume en qué sprint se está, qué quedó hecho, qué falta y el siguiente paso concreto, sin cambiar nada.
disable-model-invocation: true
allowed-tools: Bash(git status *) Bash(git log *) Bash(git diff *) PowerShell(git status *) PowerShell(git log *) PowerShell(git diff *)
---

# Retomar el trabajo — inventario-syp-web

- Rama actual: !`git branch --show-current`
- Cambios sin commit:
!`git status --short`
- Últimos commits:
!`git log --oneline -10`

1. Lee `docs/AVANCE.md` (tabla "Estado actual" y la última sección de la bitácora).
2. Si la rama es `sprint/NN-…`, revisa en `docs/UI-UX.md` las pantallas de ese sprint (columna "Sprint" de §3) y compara con lo que ya existe en `src/funcionalidades/`. Si hay cambios sin commit, revisa `git diff --stat`.
3. **No cambies nada todavía.**

Responde en **5 líneas**:
1. Sprint y rama actuales.
2. Lo que ya está hecho.
3. Lo que falta del sprint.
4. Riesgos o errores pendientes (si los hay).
5. **Siguiente paso concreto** (qué escribir o ejecutar ahora; si cambió la API, empezar con `pnpm run api:tipos`).
