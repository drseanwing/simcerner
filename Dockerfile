# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files first for caching
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy patient data
COPY --from=builder /app/public/patients /usr/share/nginx/html/patients

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

# Non-root user
RUN addgroup -g 1001 -S simcerner && \
    adduser -S simcerner -u 1001 -G simcerner && \
    chown -R simcerner:simcerner /usr/share/nginx/html && \
    chown -R simcerner:simcerner /var/cache/nginx && \
    chown -R simcerner:simcerner /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R simcerner:simcerner /var/run/nginx.pid

USER simcerner

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
