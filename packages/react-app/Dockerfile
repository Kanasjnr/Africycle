# Multi-stage Dockerfile for Next.js React App
# Stage 1: Base image with Node.js 20
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../../package*.json ../../
COPY ../../.npmrc ../../

# Install dependencies
RUN npm ci --only=production

# Stage 2: Development image
FROM base AS development
WORKDIR /app

# Install development dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment to development
ENV NODE_ENV=development

# Start development server
CMD ["npm", "run", "dev"]

# Stage 3: Build the application
FROM base AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Copy environment example (will be overridden by actual .env in production)
COPY .env.example .env.local

# Build the application
RUN npm run build

# Stage 4: Production image
FROM base AS production
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/out ./out
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy package.json for any runtime dependencies
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

# Serve the static files
CMD ["npx", "serve", "out", "-s", "-p", "3000"] 