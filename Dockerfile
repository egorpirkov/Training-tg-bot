FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm prune --production

FROM node:22-alpine

WORKDIR /app

ARG BOT_SECRET_TOKEN

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/Edits ./src/Edits
COPY --from=builder /app/src/assets ./src/assets
COPY package*.json ./

RUN echo "BOT_TOKEN=${BOT_SECRET_TOKEN}" > .env

RUN mkdir -p /app/data

ENV SQLITE_PATH=/app/data/users.db
ENV NODE_ENV=production

CMD ["node", "dist/bot.js"]