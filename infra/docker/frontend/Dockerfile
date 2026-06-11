FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --workspace=frontend --workspace=@student-journey/shared

# Build shared package
FROM base AS shared
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
COPY tsconfig.base.json ./
RUN cd packages/shared && npx tsc

# Build frontend
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared /app/packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend
COPY tsconfig.base.json ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/frontend && npx next build

# Production
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./.next/static
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared /app/packages/shared ./packages/shared
RUN sed -i 's/src\/index\.ts/dist\/index.js/g' packages/shared/package.json
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["sh", "-c", "node server.js || node apps/frontend/server.js"]
