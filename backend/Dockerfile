# backend/Dockerfile
# Multi-stage build: builder -> production

# === BUILDER STAGE ===
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

# === PRODUCTION STAGE ===
FROM node:24-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
RUN rm -rf prisma/generated
COPY --from=builder /app/dist/prisma/generated ./prisma/generated

RUN node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8'));p.imports['#src/*']='./dist/src/*';require('fs').writeFileSync('package.json',JSON.stringify(p,null,2))"

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && node dist/prisma/seed.js && node dist/src/server.js"]
