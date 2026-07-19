# Frontend web — build Vite y servido por Nginx, que además actúa como
# "puerta de entrada": único contenedor expuesto, proxy de /api, /uploads y WS.
# Contexto de build: la raíz del repo (necesita servidor/shared para los tipos).
FROM node:20-slim AS build
WORKDIR /workspace
COPY servidor/shared/ servidor/shared/
# El paquete compartido se compila para que tsc del frontend encuentre sus tipos
RUN cd servidor/shared && npm install && npm run build
COPY app/web/package.json app/web/
WORKDIR /workspace/app/web
RUN npm install
COPY app/web/ .
RUN npm run build

FROM nginx:alpine
COPY app/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/app/web/dist /usr/share/nginx/html
EXPOSE 80
