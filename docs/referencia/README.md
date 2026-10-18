# docs/referencia — material de partida

| Archivo | Qué es | Se usa en |
|---|---|---|
| `ci-web.yml` | GitHub Actions de la web: revisión de datos reales, prueba de los hooks, lint, pruebas, build y auditoría de dependencias (acciones fijadas por SHA, pnpm 12.10.1, Node 24) | Sprint 5: se copia a `.github/workflows/ci.yml` |

`infra/Dockerfile` e `infra/Caddyfile` sirven la web en la red local; los usa el `docker-compose.yml` del repo de la API.
