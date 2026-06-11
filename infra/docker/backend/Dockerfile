FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --workspace=backend --workspace=@student-journey/shared

# Generate Prisma client
FROM base AS prisma
COPY --from=deps /app/node_modules ./node_modules
COPY apps/backend/prisma ./apps/backend/prisma
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
COPY tsconfig.base.json ./
RUN cd apps/backend && npx tsc

# Production
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 appgroup
RUN adduser --system --uid 1001 appuser
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma
COPY apps/backend/prisma ./prisma
RUN mkdir -p uploads && chown appuser:appgroup uploads
USER appuser
EXPOSE 4000
CMD ["node", "dist/index.js"]
