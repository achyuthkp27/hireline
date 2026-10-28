# Installing Hireline

Hireline is one Node.js server and a PostgreSQL database. The server prints PDFs with its own headless Chromium, keeps backups in a data folder, and brings the database up to date each time it starts.

There are three ways to run it on your own computer, and four ways to put it on a server:

- [Run locally with Docker Compose](#run-locally-with-docker-compose): the quickest way, and the one the [README](../README.md) shows.
- [Run locally with Docker](#run-locally-with-docker): the same image, started with `docker run`.
- [Run locally with Node.js](#run-locally-with-nodejs): built from source, without Docker.
- [Self-host on an Ubuntu server](#self-host-on-an-ubuntu-server), with Docker Compose and Caddy, or with Node.js and no Docker.
- [Self-host with CapRover](#self-host-with-caprover), [Coolify](#self-host-with-coolify) or [Dokploy](#self-host-with-dokploy).

**The Docker image** is `ghcr.io/achyuthkp27/hireline`. It's built for Intel and AMD (x86-64) processors. The `latest` tag points at the newest release, and a release also has a tag of its own, such as `v1.0.0`. Until the first release is out there is no `latest`, so build the image yourself from the `Dockerfile`: each section below shows how.

**Every server setup needs** the same few things, whatever runs it:

- A PostgreSQL database. The Compose files use PostgreSQL 18.
- Three variables: `DATABASE_URL`, `HIRELINE_PASSWORD` (a hash of your password, never the password itself) and `HIRELINE_SECRET` (at least 32 random characters). [Environment variables](environment-variables.md) has the rest.
- A persistent folder at `/data` in the container. Nightly backups, the backup taken before each import and the zips from **Download all PDFs** go there.
- A reverse proxy that serves HTTPS in front of port 3000. Don't open port 3000 to the internet: sign-in rate limiting trusts the last `X-Forwarded-For` entry, which only a proxy sets reliably (see [SECURITY.md](../SECURITY.md)).
- `HIRELINE_PUBLIC_URL` set to that HTTPS address, such as `https://hireline.example.com`, for Google's redirect and the Claude connector.
- `TZ` set to your time zone, such as `Europe/Berlin`. Nightly backups run at 03:00 in it.
- At least 768 MB of memory for the container, Chromium included. The Compose file gives it 1 GB. Give the server itself at least 2 vCPUs and 2 GB.
- One copy of the app per database. The nightly backups, the AI job queue and the PDF browser live inside the app's process.

The health check is `GET /api/health`. It answers 200 while the database answers, and 503 when it doesn't. The image has a health check of its own that uses it.

To make the password hash, run this on any computer with Docker. It asks for the password twice and prints one line that starts with `argon2id:`:

```bash
docker run --rm -it ghcr.io/achyuthkp27/hireline hash-password
```

On an Apple Silicon Mac, add `--platform linux/amd64` after `-it`. With an image you built yourself, use its name, such as `hireline:local`. With Node.js and a copy of the source, `yarn hash-password` does the same. To make the secret, run `openssl rand -base64 32`.

## Run locally with Docker Compose

You need [Docker Desktop](https://docs.docker.com/desktop/) on macOS or Windows, or Docker Engine with its Compose plugin on Linux, and about 2 GB of free memory. Run the commands in a terminal: macOS's Terminal, Linux, or WSL on Windows.

**1. Fetch the Compose file** into a folder of its own, and make the secrets Hireline needs:

```bash
mkdir ~/hireline && cd ~/hireline
curl -fsSL -o compose.yml https://raw.githubusercontent.com/achyuthkp27/hireline/main/compose.production.yml
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" > .env
echo "HIRELINE_SECRET=$(openssl rand -base64 32)" >> .env
```

The database password is hex on purpose: it goes into a connection string, where characters such as `@` or `/` would break it.

On an Apple Silicon Mac, also make a `compose.override.yml`. The image is built for Intel and AMD processors, and Docker Desktop runs it under emulation:

```bash
printf 'services:\n  app:\n    platform: linux/amd64\n' > compose.override.yml
```

**2. Choose your password.** This asks for it twice and prints its hash:

```bash
docker run --rm -it --platform linux/amd64 ghcr.io/achyuthkp27/hireline hash-password
```

Add that line to `.env` as `HIRELINE_PASSWORD=argon2id:…`, with any text editor.

**3. Start it:**

```bash
docker compose up -d
```

The first start downloads the images and sets up the database. Open [http://localhost:3000](http://localhost:3000), sign in with your password, and pick an AI model in **Settings → AI provider** (see [Choosing an AI provider](ai-providers.md)).

Compose publishes the app on `127.0.0.1` only, so it's reachable from your own computer and nowhere else.

### Stop, start and read the logs

```bash
docker compose stop          # stops it; your data stays
docker compose start         # starts it again
docker compose logs -f app   # follows the server's log; Ctrl-C to leave
```

### Use another port

Port 3000 taken? Add a line to `.env`, then apply it:

```bash
echo "HIRELINE_PORT=3100" >> .env
docker compose up -d
```

Hireline is then at [http://localhost:3100](http://localhost:3100). `HIRELINE_PORT` only changes the port on your computer; inside the container it's still 3000.

### Set your time zone

Add `TZ` to `.env` with a name from the time zone database, then run `docker compose up -d`:

```bash
echo "TZ=Europe/Berlin" >> .env
docker compose up -d
```

Nightly backups run at 03:00 in that zone, and their file names and the "Last one ran" time in Settings use it too. Without `TZ`, the container's own zone applies, which in Docker is usually UTC. Setting it also avoids an error some installs see without it (see [Troubleshooting](troubleshooting.md#the-log-says-invalid-time-zone-specified-etcunknown)).

### Run a local model next to it

The Compose file has an Ollama service, off by default. To run it with Hireline:

```bash
echo "COMPOSE_PROFILES=ai" >> .env
docker compose up -d
docker compose exec ollama ollama pull qwen2.5:3b
```

Then choose **Local model** in Settings → AI provider, with the address `http://ollama:11434`. [Choosing an AI provider](ai-providers.md#local-model-ollama-or-llamacpp) has more.

### Set other variables

The Compose file passes these variables from `.env` to Hireline: `HIRELINE_PASSWORD`, `HIRELINE_SECRET`, `HIRELINE_BACKUP_RETENTION_DAYS`, `TZ`, the `HIRELINE_AI_*` variables, `HIRELINE_JOBS_SOURCE`, `HIRELINE_JSEARCH_KEY`, `HIRELINE_JSEARCH_HOST`, `HIRELINE_ADZUNA_APP_ID`, `HIRELINE_ADZUNA_KEY`, `HIRELINE_GOOGLE_CLIENT_ID`, `HIRELINE_GOOGLE_CLIENT_SECRET` and `HIRELINE_PUBLIC_URL`. It makes `DATABASE_URL` itself, from `POSTGRES_PASSWORD`.

For any other variable, add it to the `app` service in `compose.override.yml`, so the Compose file stays as you downloaded it. For example, to take the unofficial German job source out of Hireline:

```yaml
services:
  app:
    environment:
      HIRELINE_JOBS_ARBEITSAGENTUR: "off"
```

On an Apple Silicon Mac, keep the `platform: linux/amd64` line in the same `app` section. Run `docker compose up -d` after any change.

### Build the image yourself

Before the first release, or to run a version you changed, build the image from the source:

```bash
git clone https://github.com/achyuthkp27/hireline.git ~/hireline-source
docker build -t hireline:local ~/hireline-source
echo "HIRELINE_IMAGE=hireline:local" >> ~/hireline/.env
```

Use `hireline:local` in place of `ghcr.io/achyuthkp27/hireline` everywhere, including for `hash-password`: `docker run --rm -it hireline:local hash-password`. The build takes several minutes.

On an Apple Silicon Mac with the `compose.override.yml` above, build it for the same platform: `docker build --platform linux/amd64 -t hireline:local ~/hireline-source`. Under emulation, this takes much longer.

### Upgrade

```bash
cd ~/hireline
docker compose pull
docker compose up -d
```

Hireline applies any database changes as it starts. With your own image, build it again from the new source instead of `docker compose pull`. [Upgrading](upgrading.md) has more, including how to stay on one version.

### Remove it

`docker compose down` stops Hireline and removes its containers, and keeps your data in Docker volumes. `docker compose up -d` brings it back.

To remove everything, export your data first if you might want it again (Settings → Your data → **Export**). Then:

```bash
cd ~/hireline
docker compose down -v
docker image rm ghcr.io/achyuthkp27/hireline:latest postgres:18-alpine
```

`-v` deletes the database, the backups and any Ollama models for good. If you ran Ollama, also remove its image, `ollama/ollama:0.40.6`. Then delete the `~/hireline` folder, which holds your `.env`.

## Run locally with Docker

This runs the same two containers as Compose, with plain `docker` commands.

**1. Make the secrets.** These commands write two files: `db.env` for the database, and `hireline.env` for Hireline.

```bash
mkdir ~/hireline && cd ~/hireline
DB_PASSWORD=$(openssl rand -hex 24)
printf 'POSTGRES_USER=hireline\nPOSTGRES_DB=hireline\nPOSTGRES_PASSWORD=%s\n' "$DB_PASSWORD" > db.env
printf 'DATABASE_URL=postgresql://hireline:%s@hireline-db:5432/hireline\n' "$DB_PASSWORD" > hireline.env
echo "HIRELINE_SECRET=$(openssl rand -base64 32)" >> hireline.env
echo "TZ=Europe/Berlin" >> hireline.env
```

Change `Europe/Berlin` to your own time zone.

**2. Choose your password.** Make its hash as shown at the [top of this page](#installing-hireline), and add it to `hireline.env` as `HIRELINE_PASSWORD=argon2id:…`. Docker reads these files as they are, so don't put quotes around any value.

**3. Start the database:**

```bash
docker network create hireline
docker run -d --name hireline-db --network hireline --restart unless-stopped \
  --env-file db.env -v hireline-db:/var/lib/postgresql postgres:18-alpine
```

**4. Start Hireline:**

```bash
docker run -d --name hireline --network hireline --restart unless-stopped \
  --env-file hireline.env -v hireline-data:/data -p 127.0.0.1:3000:3000 \
  --memory 1g --add-host host.docker.internal:host-gateway \
  ghcr.io/achyuthkp27/hireline
```

On an Apple Silicon Mac, add `--platform linux/amd64` before the image name. `--add-host` lets Hireline reach Ollama or LM Studio on your computer at `http://host.docker.internal`.

Open [http://localhost:3000](http://localhost:3000). If Hireline starts before the database is ready, it can't apply its migrations and stops; Docker starts it again until it works. `docker logs -f hireline` shows what it's doing.

- **Another port:** change the first `3000` in `-p 127.0.0.1:3000:3000`.
- **Other variables:** add them to `hireline.env`, then remove the container and run step 4 again. [Environment variables](environment-variables.md) lists them.
- **Your own image:** build it as in [Build the image yourself](#build-the-image-yourself), and use `hireline:local` as the image name.
- **Upgrade:** `docker pull ghcr.io/achyuthkp27/hireline`, then `docker rm -f hireline` and step 4 again. Your data is in the volumes, not the container.
- **Remove it:** `docker rm -f hireline hireline-db`, then `docker volume rm hireline-db hireline-data` (this deletes your data for good) and `docker network rm hireline`.

## Run locally with Node.js

This builds Hireline from source and runs it without Docker. You need:

- Node.js 24, the version the image uses, with Corepack (it comes with Node.js 24).
- PostgreSQL. The Compose files use version 18.
- Git and `openssl`.

**1. Fetch the source and its dependencies:**

```bash
git clone https://github.com/achyuthkp27/hireline.git
cd hireline
corepack enable
yarn install --immutable
```

Corepack installs the Yarn version that `package.json` asks for; it may ask to download it the first time.

**2. Make a database.** Create a user and a database for Hireline in your PostgreSQL. For example, with PostgreSQL's own tools (prefix them with `sudo -u postgres` on Linux):

```bash
createuser --pwprompt hireline
createdb --owner hireline hireline
```

**3. Fill in `.env`.** Copy the example file:

```bash
cp .env.example .env
yarn hash-password          # prints the hash for HIRELINE_PASSWORD
openssl rand -base64 32     # prints a value for HIRELINE_SECRET
```

Then edit `.env`:

- `HIRELINE_PASSWORD`: the line `yarn hash-password` printed, starting with `argon2id:`.
- `HIRELINE_SECRET`: the output of `openssl rand -base64 32`.
- `DATABASE_URL`: your database, such as `postgresql://hireline:<password>@localhost:5432/hireline`.
- `HIRELINE_DATA_DIR`: a folder for backups, as a full path, such as `/home/<you>/hireline-data`. The default, `/data`, usually doesn't exist outside Docker. Use a full path: the server runs from `.next/standalone`, which every build replaces, and a relative path would end up in there.

**4. Set up the database.** This creates the tables, then the built-in themes, an empty profile and default settings:

```bash
yarn prisma generate
yarn prisma migrate deploy
yarn prisma db seed
```

**5. Install Chromium for the PDFs.** Run it as the user that will run Hireline: Chromium goes into that user's cache folder.

```bash
node node_modules/playwright-core/cli.js install --with-deps --only-shell chromium
```

On Linux, `--with-deps` also installs the system libraries and fonts Chromium needs, and asks for your password to do it. On macOS, leave `--with-deps` out.

**6. Build it.** The build makes a standalone server in `.next/standalone`; the two copies put its files next to it, as the Dockerfile does:

```bash
yarn build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
```

**7. Start it:**

```bash
set -a; . ./.env; set +a
HOSTNAME=127.0.0.1 node .next/standalone/server.js
```

The first line loads `.env` into the shell. `HOSTNAME=127.0.0.1` keeps Hireline on your own computer: otherwise it listens on every address. `PORT` changes the port, 3000 by default. Open [http://localhost:3000](http://localhost:3000) and sign in. Ctrl-C stops it.

To run it as a service that starts with the computer, see [Without Docker](#without-docker) below. To upgrade, see [Upgrading](upgrading.md#nodejs).

## Self-host on an Ubuntu server

This puts Hireline on your own domain, with HTTPS from [Caddy](https://caddyserver.com). You need:

- An Ubuntu server with at least 2 vCPUs and 2 GB of memory. The published image is for x86-64 (Intel and AMD) servers.
- A domain name, such as `hireline.example.com`, whose DNS points at the server.
- Ports 80 and 443 open to the internet, for HTTPS and its certificate.

The steps use `hireline.example.com`: put your own domain in its place.

### With Docker Compose and Caddy

**1. Install Docker Engine** with its Compose plugin, as [Docker's guide for Ubuntu](https://docs.docker.com/engine/install/ubuntu/) says.

**2. Fetch the Compose file and make the secrets:**

```bash
mkdir ~/hireline && cd ~/hireline
curl -fsSL -o compose.yml https://raw.githubusercontent.com/achyuthkp27/hireline/main/compose.production.yml
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" > .env
echo "HIRELINE_SECRET=$(openssl rand -base64 32)" >> .env
echo "HIRELINE_PUBLIC_URL=https://hireline.example.com" >> .env
echo "TZ=Europe/Berlin" >> .env
```

**3. Choose your password:**

```bash
docker run --rm -it ghcr.io/achyuthkp27/hireline hash-password
```

Add the line it prints to `.env` as `HIRELINE_PASSWORD=argon2id:…`.

**4. Start Hireline** and check that it answers:

```bash
docker compose up -d
curl -s http://127.0.0.1:3000/api/health
```

The check prints `"status":"ok"` once the database is up. Compose publishes port 3000 on `127.0.0.1` only, so only Caddy, on the same server, reaches it.

**5. Install Caddy**, as [Caddy's install guide](https://caddyserver.com/docs/install#debian-ubuntu-raspbian) says. Then replace `/etc/caddy/Caddyfile` with:

```
hireline.example.com {
	reverse_proxy 127.0.0.1:3000
	header Strict-Transport-Security "max-age=31536000"
}
```

and reload it:

```bash
sudo systemctl reload caddy
```

Caddy gets and renews the HTTPS certificate on its own, and passes the client's address and protocol on to Hireline.

**6. Close everything else.** If you use `ufw`:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

Open `https://hireline.example.com` and sign in. To upgrade, see [Upgrading](upgrading.md#docker-compose).

### Without Docker

This runs Hireline with Node.js as a `systemd` service, with Caddy in front. You need Node.js 24, PostgreSQL, Git and Caddy on the server. Ubuntu's own Node.js package is older than 24: take it from [nodejs.org](https://nodejs.org/en/download). PostgreSQL's own [apt repository](https://www.postgresql.org/download/linux/ubuntu/) has version 18.

**1. Make a user for Hireline,** with its home in `/opt/hireline`, and a database:

```bash
sudo adduser --system --group --home /opt/hireline hireline
sudo -u postgres createuser --pwprompt hireline
sudo -u postgres createdb --owner hireline hireline
sudo corepack enable
```

**2. Fetch and build it as that user.** Open a shell as `hireline`:

```bash
sudo -u hireline -H bash
cd /opt/hireline
git clone https://github.com/achyuthkp27/hireline.git app
mkdir data
cd app
```

Then follow steps 1, 3, 4 and 6 of [Run locally with Node.js](#run-locally-with-nodejs), from `yarn install --immutable` on. In `.env`, also set:

```bash
HIRELINE_DATA_DIR=/opt/hireline/data
HIRELINE_PUBLIC_URL=https://hireline.example.com
TZ=Europe/Berlin
```

For Chromium, run step 5 without `--with-deps`, still as `hireline`:

```bash
node node_modules/playwright-core/cli.js install --only-shell chromium
exit
```

`exit` takes you back to your own user. Then install Chromium's system libraries as root:

```bash
sudo node /opt/hireline/app/node_modules/playwright-core/cli.js install-deps chromium
```

**3. Make it a service.** Save this as `/etc/systemd/system/hireline.service`:

```ini
[Unit]
Description=Hireline
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
User=hireline
WorkingDirectory=/opt/hireline/app
EnvironmentFile=/opt/hireline/app/.env
Environment=HOSTNAME=127.0.0.1 PORT=3000
ExecStart=/usr/bin/env node .next/standalone/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

If Node.js isn't in `/usr/bin` or `/usr/local/bin`, for example with nvm, put the full path to `node` in `ExecStart` instead. Then start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now hireline
curl -s http://127.0.0.1:3000/api/health
journalctl -u hireline -f      # the server's log; Ctrl-C to leave
```

**4. Put Caddy in front,** with the same `Caddyfile` as in step 5 of [With Docker Compose and Caddy](#with-docker-compose-and-caddy), and close the other ports as in step 6.

The service doesn't apply migrations when it starts: you run them yourself when you upgrade (see [Upgrading](upgrading.md#nodejs)).

## Self-host with CapRover

[CapRover](https://caprover.com) runs apps from Docker images and serves them over HTTPS. The repository's `captain-definition` tells it to build the `Dockerfile`.

**1. Make the database.** From CapRover's one-click apps, install PostgreSQL, under a name such as `hireline-db`, and version 18 if it asks. Note the user, password and database name you give it. Other apps reach it at `srv-captain--hireline-db`.

**2. Make the app.** Create an app named `hireline`, with **Has Persistent Data** ticked.

**3. Configure it.** In the app's settings:

- **Environment variables:**
  - `DATABASE_URL=postgresql://<user>:<password>@srv-captain--hireline-db:5432/<database>`
  - `HIRELINE_PASSWORD=argon2id:…`, the hash from `hash-password` (see the [top of this page](#installing-hireline))
  - `HIRELINE_SECRET=`, the output of `openssl rand -base64 32`
  - `HIRELINE_PUBLIC_URL=https://hireline.example.com`, the address you'll use
  - `TZ=Europe/Berlin`, your time zone
- **Persistent directories:** the path `/data` in the app.
- **HTTP settings:** container HTTP port `3000`. Connect your domain, then turn on HTTPS and force it.

**4. Deploy it.** Either:

- Deploy the published image by its name, `ghcr.io/achyuthkp27/hireline:latest` (or a version, such as `ghcr.io/achyuthkp27/hireline:v1.0.0`), or
- Build it from source: in a copy of the repository, run `caprover deploy` with CapRover's command-line tool. CapRover builds the `Dockerfile` on the server, which takes a while.

The container applies the database migrations before it serves. If they fail, it stops, and CapRover keeps the running version. The logs say why (see [Troubleshooting](troubleshooting.md#hireline-didnt-start-applying-the-database-migrations-failed)).

## Self-host with Coolify

[Coolify](https://coolify.io) runs apps and databases on your own server, behind its own HTTPS proxy.

**1. Make the database.** Add a PostgreSQL database resource, version 18 if you can choose. Copy the internal connection URL Coolify shows for it: that's your `DATABASE_URL`. Hireline accepts URLs that start with `postgres://` or `postgresql://`.

**2. Make the app.** Add an application, either:

- from the Docker image `ghcr.io/achyuthkp27/hireline:latest`, or
- from the public Git repository `https://github.com/achyuthkp27/hireline`, built with its `Dockerfile`.

**3. Configure it:**

- **Port:** the container listens on `3000`.
- **Environment variables:** `DATABASE_URL`, `HIRELINE_PASSWORD` (the hash from `hash-password`, see the [top of this page](#installing-hireline)), `HIRELINE_SECRET`, `HIRELINE_PUBLIC_URL` (your `https://` address) and `TZ`.
- **Persistent storage:** a volume mounted at `/data`.
- **Domain:** your domain, such as `https://hireline.example.com`. Coolify's proxy serves it over HTTPS.
- **Health check** (if you turn Coolify's on): path `/api/health` on port 3000.

**4. Deploy it.** The container applies the database migrations before it serves; if they fail, it stops, and the deployment log says why.

## Self-host with Dokploy

[Dokploy](https://dokploy.com) runs apps and databases on your own server, behind its own HTTPS proxy.

**1. Make the database.** Create a PostgreSQL database, version 18 if you can choose. Copy its internal connection URL: that's your `DATABASE_URL`. Hireline accepts URLs that start with `postgres://` or `postgresql://`.

**2. Make the app.** Create an application, either:

- with the Docker image `ghcr.io/achyuthkp27/hireline:latest` as its source, or
- from the public Git repository `https://github.com/achyuthkp27/hireline`, built with its `Dockerfile`.

**3. Configure it:**

- **Environment variables:** `DATABASE_URL`, `HIRELINE_PASSWORD` (the hash from `hash-password`, see the [top of this page](#installing-hireline)), `HIRELINE_SECRET`, `HIRELINE_PUBLIC_URL` (your `https://` address) and `TZ`.
- **Volume:** a volume mounted at `/data`.
- **Domain:** your domain, such as `hireline.example.com`, with HTTPS, pointing at container port `3000`.
- **Health check** (if you set one): path `/api/health` on port 3000.

**4. Deploy it.** The container applies the database migrations before it serves; if they fail, it stops, and the deployment log says why.

After any of these, open your address, sign in, and go on with [Choosing an AI provider](ai-providers.md).
