# Authentication

BhumiLobhi uses Argon2id password hashes, 15-minute signed access tokens, and
rotating opaque refresh tokens. The access token is returned in the response
body and should only be kept in frontend memory. The refresh token is stored
as a `Secure`-configurable, `HttpOnly`, `SameSite=Lax` cookie scoped to
`/api/v1/auth`; logout revokes its database session immediately.

Registration and login return a public user object with no password data.
Business API routers require a valid bearer access token. Health and auth
registration, login, and refresh endpoints are public. No client-provided role
is accepted or stored.

Failed logins are limited to five per client IP per 15-minute window in the
current process. This is suitable for a single-process hackathon deployment;
multi-worker or multi-instance deployments must move the counter to a shared
store such as Redis before scaling.

Apply the additive PostgreSQL migration from the repository root with Bash
after exporting `DATABASE_URL` (the example converts the SQLAlchemy driver
suffix to the URL scheme accepted by `psql`):

```sh
psql "${DATABASE_URL/postgresql+psycopg:/postgresql:}" -v ON_ERROR_STOP=1 -f database/migrations/001_auth.sql
```

Set `AUTH_SECRET_KEY` to a freshly generated value of at least 32 characters.
Set `APP_ENV=production` and enable `AUTH_COOKIE_SECURE=true` behind HTTPS in
deployed environments; production startup rejects insecure refresh cookies.