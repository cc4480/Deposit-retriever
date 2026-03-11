# Production Readiness Assessment — The Deposit Retriever

**Date:** 2026-03-11
**Status:** NOT PRODUCTION READY
**Codebase:** React 19 + TypeScript frontend, Flask + Python backend, SQLite database

---

## Executive Summary

The Deposit Retriever is a legal tech application that helps tenants recover security deposits through AI-generated demand letters. It has a solid foundation (modern tech stack, clean component structure, comprehensive state law data, good AI integration with retries), but **lacks critical production requirements** in security, testing, observability, and deployment infrastructure.

---

## Current Strengths

- Modern frontend stack (React 19, TypeScript, Vite)
- Clean component architecture with clear page-based routing
- Comprehensive state law database covering all 50 US states
- Robust Gemini AI integration with exponential backoff retry logic
- Digital signature capture and PDF generation
- User-friendly error messaging
- Interactive tour/onboarding system

---

## Critical Gaps & Tasks

### P0 — Security (Must Fix Before Any Production Use)

- [ ] **Move GEMINI_API_KEY to backend-only proxy**
  The API key is currently injected into the frontend via `vite.config.ts` and is visible in browser dev tools. All AI calls must be proxied through the Flask backend.

- [ ] **Implement user authentication and authorization**
  No auth exists. Cases are accessible by UUID with no ownership checks. Add authentication (e.g., Auth0, Supabase, or session-based) and tie cases to authenticated users.

- [ ] **Replace hardcoded SECRET_KEY**
  `main.py` defaults to `'dev-secret-key'` for Flask's session secret. This must be a strong, randomly generated value loaded from environment variables with no fallback.

- [ ] **Add CSRF protection**
  Form submissions have no CSRF tokens. Add Flask-WTF or equivalent CSRF middleware.

- [ ] **Add input validation and sanitization**
  - Signature data is only checked for length (>100 chars)
  - Address verification is a mock (length check only)
  - Letter text is user-editable with no sanitization
  - Custom notes are sent directly to the AI without filtering

- [ ] **Encrypt sensitive data at rest**
  Signatures (base64), addresses, names, and emails are stored in plaintext in the database. Encrypt PII columns or use application-level encryption.

- [ ] **Add rate limiting**
  No rate limiting exists on any endpoint. Add per-IP and per-user rate limits (e.g., Flask-Limiter) to prevent abuse and AI quota exhaustion.

- [ ] **Configure security headers**
  No Content-Security-Policy, X-Frame-Options, Strict-Transport-Security, or other security headers. Add Flask-Talisman or equivalent.

- [ ] **Add CORS configuration**
  No CORS policy is configured. Define explicit allowed origins for the frontend.

---

### P1 — Reliability & Data Integrity

- [ ] **Migrate from SQLite to PostgreSQL**
  SQLite is not suitable for concurrent production use. Migrate to PostgreSQL (or another production-grade RDBMS) and update `DATABASE_URL` handling.

- [ ] **Add database migrations with Alembic**
  Tables are auto-created via `db.create_all()` in a `before_request` hook. This is fragile and doesn't support schema changes. Add Flask-Migrate (Alembic) for versioned migrations.

- [ ] **Remove `db.create_all()` from `before_request`**
  Running schema setup on every request is a performance and reliability anti-pattern. Run migrations as a deployment step instead.

- [ ] **Add database connection pooling and health checks**
  No connection pool configuration or database health monitoring exists.

- [ ] **Implement data backup strategy**
  No backup mechanism for the database. Configure automated backups for the production database.

- [ ] **Add request timeout handling**
  Gemini AI calls can take significant time. Add explicit timeouts to prevent hung requests from consuming server resources.

- [ ] **Clean up temp files**
  `instance/tmp/` directory is created for PDF generation but files are never cleaned up. Add a cleanup strategy (e.g., cron job, post-response hook).

- [ ] **Complete Lob.com certified mail integration**
  The `lob.ts` service is a mock/stub. For production, implement real Lob API integration or clearly mark this as a future feature.

---

### P2 — Testing

- [ ] **Set up pytest for backend**
  No tests exist. Add pytest with fixtures for Flask app, database, and mocked Gemini responses. Cover all routes and the letter generation logic.

- [ ] **Set up Vitest for frontend**
  No frontend tests exist. Add Vitest (Vite-native) with React Testing Library. Cover form validation, state transitions, and service functions.

- [ ] **Add integration tests for API endpoints**
  Test the full request/response cycle for `/analyze`, `/generate`, `/send`, `/download_pdf` with various inputs including edge cases.

- [ ] **Add end-to-end tests**
  Add Playwright or Cypress for critical user flows: create case → generate letter → sign → download PDF.

