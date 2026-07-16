# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build

ARG VITE_API_URL
ARG VITE_API_URL_PHOTO

ENV NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    VITE_API_URL=${VITE_API_URL} \
    VITE_API_URL_PHOTO=${VITE_API_URL_PHOTO}

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
RUN if [ -z "$VITE_API_URL" ]; then echo "VITE_API_URL is required to build the frontend"; exit 1; fi
RUN npm run build

FROM nginx:alpine AS runtime

ENV PORT=8080 \
    NGINX_ENVSUBST_FILTER=PORT

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
