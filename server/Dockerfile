FROM node:18-alpine

# Install Chromium for Puppeteer + PostgreSQL client
# This layer is cached and rarely changes
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    postgresql-client

# Tell Puppeteer to use installed Chromium (skip download = faster builds)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Security: Create non-root user EARLY (cached layer)
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    mkdir -p /home/appuser/.cache/puppeteer && \
    chown -R appuser:appgroup /home/appuser

WORKDIR /app

# Copy ONLY package files first (better layer caching)
# This layer is only rebuilt when package.json changes
COPY package*.json ./

# Install dependencies (cached unless package.json changes)
RUN npm ci --include=dev

# Now copy source code (this layer changes frequently)
COPY --chown=appuser:appgroup . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 5000

CMD ["npm", "start"]
