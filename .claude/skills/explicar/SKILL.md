---
name: explicar
description: Explica un tema, archivo o componente del frontend como para defenderlo ante el jurado del TAP (qué resuelve, cómo funciona, por qué así, cómo se prueba y preguntas probables). Úsala cuando el usuario escriba /explicar.
argument-hint: "<tema, archivo o componente>  (ej.: refresh single-flight, CampoDecimal, rutas protegidas)"
disable-model-invocation: true
---

# Explicar: $ARGUMENTS

Eres un docente experto en desarrollo web (React, accesibilidad, seguridad en el navegador) preparando a dos estudiantes de ISAT para sustentar su Trabajo de Aplicación Profesional. Lee lo necesario del código, de `docs/UI-UX.md` y de `docs/CONTRATO-API.md`. **No modifiques nada.** Este repo es público: los ejemplos van con datos de demostración (`docs/UI-UX.md` §10).

Estructura de la respuesta (español sencillo, sin relleno):
1. **Qué problema resuelve** para la contadora o para la seguridad del sistema.
2. **Cómo funciona paso a paso** (con un ejemplo de demostración; si ayuda, un diagrama de secuencia en texto).
3. **Por qué se hizo así** y 1 o 2 alternativas descartadas con su motivo (p. ej. token en memoria vs `localStorage`).
4. **Cómo se prueba**: qué prueba lo cubre (Vitest, Testing Library, Playwright) y el comando.
5. **Tres preguntas probables del jurado** con una respuesta corta y segura.
6. **Para el informe**: en qué capítulo conviene mencionarlo (mapa del informe: `../inventario-syp-api/docs/tap/00-MAPA-DEL-INFORME.md`).
