# Stage 1 — build the Next.js dashboard
FROM node:22-bookworm AS dashboard-builder

WORKDIR /build/dashboard
COPY dashboard/package.json dashboard/package-lock.json ./
RUN npm ci
COPY dashboard/ ./
RUN npm run build

# Stage 2 — build the wellness-claw plugin
FROM node:22-bookworm AS plugin-builder

WORKDIR /build/plugin
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY src/ src/
RUN npx tsc

# Stage 3 — final image
FROM node:22-bookworm

RUN npm install -g openclaw@2026.2.15

WORKDIR /app

# Copy wellness-claw plugin
COPY package.json package-lock.json openclaw.plugin.json ./
COPY --from=plugin-builder /build/plugin/dist/ dist/
COPY skills/ skills/
RUN npm ci --omit=dev

# Copy dashboard standalone output
COPY --from=dashboard-builder /build/dashboard/.next/standalone/dashboard /app/dashboard
COPY --from=dashboard-builder /build/dashboard/.next/static /app/dashboard/.next/static

# Copy entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8080 3000

ENTRYPOINT ["/app/entrypoint.sh"]
