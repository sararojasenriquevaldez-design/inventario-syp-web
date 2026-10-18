# syntax=docker/dockerfile:1
# =============================================================================
# Imagen de la web para la RED LOCAL: compila la SPA y la sirve con Caddy (HTTPS + proxy /api/inventario).
# La construye docker-compose.yml del repo de la API (infra/). En la nube la web va en Vercel.
# =============================================================================
FROM node:24-bookworm-slim AS compilacion
ENV CI=true
RUN npm install -g pnpm@12.10.1
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM caddy:2-alpine
COPY infra/Caddyfile /etc/caddy/Caddyfile
COPY --from=compilacion /app/dist /srv
EXPOSE 80 443
