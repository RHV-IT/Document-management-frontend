# ====== Build Stage ======
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy project files
COPY . .

# Build the Next.js app
RUN npm run build

# ====== Production Stage ======
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy build output and public files from builder
COPY --from=builder /app/.next .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app

# Expose the default Next.js port
EXPOSE 3000

# Make Next.js listen on all interfaces (required for Docker)
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npx", "next", "start", "--hostname", "0.0.0.0", "--port", "3000"]