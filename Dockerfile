# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json .npmrc* ./

# Install ALL dependencies (including devDependencies for building)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json .npmrc* ./

# Install ONLY production dependencies
RUN npm install --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client ./client
COPY --from=builder /app/public ./public

# Set production environment
ENV NODE_ENV=production

# Expose port (Cloud Run will set PORT env var)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
