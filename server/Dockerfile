FROM node:18-alpine

# Install Chromium for Puppeteer + PostgreSQL client
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    postgresql-client

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./

# Install ALL dependencies (including dev for TypeScript build)
RUN npm install

COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Remove dev dependencies after build to reduce image size
RUN npm prune --production

EXPOSE 5000

CMD ["npm", "start"]
