# DECI Week 8 — Full-Stack Auth & E-Commerce

**Pre-hosted:** https://deci-project-xfbt.vercel.app/

## Structure

```
├── backend/          Express + Prisma + MongoDB (GridFS)
│   ├── prisma/       Schema, migrations, seed
│   ├── src/          Routes, controllers, services, middleware
│   └── Dockerfile
├── frontend/         React + SvelteKit + Vite + nginx
│   ├── src/          Pages, components, hooks, tests
│   └── Dockerfile
├── compose.yaml      Full stack (test → prod)
├── .env.dev          Root DB credentials
└── .env.test         Test DB credentials
```

## Run with Docker Compose

```bash
# Copy env files
cp .env.dev.example .env.dev
cp .env.test.example .env.test
cp backend/.env.dev.example backend/.env.dev
cp backend/.env.test.example backend/.env.test
cp frontend/.env.dev.example frontend/.env.dev

# Start everything — tests run first, then production services start
docker compose up -d
```

The backend listens on **`:3000`**, frontend on **`:8080`**.

## Seeded Users

| Role  | Email         | Password      |
|-------|---------------|---------------|
| OWNER | foo@bar.com   | ownerpassword |
| ADMIN | foo@baz.com   | adminpassword |
| USER  | *(register)*  | *(register)*  |
