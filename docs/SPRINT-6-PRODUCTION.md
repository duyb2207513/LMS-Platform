# Sprint 6 — Production readiness

## Authentication

- Email verification: `POST /api/v1/auth/verify-email` and `POST /api/v1/auth/resend-verification`.
- Forgot/reset password: `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password`.
- Google login: frontend Google Identity Services sends an ID token to `POST /api/v1/auth/google`; the backend verifies its audience with `GOOGLE_CLIENT_ID`.
- GitHub login: `GET /api/v1/auth/github` starts Authorization Code OAuth with a CSRF state cookie. GitHub redirects to `/api/v1/auth/github/callback`, then the frontend obtains the LMS access token through the existing refresh-token cookie.
- Email change uses a one-time confirmation sent to the new address.
- Refresh tokens are rotated and represented by revocable rows in `auth_sessions`.
- Five failed logins lock the account temporarily by default.

Development mail uses JSON transport and logs the action URL. Production must configure SMTP. Set `REQUIRE_EMAIL_VERIFICATION=true` only after SMTP is working.

For local GitHub OAuth, put `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` and `GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback` in `backend/.env`. Never expose the client secret to the frontend. Create a separate GitHub OAuth App and callback URL for production.

## Security and observability

- Global and auth-specific rate limiting, Helmet headers and hidden Express signature.
- File MIME allowlists, size limits and magic-byte validation.
- Ownership checks for courses, sections, lessons, quizzes, questions and options.
- Mutating API requests and important auth events are stored in `audit_logs`.
- Pino emits structured logs and redacts credentials/tokens.
- Set `SENTRY_DSN` to enable production error tracking.
- `/api/v1/health` is the liveness endpoint; `/api/v1/health/ready` checks PostgreSQL readiness.

## Environments and deployment

- Local development defaults to `lms_db`.
- GitHub CI sets `POSTGRES_DB=lms_test` and runs lint, type-check, unit, integration, frontend build and E2E.
- Production uses `.env.production` and `docker-compose.prod.yml` with its own database volume.
- To enable deployment after a successful merge to `main`, set repository variable `AUTO_DEPLOY_ENABLED=true` and secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH`.

## Database backup

From PowerShell:

```powershell
.\scripts\backup-db.ps1
```

Backups are written under `backups/` with a timestamp. Copy them to encrypted off-site storage and schedule the script with Windows Task Scheduler or the server scheduler.
