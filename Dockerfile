# Multi-stage Dockerfile for AI Code Review Assistant

# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm ci --only=production

# Copy client source and build
COPY client/ ./
RUN npm run build

# Stage 2: Build Node.js backend
FROM node:18-alpine AS backend-build
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy server package files
COPY package*.json ./
RUN npm ci --only=production

# Copy server source
COPY server/ ./server/
COPY .env.example ./.env

# Stage 3: Production image
FROM node:18-alpine AS production
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    git \
    && pip3 install --no-cache-dir pylint

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy backend from build stage
COPY --from=backend-build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=backend-build --chown=nextjs:nodejs /app/server ./server
COPY --from=backend-build --chown=nextjs:nodejs /app/package*.json ./

# Copy frontend build from build stage
COPY --from=frontend-build --chown=nextjs:nodejs /app/client/build ./client/build

# Create uploads directory
RUN mkdir -p uploads && chown nextjs:nodejs uploads

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node server/healthcheck.js || exit 1

# Start the application
CMD ["npm", "start"]