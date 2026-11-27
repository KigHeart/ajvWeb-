# Build the frontend and bundle the TypeScript server.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY . .
ARG VITE_INQUIRY_TRANSPORT=self-hosted
ENV VITE_INQUIRY_TRANSPORT=${VITE_INQUIRY_TRANSPORT}
RUN npm run build && npm run build:server

# Runtime contains only production dependencies and built assets.
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV AJENTIR_DB_PATH=/app/data/ajentir.sqlite
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund && npm cache clean --force
COPY --from=build --chown=node:node /app/server.js ./server.js
COPY --from=build --chown=node:node /app/dist ./dist
RUN mkdir -p /app/data && chown -R node:node /app/data /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
