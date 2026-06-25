# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Dépendances système pour bcrypt / prisma
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---------- Production stage ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 4000

# Applique les migrations puis démarre l'API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
