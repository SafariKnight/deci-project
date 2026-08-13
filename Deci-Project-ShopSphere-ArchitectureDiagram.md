# Architecture Diagram

## Production Deployment — Deci-Project ShopSphere

```
                    ┌─────────────────────────────────────────┐
                    │             Users/Browsers              │
                    └──────────────────┬────────────────────────┘
                                       │   HTTPS
                                       ▼
                    ┌─────────────────────────────────────────┐
                    │         Frontend  (Vercel)              │
                    │   https://deci-project-xfbt.vercel.app  │
                    │   ┌─────────────────────────────────┐   │
                    │   │   Frontend (React + Vite)      │   │
                    │   └─────────────────────────────────┘   │
                    └──────────────────┬─────────────────────┘
                                       │  /api/* (proxy rewrite)
                                       ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                    Backend  (Vercel)                     │
                    │   https://deci-project-backend-94oo.vercel.app          │
                    │ ┌──────────────────┐ ┌───────────────────────────────┐ │
                    │ │  Express App     │ │  Serverless Function           │ │
                    │ │  (main routes)   │ │  /api/reviews/aggregate        │ │
                    │ ├──────────────────┤ └───────────────────────────────┘ │
                    │ │  Auth Routes     │                                   │
                    │ │  Product Routes  │ ┌───────────────────────────────┐ │
                    │ │  Cart Routes     │ │  Review Service (Vercel)       │ │
                    │ │  Image Routes    │ │  https://review-service          │ │
                    │ ├──────────────────┤ │  /reviews/*                    │ │
                    │ │  REST Proxy      │ │  MongoDB (reviews)              │ │
                    │ └──────────────────┘ └───────────────────────────────┘ │
                    └─────────┬──────────┬──────────────────────────────────┘
                              │          │
                              │          │
                              ▼          ▼
                    ┌──────────────────┐ ┌───────────────────────────────────────────────┐
                    │  PostgreSQL      │ │  MongoDB                                       │
                    │  (Supabase)      │ │  (MongoDB Atlas)                               │
                    │  - users table   │ │  - reviews collection                          │
                    │  - refresh_tkns  │ │  - products collection                         │
                    │  - products(*)   │ │  - files (GridFS)                              │
                    │  - carts(*)      │ │  - carts(*)                                   │
                    └──────────────────┘ └───────────────────────────────────────────────┘

(*) = shared collections across services
```

## Traffic Flow

1. **User → Frontend**: Browser loads the React application from Vercel
2. **Frontend → Backend**: `/api/*` requests are rewritten/proxied from frontend to backend via Vercel rewrites in `frontend/vercel.json`
3. **Frontend → Review Service**: `/api/reviews/*` requests forwarded to the separate review service URL
4. **Backend → PostgreSQL (Supabase)**: User auth, products, carts stored in PostgreSQL
5. **Backend → MongoDB (Atlas)**: Images, files stored via GridFS in MongoDB
6. **Backend → Review Service**: Backend proxies review-related API calls via REST to the review service
7. **Review Service → MongoDB (Atlas)**: Reviews stored in the shared MongoDB database
8. **Serverless Function → MongoDB**: Aggregates review statistics on demand
9. **Monitoring → Health Check**: UptimeRobot monitors `https://deci-project-backend-94oo.vercel.app/health`

## Components Summary

| Component         | Provider    | URL / Host                                          |
|------------------|-------------|-----------------------------------------------------|
| Frontend          | Vercel      | https://deci-project-xfbt.vercel.app/               |
| Backend API       | Vercel      | https://deci-project-backend-94oo.vercel.app/         |
| Review Service    | Vercel      | https://deci-project-backend-94oo.vercel.app/       |
| Serverless Fn     | Vercel      | https://deci-project-backend-94oo.vercel.app/api/reviews/aggregate |
| Database          | Supabase    | PostgreSQL (connection via SUPABASE_URL)              |
| NoSQL Storage     | MongoDB Atlas | MongoDB (connection via MONGO_URL)                  |
| Monitoring        | UptimeRobot | Registered on backend /health endpoint              |
| CI/CD             | GitHub Actions | .github/workflows/ci-cd.yml on main branch         |
