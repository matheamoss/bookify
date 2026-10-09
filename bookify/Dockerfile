FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:24-alpine
ENV NODE_ENV=production BOOKIFY_PORT=3000 BOOKIFY_LISTEN_HOST=0.0.0.0 DB_PATH=/data/bookify.sqlite STATIC_ROOT=/app/dist COOKIE_SECURE=true
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server ./server
RUN mkdir -p /data && chown -R node:node /data /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch(`http://127.0.0.1:${process.env.BOOKIFY_PORT || 3000}/api/health`).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server/index.js"]
