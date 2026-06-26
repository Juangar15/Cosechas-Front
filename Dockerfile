# Etapa 1: Construcción (Build) de Vite + React
FROM node:20-alpine AS build

WORKDIR /app

# Copiamos primero package.json y package-lock.json para aprovechar la caché de Docker
COPY package.json package-lock.json ./
RUN npm ci

# Copiamos todo el código y construimos
COPY . .
RUN npm run build

# Etapa 2: Servidor Web Ligero (Nginx)
FROM nginx:alpine

# Copiamos el resultado de la construcción (/dist) a Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiamos configuración especial para evitar error 404 al recargar páginas
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80 (interno del contenedor)
EXPOSE 80

# Inicia nginx
CMD ["nginx", "-g", "daemon off;"]
