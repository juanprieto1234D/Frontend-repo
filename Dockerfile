# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# TaskUp Frontend (React Native + Expo, versión web)
# Etapa 1: exporta la app a archivos estáticos (HTML/JS/CSS).
# Etapa 2: los sirve con Nginx (imagen final muy liviana).
# ─────────────────────────────────────────────────────────────

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV CI=1 \
    EXPO_NO_TELEMETRY=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx expo export --platform web

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
