# Multi-stage build for Task Management Backend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally and git (needed for some build scripts)
RUN apk add --no-cache git && npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (including dev dependencies for build)
# Set environment variables to ensure proper build behavior
ENV CI=true
ENV NODE_ENV=development
RUN pnpm install --frozen-lockfile

# Copy source code (excluding node_modules due to .dockerignore)
COPY . .

# Debug: List files to ensure src directory is copied
RUN ls -la && ls -la src/

# Build the application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Set production environment
ENV NODE_ENV=production
ENV CI=true

# Install only production dependencies, skip scripts that require dev dependencies
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health-check || exit 1

# Start the app
# Start the application
CMD ["node", "dist/index.js"]
