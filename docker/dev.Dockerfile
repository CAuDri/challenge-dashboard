FROM node:22-bookworm

WORKDIR /workspace

RUN apt-get update && apt-get install -y \
    git \
    sqlite3 \
    openssl \   
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

EXPOSE 3000

CMD ["sleep", "infinity"]