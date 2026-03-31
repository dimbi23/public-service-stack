FROM node:22.12.0-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile
COPY . .
RUN npx nx build case-api

FROM node:22.12.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/apps/case-api/dist ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/case-api/prisma ./prisma
EXPOSE 3002
CMD ["node", "main.js"]
