FROM node:20-alpine AS build
WORKDIR /app

COPY Frontend/package*.json ./
RUN npm ci

COPY Frontend/ ./

ARG VITE_SPORTS_CENTER_ID
ENV VITE_SPORTS_CENTER_ID=${VITE_SPORTS_CENTER_ID}

ENV VITE_API_BASE_URL=/api
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
RUN npm run build

FROM nginx:alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
