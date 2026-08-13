# Rollback Plan

## Detection

A failed release is detected through the application's health monitoring:
- **Health endpoint**: `https://deci-project-backend-94oo.vercel.app/health` — returns 500 or becomes unreachable
- **Frontend availability**: `https://deci-project-xfbt.vercel.app/` — pages fail to load or API calls return 5xx
- **Structured logs**: The backend emits error-level logs with timestamps and error details, accessible in Vercel's Logs tab
- **Review service**: `https://deci-project-review.vercel.app/health` — monitor for failures

When the monitoring (set up in Task 1 or the current Task 4 logging) shows errors, health checks fail, or user-facing functionality breaks, immediately initiate rollback.

## Rollback Steps

1. **Identify the failing deployment**
   ```bash
   vercel ls  # list recent deployments
   ```
   Find the deployment that introduced the issue.

2. **Redeploy the previous working version**
   ```bash
   # Redeploy the previous production deployment (alias it back)
   vercel alias set <previous-deployment-url> deci-project-backend-94oo.vercel.app
   vercel alias set <previous-deployment-url> deci-project-xfbt.vercel.app
   ```

   Or use the Vercel dashboard:
   - Go to the project → Deployments
   - Find the last working deployment
   - Click the three-dot menu → "Promote to Production"

3. **Restart the review service if needed**
   ```bash
   vercel alias set <previous-deployment-url> deci-project-review.vercel.app
   ```

4. **Verify recovery**
   - Check the health endpoint: `curl https://deci-project-backend-94oo.vercel.app/health`
   - Test a key user flow (login, product listing, review creation)
   - Confirm logs show no new errors

5. **Notify the team**
   - Send a message in the team channel that rollback was performed
   - Link to the failed deployment for post-mortem analysis

## Post-Rollback

- Investigate the root cause of the failed deployment
- Fix the issue in a new branch and test thoroughly
- Redeploy through the normal CI/CD pipeline only after tests pass
