This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## LAN Deployment

For local-network production use, the recommended setup is:

- `web` service on internal port `3000`
- `realtime` service on internal port `3001`
- `caddy` reverse proxy on port `80`

The repo includes a production stack in `docker-compose.prod.yml` and a proxy config in `docker/Caddyfile`.

Start it with:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Then open:

- `http://<host-ip>/admin`
- `http://<host-ip>/display`

When a DNS record exists on the router, the same setup can be reached as:

- `http://caudri-dashboard/admin`
- `http://caudri-dashboard/display`

Notes:

- No public `NEXT_PUBLIC_REALTIME_URL` is required for this setup.
- In development, the frontend still talks to the realtime server on the same host at port `3001`.
- Uploaded assets are stored in the Docker volume `dashboard-data`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
