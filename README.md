# TeamFlow

Project and Task Management System built with Next.js, Material UI, Express, MongoDB Atlas and JWT cookie authentication.

## Requirements
- Node.js 22 LTS (or currently supported LTS)
- npm and Git
- MongoDB Atlas database

## Local setup
### Backend
```bash
cd backend
cp .env.example .env
# Set MONGODB_URI, JWT_SECRET (32+ random characters), CLIENT_ORIGIN
npm install
# Optional one-time bootstrap: set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in .env, then run:
npm run seed:admin
# Remove the ADMIN_* values after bootstrap; then start the API:
npm run dev
```
API: http://localhost:5000/api/v1; health check: http://localhost:5000/health

### First administrator
Public registration is intentionally disabled. Create the first admin through a one-time seed script or controlled provisioning process. Hash the password with bcrypt before insertion. Never expose unauthenticated admin registration in production.

### Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
Open http://localhost:3000. Set NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1.

## Deployment
- Render: deploy `backend` as a Node web service; build command `npm ci`; start command `npm start`; set backend environment variables.
- Vercel: import repository, set Root Directory to `frontend`, set `NEXT_PUBLIC_API_URL` to the Render API URL plus `/api/v1`.
- Set `CLIENT_ORIGIN` to the exact Vercel origin. For cross-site production cookies, set `COOKIE_SAME_SITE=none`; HTTPS is required for secure cookies.
- Restrict Atlas network access to backend egress IPs where possible; avoid unrestricted network access for production.

## Important production hardening
This is a production-oriented starter, not a completed security audit or feature-complete product. Before production, add CSRF protection for cookie-authenticated mutations, session/refresh-token revocation, full create/edit forms and detail screens, pagination on project lists, audit logging, integration tests, observability, backups, a secure admin bootstrap process and strict production CORS. Verify cross-site cookie settings and test deployment end-to-end.

## API reference
See [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md), [`docs/SRS.md`](docs/SRS.md), and [`docs/TECHNICAL_EXECUTION_PLAN.md`](docs/TECHNICAL_EXECUTION_PLAN.md).