- [ ] **Add AI response mocking for tests**
  Mock Gemini API responses to enable deterministic testing without API calls.

---

### P3 — Observability & Monitoring

- [ ] **Add structured logging**
  Both frontend (`logger.ts`) and backend use plain-text console logging. Switch to structured JSON logging (e.g., `structlog` for Python) for better parsing by log aggregation tools.

- [ ] **Integrate error tracking service (Sentry)**
  No error aggregation exists. Add Sentry or equivalent for both frontend and backend to capture, alert on, and triage errors.

- [ ] **Add request logging middleware**
  No request/response logging. Add middleware to log method, path, status code, duration for all requests.

- [ ] **Add health check endpoint**
  No `/health` or `/ready` endpoint for load balancers and orchestrators to verify the app is running.

- [ ] **Add application metrics**
  No metrics collection. Add Prometheus metrics or equivalent for request rates, error rates, AI call latency, and database query times.

---

### P4 — DevOps & Deployment

- [ ] **Add Dockerfile and docker-compose**
  No containerization exists. Create a multi-stage Dockerfile for production builds and docker-compose for local development.

- [ ] **Set up CI/CD pipeline (GitHub Actions)**
  No CI/CD exists. Add workflows for: lint, type-check, test, build, and deploy on push/PR.

- [ ] **Add linting and formatting enforcement**
  No linter or formatter configured. Add ESLint + Prettier for frontend, Ruff or Black + isort for backend.

- [ ] **Create environment-specific configurations**
  No separation between dev/staging/production configs. Add config files or env-based switching for database URLs, debug flags, log levels, and API endpoints.

- [ ] **Add .env.example file**
  No template for required environment variables. Create `.env.example` documenting all required and optional variables.

- [ ] **Configure HTTPS / TLS**
  No HTTPS redirect or TLS configuration. Ensure the production deployment enforces HTTPS.

- [ ] **Set up reverse proxy (nginx)**
  No reverse proxy configured. Gunicorn should sit behind nginx or a cloud load balancer for production.

- [ ] **Pin Python version**
  No `runtime.txt`, `.python-version`, or `pyproject.toml` specifying the Python version. Pin it to avoid surprises.

---

### P5 — Compliance & Legal

- [ ] **Implement data retention and deletion policy**
  No mechanism to delete cases or user data. Required for GDPR/CCPA compliance.

- [ ] **Add terms of service and legal disclaimers**
  The app generates legal documents. Users must acknowledge that generated letters are not legal advice and accept terms of service.

- [ ] **Add cookie consent mechanism**
  If deploying in regions covered by GDPR/ePrivacy, cookie consent is required.

- [ ] **Conduct legal review of AI-generated letter templates**
  Ensure AI-generated content is legally sound and appropriately disclaimed.

- [ ] **Add user data export functionality**
  GDPR right to data portability requires users to be able to export their data.

---

### P6 — UX & Documentation

- [ ] **Improve README with full setup instructions**
  Current README is minimal (553 bytes). Add architecture overview, development setup for both frontend and backend, environment variables, and deployment instructions.

- [ ] **Add API documentation**
  No API docs for Flask routes. Add Swagger/OpenAPI spec or at minimum document endpoints, parameters, and responses.

- [ ] **Add error pages (404, 500)**
  No custom error pages. Users see raw Flask errors on failures.

- [ ] **Add loading states and progress indicators for AI generation**
  AI letter generation can take time. Ensure clear feedback during long operations.

---

## Recommended Priority Order

1. **Security fixes (P0)** — Mandatory before any external users
2. **Data reliability (P1)** — Required for trustworthy production data
3. **Basic testing (P2)** — Needed before confident deployments
4. **CI/CD + containerization (P4)** — Enables safe, repeatable deploys
5. **Observability (P3)** — Required to operate and debug in production
6. **Compliance (P5)** — Legally necessary for a legal tech app
7. **Documentation & UX polish (P6)** — Important for maintainability and user trust

---

## Architecture Recommendations

| Component | Current | Recommended |
|-----------|---------|-------------|
| Frontend hosting | Vite dev server | Vercel, Netlify, or S3 + CloudFront |
| Backend hosting | Flask dev server | Gunicorn behind nginx on ECS/Railway/Render |
| Database | SQLite | PostgreSQL (managed: RDS, Supabase, Neon) |
| Auth | None | Auth0, Supabase Auth, or Flask-Login |
| AI calls | Direct from frontend | Backend proxy only |
| Mail service | Mock/stub | Lob.com (real integration) |
| Error tracking | Console logs | Sentry |
| Secrets | Hardcoded / env vars | AWS Secrets Manager, Doppler, or Vault |
