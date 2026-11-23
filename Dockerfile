# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set default API base URL for container environment
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
# La imagen de nginx procesa /etc/nginx/templates/*.template al arrancar y solo
# sustituye variables de entorno definidas (las de nginx como $host se conservan).
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Destino del API Gateway para /api/ (sobrescribible con -e GATEWAY_UPSTREAM=...)
ENV GATEWAY_UPSTREAM=http://fmat-api-gateway:8000

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
