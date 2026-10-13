# BhumiLobhi

**Land Ownership Conflict Intelligence Platform** built for a university LandTech hackathon. BhumiLobhi provides a workspace for searching synthetic owner records, exploring plots and ownership history, reviewing rule-based conflict alerts, and comparing deed-file hashes.

> This is a prototype using synthetic demonstration records. It is not an official land-record system, legal title opinion, or fraud determination.

## Features

- Account registration, login, session restoration, and logout.
- Owner search by synthetic identifier, with linked plots and recorded shares.
- Plot details, ownership history, and rule-based conflict analysis.
- Database-backed dashboard counts and recent conflict alerts.
- Alert filtering by plot and status.
- Deed file SHA-256 comparison against a stored reference digest. A digest match only confirms file integrity; it does not prove legal authenticity.

## Stack

- Frontend: React, TypeScript, Vite, React Router.
- Backend: FastAPI, SQLAlchemy, PostgreSQL.
- Authentication: Argon2id password hashes, short-lived signed access tokens, and rotating HttpOnly refresh cookies.

## Requirements

- Python 3.14 (or a compatible Python version supported by the installed project dependencies).
- Node.js and npm.
- Docker Compose, or a PostgreSQL 16 server.

## Local Setup

Run commands below from the repository root unless a command says otherwise.

### 1. Start PostgreSQL

The included Compose service uses development-only local credentials and stores data in a persistent Docker volume:

```sh
docker compose up -d db
```

Do not use the Compose development password outside local development. Do not use `docker compose down -v` unless you intentionally want to delete the local database volume.

### 2. Configure the backend

Create the virtual environment and install backend dependencies:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
```

Create a private local environment file from the placeholders:

```sh
cp backend/.env.example backend/.env
chmod 600 backend/.env
```

Set these values in `backend/.env` for the included local Compose database:

```dotenv
DATABASE_URL=postgresql+psycopg://bhumilobhi:local-dev-only@localhost:5432/bhumilobhi
AUTH_SECRET_KEY=<paste-the-output-of-openssl-rand-hex-32>
APP_ENV=development
AUTH_COOKIE_SECURE=false
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Generate a new local signing key and put its output in place of the placeholder:

```sh
openssl rand -hex 32
```

Never commit `backend/.env` or use a real credential in `.env.example`. The example file intentionally contains placeholders.

### 3. Initialize and seed local data

On startup, the current development backend creates missing ORM tables without deleting existing tables or rows. Load the synthetic sample records with:

```sh
PYTHONPATH="$PWD/backend" .venv/bin/python backend/seed.py
```

The seed script only inserts its known records when their IDs are absent; it does not reset the database.

For an existing PostgreSQL database, apply the additive authentication migration before deploying the new backend. From the repository root, with `DATABASE_URL` set in your shell:

```sh
psql "${DATABASE_URL/postgresql+psycopg:/postgresql:}" \
	-v ON_ERROR_STOP=1 \
	-f database/migrations/001_auth.sql
```

The migration only adds `users` and `auth_sessions`; it does not remove or recreate land-record tables.

### 4. Start the backend

```sh
PYTHONPATH="$PWD/backend" .venv/bin/python -m uvicorn app.main:app \
	--app-dir "$PWD/backend" \
	--reload-dir "$PWD/backend" \
	--host 127.0.0.1 --port 8000 --reload
```

Check the database-backed health response at <http://127.0.0.1:8000/api/v1/health>. Interactive API documentation is available at <http://127.0.0.1:8000/docs>.

### 5. Start the frontend

In a second terminal:

```sh
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The default API base URL is `http://localhost:8000/api/v1`. To override it, copy `frontend/.env.example` to `frontend/.env.local` and set `VITE_API_BASE_URL`.

## API Routes

Business routes require a bearer access token. The frontend keeps the short-lived access token in memory and uses the HttpOnly refresh cookie to restore sessions.

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Create an account |
| `POST` | `/api/v1/auth/login` | Sign in |
| `POST` | `/api/v1/auth/refresh` | Rotate the refresh session |
| `GET` | `/api/v1/auth/me` | Return the current public user |
| `POST` | `/api/v1/auth/logout` | Revoke the current session |
| `GET` | `/api/v1/dashboard/summary` | Database-backed dashboard counts and recent alerts |
| `POST` | `/api/v1/owners/search` | Search by `synthetic_identifier` |
| `GET` | `/api/v1/plots/{plot_id}` | Plot and active ownership details |
| `GET` | `/api/v1/plots/{plot_id}/history` | Ownership and deed timeline |
| `POST` | `/api/v1/fraud/analyze/{plot_id}` | Run and save rule-based conflict analysis |
| `GET` | `/api/v1/fraud/alerts` | List saved alerts; optional `plot_id` and `status` filters |
| `POST` | `/api/v1/deeds/{deed_id}/verify` | Upload a file and compare its digest with the stored reference |

The deed verification upload limit is 10 MB. Files are hashed in memory and discarded. If no reference hash is stored, the endpoint returns `NO_REFERENCE`; it does not treat the upload as a new trusted reference.

## Tests and Build

From the repository root:

```sh
PYTHONPATH="$PWD/backend" .venv/bin/python -m pytest backend/tests -q
npm --prefix frontend run build
```

Backend tests use an isolated SQLite database. They do not require resetting or modifying the configured PostgreSQL database.

## Security and Deployment Notes

- Use a unique `AUTH_SECRET_KEY` of at least 32 characters per deployment. Keep it private and back it up securely; changing it invalidates existing access tokens.
- Set `APP_ENV=production` and `AUTH_COOKIE_SECURE=true` when serving over HTTPS. Production startup rejects insecure refresh cookies.
- Set `CORS_ORIGINS` to the exact trusted frontend origins; do not use wildcard origins with credentials.
- Failed logins are limited to five attempts per client IP per 15-minute window in the current process. Before running multiple workers or instances, move this limiter to a shared store such as Redis.
- The synthetic owner identifiers are not national IDs. Never put real personal, ownership, or deed data into this hackathon prototype.

More detail: [Authentication notes](docs/authentication.md), [API specification](docs/api-spec.md), and [Architecture](docs/architecture.md).

## Data Policy

Use only synthetic demonstration records for local development and testing. Never commit secrets, personal information, real land records, or real deed files.

## AI Disclosure

Conflict flags are generated by deterministic ownership-record rules. They are investigation leads for human review, not legal advice, an official registry result, or a finding of fraud.
