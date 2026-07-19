# Motor principal (NestJS) — build multi-stage
FROM node:20-slim AS build
WORKDIR /workspace
# Contexto de build: ./servidor (ver docker-compose.prod.yml)
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY api/package.json api/
RUN npm ci
COPY shared/ shared/
COPY api/ api/
RUN npm run build --workspace @club-campina/shared-types \
 && cd api && npx prisma generate && npm run build

FROM node:20-slim AS runtime
# openssl: requerido por Prisma en imágenes slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/shared ./shared
COPY --from=build /workspace/api/dist ./dist
COPY --from=build /workspace/api/prisma ./prisma
COPY --from=build /workspace/api/package.json ./package.json
EXPOSE 3000
# Aplica migraciones pendientes antes de arrancar (idempotente)
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
