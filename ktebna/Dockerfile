# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Non-secret build settings, inlined into the bundle by Vite.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_GOOGLE_MAPS_MAP_ID=""
ENV VITE_GOOGLE_MAPS_MAP_ID=$VITE_GOOGLE_MAPS_MAP_ID

# The Maps key comes in as a BuildKit secret, not an ARG/ENV: it's mounted only
# for this one RUN, so it never lands in the image config or build history.
# (Vite still embeds it in the public JS bundle; that's inherent to browser
# keys, which is why the key must be restricted by HTTP referrer.)
# Optional: without the secret the build succeeds and the maps stay hidden.
RUN --mount=type=secret,id=maps_key,required=false \
    VITE_GOOGLE_MAPS_API_KEY="$(cat /run/secrets/maps_key 2>/dev/null || true)" npm run build

# --- Run stage ---
FROM nginx:1.30.4-alpine3.24
# Pull Alpine security fixes released after the base image was built
# (e.g. util-linux/libuuid CVE-2026-53612 and related, fixed in 2.42.3-r1).
# Then let the image's unprivileged `nginx` user own what nginx writes at runtime.
RUN apk upgrade --no-cache \
    && chown -R nginx:nginx /var/cache/nginx /etc/nginx/conf.d \
    && touch /run/nginx.pid \
    && chown nginx:nginx /run/nginx.pid
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Non-root, so it listens on 8080 (ports below 1024 need root).
USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
