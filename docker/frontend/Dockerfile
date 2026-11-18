# Multi-stage Dockerfile for React Vite Frontend
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY Frontend/package*.json ./
RUN npm ci || npm install

# Build static bundle
ARG VITE_API_BASE_URL=/api
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
COPY Frontend/ .
RUN npm run build

# Production runtime using Nginx
FROM nginx:alpine AS runtime
WORKDIR /usr/share/nginx/html

RUN rm -rf ./*
COPY --from=build /app/dist .
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]