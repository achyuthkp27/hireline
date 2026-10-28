# Environment variables

Every variable the Hireline server reads, and the ones its Docker files read. Most settings live in the app, in Settings: the variables here are for what the server needs before it starts, and for defaults you'd rather set from a file.

How they're read:

- The server checks them when it starts. If one is missing or wrong, it stops, with one line per problem, such as `Hireline can't start: HIRELINE_SECRET is not set.` It never prints the values. [Troubleshooting](troubleshooting.md#hireline-cant-start-a-variable-is-missing-or-wrong) lists the messages.
- An empty value, such as `HIRELINE_AI_KEY=`, counts as not set.
- Restart Hireline after you change one. With Docker Compose, `docker compose up -d` does it.
- With Docker Compose, put them in the `.env` next to `compose.yml`. The Compose file only passes some of them on: see [Docker Compose](#docker-compose) below.

## Required

| Variable | What it does |
|---|---|
| `HIRELINE_PASSWORD` | A hash of the password you sign in with, never the password itself. Make it with `hash-password` (see the [installation guide](install.md#installing-hireline)); it starts with `argon2id:`. It's only read from here: it isn't stored in the database, and can't be changed in the app. A new hash signs out every session, and Claude too. |
| `HIRELINE_SECRET` | Signs sessions, and encrypts saved API keys, the Google client's secret and Google's access. At least 32 random characters, such as the output of `openssl rand -base64 32`. Changing it signs you out, and saved keys have to be entered again. Keep it with your backups. |
| `DATABASE_URL` | The PostgreSQL connection string, starting with `postgresql://` or `postgres://`, such as `postgresql://hireline:<password>@localhost:5432/hireline`. The Compose files set it for you. |

## Data and backups

| Variable | What it does | Default |
|---|---|---|
| `HIRELINE_DATA_DIR` | Where backups and the zips from **Download all PDFs** are written. A relative path is resolved from the server's working directory, which for a Node.js build is `.next/standalone`: use a full path. | `/data` |
| `HIRELINE_BACKUP_RETENTION_DAYS` | How many days of backups to keep: a whole number, at least 1. | `14` |
| `TZ` | The server's time zone, such as `Europe/Berlin`. Nightly backups run at 03:00 in it, and their file names use it. Set it in Docker, where the default is usually UTC. | The system's |

## AI provider

Defaults for Settings → AI provider. Once you pick a provider there, Settings decides. [Choosing an AI provider](ai-providers.md#set-it-with-environment-variables) explains how the two combine.

| Variable | What it does | Default |
|---|---|---|
| `HIRELINE_AI_PROVIDER` | `local` (Ollama or llama.cpp), `lmstudio`, `openai` (any OpenAI-compatible server), `anthropic` or `mistral`, in lower case. | Unset: no provider is chosen |
| `HIRELINE_AI_URL` | The model server's address, `http://` or `https://`. | `http://localhost:11434` for `local`, `http://host.docker.internal:1234` for `lmstudio`, `https://api.openai.com/v1` for `openai`, `https://api.anthropic.com` for `anthropic`, `https://api.mistral.ai/v1` for `mistral` |
| `HIRELINE_AI_MODEL` | The model's name. | `claude-sonnet-5` for `anthropic`, `mistral-medium-latest` for `mistral`, none for the others |
| `HIRELINE_AI_KEY` | The API key. It also serves a provider saved in Settings, of the same kind, that has no key of its own. | None |
| `HIRELINE_AI_TIMEOUT_SECONDS` | How long one AI call may take, in whole seconds, at least 5. It always applies: there's no setting for it in the app. | `300` for `local` and `lmstudio`, `120` for the hosted ones |

## Job search

Defaults for Settings → Job search. A choice saved there wins, and so does a key saved there. See [Choosing a job source](job-sources.md#set-it-with-environment-variables).

| Variable | What it does | Default |
|---|---|---|
| `HIRELINE_JOBS_SOURCE` | `jsearch`, `adzuna`, `arbeitsagentur` or `off`. | Unset: off |
| `HIRELINE_JSEARCH_KEY` | Your JSearch key. | None |
| `HIRELINE_JSEARCH_HOST` | Where that key is from: `openwebninja` or `rapidapi`. | `openwebninja` |
| `HIRELINE_ADZUNA_APP_ID` | Your Adzuna app ID. | None |
| `HIRELINE_ADZUNA_KEY` | Your Adzuna app key. | None |
| `HIRELINE_JOBS_ARBEITSAGENTUR` | `off` takes the unofficial Bundesagentur für Arbeit source out of Hireline altogether; `on` offers it. It can't be `off` while `HIRELINE_JOBS_SOURCE` is `arbeitsagentur`. | `on` |

## Google and your address

| Variable | What it does | Default |
|---|---|---|
| `HIRELINE_GOOGLE_CLIENT_ID` | The ID of your Google OAuth client, for Gmail and Calendar. One saved in Settings → Google wins. See [Connecting Gmail and Calendar](gmail-and-calendar.md). | None |
| `HIRELINE_GOOGLE_CLIENT_SECRET` | That client's secret. One saved in Settings → Google wins. | None |
| `HIRELINE_PUBLIC_URL` | The address Hireline is reached at, such as `https://hireline.example.com`, `http://` or `https://`, without a path. Google's redirect URI and the Claude connector's address are built from it. A trailing `/` is dropped. | The address in the browser: behind a reverse proxy, its forwarded host and protocol |

## Set by the image

The Docker image sets these itself. Running with Node.js, you only need `PORT` and `HOSTNAME`, if at all.

| Variable | What it does | In the image | Without it |
|---|---|---|---|
| `PORT` | The port the server listens on. The PDF printer reaches the app on it too. | `3000` | `3000` |
| `HOSTNAME` | The address the server listens on. Use `127.0.0.1` to keep a Node.js install off the network. | `0.0.0.0` | `0.0.0.0` |
| `HIRELINE_DATA_DIR` | See [Data and backups](#data-and-backups). | `/data` | `/data` |
| `NODE_ENV` | `production` for a production server. The standalone server sets it itself. | `production` | |
| `NEXT_TELEMETRY_DISABLED` | Turns Next.js's own telemetry off. | `1` | |
| `PLAYWRIGHT_BROWSERS_PATH` | Where Chromium for the PDFs is installed. Without it, Playwright uses the cache folder of the user that installed it. | `/ms-playwright` | That user's cache folder |

## Docker Compose

These are read by `compose.production.yml` (the file the [installation guide](install.md#run-locally-with-docker-compose) saves as `compose.yml`), not by Hireline.

| Variable | What it does | Default |
|---|---|---|
| `POSTGRES_PASSWORD` | The database's password. Required. Use letters and digits only, such as `openssl rand -hex 24`: it goes into `DATABASE_URL`. PostgreSQL only takes it when it first sets up the database: changing it later doesn't change the database's password. | None |
| `HIRELINE_IMAGE` | The image to run, such as a version (`ghcr.io/achyuthkp27/hireline:v1.0.0`) or your own build (`hireline:local`). | `ghcr.io/achyuthkp27/hireline:latest` |
| `HIRELINE_PORT` | The port on your computer, on `127.0.0.1` only. Inside the container it's still 3000. | `3000` |
| `COMPOSE_PROFILES` | `ai` also runs the Ollama service, at `http://ollama:11434`. This one is Docker Compose's own variable. | Unset |

The Compose file makes `DATABASE_URL` from `POSTGRES_PASSWORD` (user and database `hireline`), and passes these from `.env` to Hireline: `HIRELINE_PASSWORD`, `HIRELINE_SECRET`, `HIRELINE_BACKUP_RETENTION_DAYS`, `TZ`, `HIRELINE_AI_PROVIDER`, `HIRELINE_AI_URL`, `HIRELINE_AI_MODEL`, `HIRELINE_AI_KEY`, `HIRELINE_AI_TIMEOUT_SECONDS`, `HIRELINE_JOBS_SOURCE`, `HIRELINE_JSEARCH_KEY`, `HIRELINE_JSEARCH_HOST`, `HIRELINE_ADZUNA_APP_ID`, `HIRELINE_ADZUNA_KEY`, `HIRELINE_GOOGLE_CLIENT_ID`, `HIRELINE_GOOGLE_CLIENT_SECRET` and `HIRELINE_PUBLIC_URL`.

Any other, such as `HIRELINE_JOBS_ARBEITSAGENTUR`, goes in `compose.override.yml`, as in [Set other variables](install.md#set-other-variables).

The development Compose file, `compose.yml` in the repository, reads `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` and `POSTGRES_PORT` instead, which default to `postgres`, `postgres`, `hireline` and `5432`. See [DEVELOPMENT.md](../DEVELOPMENT.md).

## For tests only

The end-to-end tests point Hireline at fake services with `HIRELINE_JOBS_TEST_BASE_URL` (the job sources), `HIRELINE_GOOGLE_TEST_BASE_URL` (Google) and `HIRELINE_UPDATES_TEST_BASE_URL` (the update check). Never set them on a real server: they send those requests somewhere else. [DEVELOPMENT.md](../DEVELOPMENT.md#tests-and-checks) covers these and the other variables the test suites use.
