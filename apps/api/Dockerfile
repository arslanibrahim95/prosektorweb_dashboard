FROM node:20-bookworm-slim AS builder

WORKDIR /repo
RUN corepack enable

# Workspace manifests (kept separate for better layer caching).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/design-tokens/package.json packages/design-tokens/package.json
COPY packages/testing/package.json packages/testing/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter api build


FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3001

COPY --from=builder /repo/apps/api/.next/standalone ./
COPY --from=builder /repo/apps/api/.next/static ./apps/api/.next/static

EXPOSE 3001
WORKDIR /app/apps/api
CMD ["node", "server.js"]
