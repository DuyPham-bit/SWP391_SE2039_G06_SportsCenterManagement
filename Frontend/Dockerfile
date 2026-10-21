# Multi-stage Dockerfile for React Vite Frontend
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci || npm install

# Build static bundle
COPY . .
RUN npm run build

# Production runtime using Nginx
FROM nginx:alpine AS runtime
WORKDIR /usr/share/nginx/html

# Clean default nginx files and copy built dist
RUN rm -rf ./*
COPY --from=build /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]