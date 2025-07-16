# Dockerfile for Hardhat Development Environment
FROM node:20-alpine

# Install necessary dependencies
RUN apk add --no-cache git python3 make g++

# Create working directory
WORKDIR /app

# Install global dependencies
RUN npm install -g hardhat

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Hardhat node port
EXPOSE 8545

# Set environment variables
ENV NODE_ENV=development

# Default command - run hardhat node
CMD ["npx", "hardhat", "node"] 