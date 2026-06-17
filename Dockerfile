# --- Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install build tools required for native modules like sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Prune development dependencies to keep the image slim
RUN npm prune --production

# --- Production Stage ---
FROM node:22-alpine

WORKDIR /app

# Copy built app and dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/Edits ./src/Edits
COPY --from=builder /app/src/assets ./src/assets
COPY package*.json ./

# Create data directory for SQLite database persistence
RUN mkdir -p /app/data

# Configure SQLite database path
ENV SQLITE_PATH=/app/data/users.db
ENV NODE_ENV=production

CMD ["node", "dist/bot.js"]