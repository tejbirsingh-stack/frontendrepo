# ── Stage 1: Build the static assets ──────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install --ignore-scripts

COPY . .
RUN npm run build
# Output lands in /app/dist (per vite.config.ts build.outDir)

# ── Stage 2: Serve with nginx ──────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx site, add ours
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3002/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
