FROM node:22-bookworm AS base

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

ARG INTERNAL_REALTIME_URL=http://127.0.0.1:3001
ENV INTERNAL_REALTIME_URL=$INTERNAL_REALTIME_URL

RUN NODE_ENV=production pnpm build

EXPOSE 3000
EXPOSE 3001

CMD ["pnpm", "start:web"]
