# DECI Week 8 — ShopSphere Enterprise Production and Cloud Modernization

## Production URLs

**Frontend**: https://deci-project-xfbt.vercel.app/
**Backend API**: https://deci-project-backend-94oo.vercel.app/
**Review Service**: https://deci-project-backend-94oo.vercel.app/
**Serverless Function**: https://deci-project-backend-94oo.vercel.app/api/reviews/aggregate
**Health Check**: https://deci-project-backend-94oo.vercel.app/health
**GitHub**: https://github.com/SafariKnight/deci-project

## Seeded Owner Details
email: foo@bar.com
password: ownerpassword

## Seeded Admin Details
email: foo@baz.com
password: adminpassword

## Monitoring
UptimeRobot monitors the backend health endpoint: https://deci-project-backend-94oo.vercel.app/health

## Project Structure

```
├── backend/                Express + Prisma + MongoDB (GridFS)
│   ├── prisma/            Schema, migrations, seed
│   ├── src/               Routes, controllers, services, middleware
│   ├── api/               Serverless functions (aggregate-reviews)
│   ├── vercel.json        Vercel deployment config
│   └── Dockerfile
├── ShopSphere-ReviewService/   Independently deployed review microservice
│   ├── src/
│   ├── vercel.json
│   └── package.json
├── frontend/              React + Vite
│   ├── src/
│   └── vercel.json
├── multi-cloud-sim/       Kubernetes namespace simulation
│   ├── manifests.yaml
│   └── README.md
├── .github/workflows/     CI/CD pipeline
│   └── ci-cd.yml
├── compose.yaml           Full stack docker-compose
├── .env.dev               Root dev environment
├── .env.test              Root test environment
├── ADR.md                 Architecture Decision Record
├── RollbackPlan.md        Rollback plan document
└── Deci-Project-ShopSphere.md   Project links and documentation
```

## Run with Docker Compose

```bash
# Copy env files (if templates exist)
cp .env.dev.example .env.dev 2>/dev/null || true
cp .env.test.example .env.test 2>/dev/null || true

# Start everything
docker compose up -d
```

The backend listens on **:3000**, frontend on **:8080**.

## CI/CD Pipeline
The pipeline runs on GitHub Actions:
1. **Install** dependencies for all three services (backend, review service, frontend)
2. **Build** all three applications
3. **Deploy** to Vercel on merge to `main` branch

## Documentation
- [Deci-Project-ShopSphere.md](Deci-Project-ShopSphere.md) — Project links and documentation
- [Deci-Project-ShopSphere-ADR.md](Deci-Project-ShopSphere-ADR.md) — Architecture Decision Record
- [Deci-Project-ShopSphere-RollbackPlan.md](Deci-Project-ShopSphere-RollbackPlan.md) — Rollback plan
- [Deci-Project-ShopSphere-ArchitectureDiagram.md](Deci-Project-ShopSphere-ArchitectureDiagram.md) — Architecture diagram
- [Deci-Project-ShopSphere-CloudClassification.md](Deci-Project-ShopSphere-CloudClassification.md) — Cloud service classification

## Seeded Users

| Role  | Email         | Password      |
|-------|---------------|---------------|
| OWNER | foo@bar.com   | ownerpassword |
| ADMIN | foo@baz.com   | adminpassword |
| USER  | *(register)*  | *(register)*  |
