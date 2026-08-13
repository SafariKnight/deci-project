# Architecture Decision Record — Task 3

## Context
ShopSphere was a monolithic application with all functionality bundled together. The goal of Task 3 is to modernize the architecture by extracting one microservice and moving one background workload to serverless.

---

## Decision 1: Extract the Review Service into a Microservice

### What was extracted
The **reviews functionality** was extracted into a separate service (`ShopSphere-ReviewService`). This includes:
- Creating and listing reviews for products
- MongoDB collections for storing reviews
- All review-related API endpoints (`POST /reviews`, `GET /reviews/product/:productId`)

### Why the review service was a suitable candidate for extraction

1. **Low coupling**: Reviews are relatively independent of the rest of the application. The only cross-cutting concern is verifying the product exists, which can be handled by the main app forwarding requests.

2. **Independent data store**: Reviews already used MongoDB, which is separate from the PostgreSQL database used for users and products. This natural data separation made the extraction straightforward.

3. **Different scaling requirements**: Reviews are read-heavy and benefit from independent scaling. The review service can be scaled separately from the main e-commerce application without affecting other components.

4. **Limited blast radius**: Extracting reviews does not impact core flows like authentication, product management, or cart operations. The main application continues to function end-to-end after the extraction.

### Implementation approach
The main backend no longer contains review logic locally. Instead, it proxies review requests to the review service via REST. The review service is independently deployed and reachable at its own URL.

---

## Decision 2: Move Review Aggregation to a Vercel Serverless Function

### What was moved to serverless
A **review statistics aggregation** workload was moved to a Vercel serverless function (`api/aggregate-reviews.ts`). This function:
- Connects to MongoDB
- Runs an aggregation pipeline to compute per-product review statistics (average rating, rating distribution, total count)
- Returns aggregated statistics

### Why serverless suits this workload

1. **Background/periodic nature**: The aggregation is a background computation that does not need to run continuously. Serverless functions are ideal for workloads that run on-demand or on a schedule.

2. **Spiky and infrequent demand**: Review aggregation doesn't have consistent traffic — it's triggered periodically or on demand. This is a perfect fit for serverless' pay-per-execution model.

3. **No infrastructure management**: Running a dedicated container or pod just for periodic aggregation is wasteful. The serverless function handles scaling automatically and incurs cost only when it runs.

4. **Decoupled from the main application**: The aggregation function runs outside the main application process, ensuring it doesn't block or slow down user-facing requests.

---

## Status
**Accepted** — Both decisions have been implemented. The review service runs independently, the main backend communicates via REST, and the serverless function is deployed on Vercel.
