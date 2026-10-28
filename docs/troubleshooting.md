# Troubleshooting

What the common errors mean, and what to do about them. Hireline's messages are written to say what to fix, so search this page for the words you see.

## Finding the error

Most problems show up in the server's log. Hireline logs errors without the data involved, so the log is safe to read, but check it before you paste it anywhere.

| How you run Hireline | The log |
|---|---|
| Docker Compose | `docker compose logs -f app`, in the folder with `compose.yml` |
| Docker | `docker logs -f hireline` |
| Node.js as a service | `journalctl -u hireline -f` |
| Node.js by hand | The terminal you started it in |
| CapRover, Coolify, Dokploy | The app's logs in the platform |

`/api/health` says whether the server is up and can reach its database: `{"status":"ok",…}` with 200, or `"unavailable"` with 503.

## Hireline doesn't start

### Hireline can't start: a variable is missing or wrong

The server checks its variables when it starts, and stops with one line per problem, each starting with `Hireline can't start:`. It never prints the values.

| The log says | What to do |
|---|---|
| `HIRELINE_PASSWORD is not set.` | Set it to a hash of your password, made with `hash-password` (see the [installation guide](install.md#installing-hireline)). |
| `HIRELINE_PASSWORD must be a hash of your password, not the password itself.` | Run `hash-password` and set `HIRELINE_PASSWORD` to the line it prints, which starts with `argon2id:`. |
| `HIRELINE_SECRET is not set.` | Set it to at least 32 random characters, such as the output of `openssl rand -base64 32`. |
| `HIRELINE_SECRET is too short (… characters).` | Use at least 32 random characters. A new secret signs you out, and saved keys have to be entered again. |
| `DATABASE_URL is not set.` | Set it to your PostgreSQL connection string, such as `postgresql://user:password@host:5432/hireline`. The Compose file sets it for you. |
| `DATABASE_URL must be a PostgreSQL connection string starting with postgresql://.` | Check the start of it. `postgres://` works too. |
| `HIRELINE_BACKUP_RETENTION_DAYS must be a whole number of days` or `must be at least 1` | Use a whole number, 1 or more, or leave it out for 14. |
| `HIRELINE_AI_PROVIDER must be one of local, openai, anthropic, mistral, lmstudio` | Use one of those, in lower case. |
| `HIRELINE_AI_URL must be an http:// or https:// URL.` | Give the full address, with `http://` or `https://`. The same goes for `HIRELINE_PUBLIC_URL`. |
| `HIRELINE_AI_TIMEOUT_SECONDS must be a whole number of seconds` or `must be at least 5` | Use a whole number of seconds, 5 or more. |
| `HIRELINE_JOBS_SOURCE must be one of jsearch, adzuna, arbeitsagentur, off` | Use one of those. `HIRELINE_JSEARCH_HOST` takes `openwebninja` or `rapidapi`, and `HIRELINE_JOBS_ARBEITSAGENTUR` takes `on` or `off`. |
| `HIRELINE_JOBS_SOURCE is arbeitsagentur, but HIRELINE_JOBS_ARBEITSAGENTUR is off.` | Choose another source, or remove one of the two. |

An empty value, such as `HIRELINE_AI_KEY=`, counts as not set. [Environment variables](environment-variables.md) has every variable.

With Docker Compose, a missing variable can stop Compose itself, before Hireline runs, with the Compose file's own hint: "Set POSTGRES_PASSWORD in .env", "Set HIRELINE_PASSWORD in .env to a hash from hash-password" or "Set HIRELINE_SECRET in .env". Add it to the `.env` next to `compose.yml`.

### Hireline didn't start: applying the database migrations failed

The container brings the database up to date before it serves. When that fails, the log shows Prisma's error, then:

```
Hireline didn't start: applying the database migrations failed (see the error above).
```

Read the error above it:

- **It can't reach the database server.** The database isn't running or isn't ready yet, or the host in `DATABASE_URL` is wrong. With Docker Compose, check `docker compose ps` and `docker compose logs db`. With `docker run`, check that both containers are on the same network, and that `DATABASE_URL` names the database container (`hireline-db`). If the database was only slow to start, the container starts again on its own.
- **Authentication failed.** The password in `DATABASE_URL` isn't the database's. A common cause with Docker: `POSTGRES_PASSWORD` changed in `.env` after the first start. PostgreSQL only takes that password when it sets up an empty database, and keeps the old one after. Put the old password back in `.env`, or set the database's password to the new one:

  ```bash
  docker compose exec db psql -U hireline -d hireline -c "ALTER USER hireline PASSWORD '<the new password>'"
  docker compose up -d
  ```

- **A migration itself failed.** Note the error, restore your backup if you need Hireline back at once (see [Upgrading](upgrading.md#going-back-to-an-older-version)), and [open an issue](https://github.com/achyuthkp27/hireline/issues) with the error, without values from your `.env`.

### Hireline didn't start: loading the built-in themes failed

The migrations worked, but writing the built-in themes didn't. The error above it says why; it's usually the database connection, as above.

### Docker can't find the image

`docker compose up` or `docker pull` fails with `manifest unknown` or `not found` for `ghcr.io/achyuthkp27/hireline`. The `latest` tag only exists once a release is out. Build the image yourself, as in [Build the image yourself](install.md#build-the-image-yourself), or use a version tag that exists on the [releases page](https://github.com/achyuthkp27/hireline/releases).

### The image doesn't match your platform

On an Apple Silicon Mac, or another ARM computer, Docker says the image doesn't match the platform, such as `no matching manifest for linux/arm64/v8`. The image is built for Intel and AMD processors. On a Mac, Docker Desktop runs it under emulation, once you ask for that platform:

```bash
printf 'services:\n  app:\n    platform: linux/amd64\n' > compose.override.yml
```

and add `--platform linux/amd64` to `docker run` commands, `hash-password` included. See the [README](../README.md#run-it-on-your-computer).

### The port is already in use

Docker says the port `is already allocated`, or Node.js says `address already in use`. Something else uses port 3000. With Docker Compose, set another one with `HIRELINE_PORT` (see [Use another port](install.md#use-another-port)). With Node.js, start it with another `PORT`.

## The log says `Invalid time zone specified: Etc/Unknown`

The full error is `RangeError: Invalid time zone specified: Etc/Unknown`. The server couldn't work out its own time zone, which can happen when `TZ` isn't set. The Compose file passes `TZ` from `.env`, and passes it empty when it isn't there.

Set `TZ` to your time zone, a name from the time zone database such as `Europe/Berlin` or `America/New_York`, and restart:

```bash
echo "TZ=Europe/Berlin" >> .env
docker compose up -d
```

On other setups, set `TZ` where your other variables are. Nightly backups then run at 03:00 in that zone too.

## Signing in

| What you see | What to do |
|---|---|
| "That's not the password set on the server. Try again." | `HIRELINE_PASSWORD` is a hash of another password. Make a new hash with `hash-password`, put it in `HIRELINE_PASSWORD`, and restart Hireline. |
| "Too many attempts. Try again in 30 seconds." | After 5 failed sign-ins within a minute from one address, Hireline waits 30 seconds, then longer after each failure, up to 15 minutes. Wait, or clear the counters, below. |
| You're signed out everywhere | A new `HIRELINE_PASSWORD` or `HIRELINE_SECRET` signs out every session. A session also ends when the browser closes, after 24 hours at most, or after 30 days with **Keep me signed in for 30 days**. |

To clear the failed sign-ins with Docker Compose:

```bash
docker compose exec db psql -U hireline -d hireline -c 'DELETE FROM "LoginThrottle"'
```

Behind a reverse proxy, the limit counts by the last address in `X-Forwarded-For`. If everyone seems to share one address, your proxy doesn't set that header: see [Behind a reverse proxy](#behind-a-reverse-proxy).

## Behind a reverse proxy

| What you see | What to do |
|---|---|
| "This request didn't come from Hireline's own pages, so it was blocked." | The proxy changes the `Host` header, so the browser's address and the one Hireline sees don't match. Pass the original `Host` on, or set `X-Forwarded-Host`. |
| "That file is too big for this server to accept." when you import | The proxy's own size limit is lower than Hireline's 10 MB. With nginx, raise `client_max_body_size`. |
| Google's redirect or the Claude connector's address uses `http://`, or the wrong host | Set `HIRELINE_PUBLIC_URL` to your HTTPS address, or have the proxy set `X-Forwarded-Proto` and `X-Forwarded-Host`. |

Caddy does all of this by default. With nginx, a location like this one does:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 10m;
}
```

Set `Strict-Transport-Security` at the proxy too: Hireline leaves it to whatever serves HTTPS.

## AI provider

These show where you use the AI, and when you press **Test connection** in Settings → AI provider.

| Message | What to do |
|---|---|
| "Couldn't reach the server. Check the address and that it's running." | The model's server doesn't answer at that address. Inside Docker, `localhost` is Hireline's own container: use `http://host.docker.internal:11434` for Ollama on the same computer, or `http://ollama:11434` for the Compose service (see [Choosing an AI provider](ai-providers.md#local-model-ollama-or-llamacpp)). |
| "Couldn't reach LM Studio. Check the address, that its server is running (Developer tab), and, with Hireline in Docker, that Serve on Local Network is on." | Start the server in LM Studio's Developer tab, and turn on **Serve on Local Network** there. |
| "The server didn't accept the API key. Check it in Settings → AI provider." | The key is wrong, revoked, or for another provider. Enter it again. |
| "The server doesn't have the model “…”. Pick another one in Settings → AI provider." | The model's name is wrong, or it isn't downloaded. For Ollama: `ollama pull <model>` (`docker compose exec ollama ollama pull <model>` for the Compose service). |
| "Choose a model in Settings → AI provider first." | Pick a model. |
| "Add your Anthropic API key in Settings → AI provider first." (or Mistral) | Enter the provider's key. |
| "Your saved API key can't be read. Please enter it again." | `HIRELINE_SECRET` changed since the key was saved. Enter the key again. |
| "The model took too long to answer. Try again, or pick a faster model." | A call took longer than allowed: 300 seconds for a local model, 120 for a hosted one. Use a smaller model, or raise `HIRELINE_AI_TIMEOUT_SECONDS`. |
| "That's more text than the model can take in at once. Try a shorter posting, or a model with a larger context." | Shorten what you pasted, or use a model with a larger context. |
| "The model's answer was cut off before it was finished. Try again, or pick another model in Settings → AI provider." | The model stopped mid-answer. Try again, or use a larger model. |
| "The model's answer didn't come back in the expected shape. Try again." | Small models sometimes answer in the wrong format. Try again, or use a larger model. |
| "LM Studio has “…” loaded with … tokens of context, and Hireline needs …" | Eject the model in LM Studio, and Hireline loads it again with enough context. |
| "The AI provider is limiting requests right now. Wait a minute and try again." | You hit your plan's rate limit. Wait, or check the plan. |
| "The AI provider is overloaded right now. Try again in a moment." | The provider is busy. Try again later. |
| "Mistral lets this API key make 0 requests a minute, so nothing gets through." | Check the plan and limits of the key's workspace in Mistral's console. |
| "Your Mistral plan doesn't include “…”. Pick another model in Settings → AI provider." | Choose a model your plan includes. |
| "The AI server sent the request to another address. Hireline won't send your API key there: put that address in Settings → AI provider instead." | The server redirected. Use the address it redirects to. |
| "Hireline restarted before this finished. Try again." | The server restarted during an AI task. Start it again. |

## Job search

These show in Find jobs, the job agent, and **Test connection** in Settings → Job search. The source's name is in the message; JSearch is the example here.

| Message | What to do |
|---|---|
| "Add your JSearch key in Settings → Job search first." | Enter the key. Adzuna needs its app ID and key. |
| "JSearch didn't accept your key. Check it in Settings → Job search." | Check the key, and that **Key from** says where it's from: OpenWeb Ninja or RapidAPI. |
| "You've used up your JSearch searches for this month. Try again then, or move to a bigger plan." | Your plan's searches are used up. Adzuna's come back daily. |
| "Adzuna doesn't list jobs in … Choose another country, or another source in Settings → Job search." | Adzuna covers 19 countries, and the Bundesagentur für Arbeit only Germany. See [Choosing a job source](job-sources.md). |
| "JSearch isn't answering right now. Try again in a minute." | The source is down or slow. Try again later. |
| "Read the note about Bundesagentur für Arbeit and tick “I understand” before Hireline searches it." | Tick the box under the note in Settings → Job search. |
| "Bundesagentur für Arbeit isn't offered on this server. Choose another source in Settings → Job search." | `HIRELINE_JOBS_ARBEITSAGENTUR=off` is set. Choose another source. |
| "The Arbeitsagentur's job search has changed or isn't answering. Try another source in Settings → Job search." | The unofficial access stopped working. Use JSearch or Adzuna. |
| "Your saved JSearch key can't be read. Enter it again in Settings → Job search." | `HIRELINE_SECRET` changed. Enter the key again. |

## Fetching a posting

**Fetch** in New application reads a posting from its link, from your server.

| Message | What to do |
|---|---|
| "The job site couldn't be reached. Without internet access, or if the site blocks it, paste the posting instead." | Paste the posting's text. |
| "There's no posting text on that page that Hireline can read: the site probably builds it in the browser. Paste the posting instead." | Paste the posting's text. |
| "Hireline doesn't fetch addresses on your own network. Paste the posting instead." | Hireline never fetches addresses on its own network. Paste it. |
| "The job site answered with an error (…). Paste the posting instead." | The site refused or failed. Paste it. |
| "That page is too big to be a job posting. Paste the posting instead." | Paste the posting's text. |

## Importing your data

### That file is over 10 MB, more than this server accepts

Imports are limited to 10 MB, about 500 applications. The limit comes from Next.js, which cuts off larger request bodies, so Hireline refuses them up front.

To import a bigger file, you'd raise `experimental.proxyClientMaxBodySize` in `next.config.ts` and `IMPORT_MAX_BYTES` in `src/lib/import-limits.ts`, and build your own image or Node.js build ([DEVELOPMENT.md](../DEVELOPMENT.md#import-size-limit) has the details). Behind a reverse proxy, raise its limit too: with nginx, `client_max_body_size`.

If the import says "That file is too big for this server to accept." for a file under 10 MB, it's the reverse proxy's limit: see [Behind a reverse proxy](#behind-a-reverse-proxy).

### Other import messages

| Message | What to do |
|---|---|
| "That file isn't a Hireline export." or "That file isn't a Hireline export: it isn't JSON." | Choose a file from **Export** or from the `backups` folder. |
| "That export comes from a newer version of Hireline (schema …). Update this server first." | [Upgrade](upgrading.md) this server, then import. |
| "That export is damaged or incomplete (…)." | The file was changed or cut off. Use another export or backup. |

## Importing a resume

| Message | What to do |
|---|---|
| "Choose an AI provider in Settings first: it's what reads the resume." | Set up an AI provider (see [Choosing an AI provider](ai-providers.md)). |
| "That file is over 5 MB. A resume is usually much smaller: export it again without images." | Export it again without images. |
| "Choose a PDF, a Word (.docx) or a Markdown (.md) file." | Those are the formats it reads. |
| "There's no text in this file to read, so it's probably a scan. Export your resume from the program you wrote it in instead." | A scanned PDF has no text. Export the resume from the program you wrote it in. |

## Backups

Settings → Your data says "The last backup failed:" and why. The usual cause is the data folder:

- `EACCES: permission denied`: Hireline can't write to `HIRELINE_DATA_DIR`, or can't make it. In Docker, the app runs as the image's `node` user (user ID 1000): a folder you mount at `/data` from the host must be writable by it. With Node.js, the folder must be writable by the user that runs Hireline. Outside Docker, the default `/data` usually doesn't exist, and your user can't make it: set `HIRELINE_DATA_DIR` to a full path you own.

## PDFs

When a PDF can't be made, Hireline says "Something went wrong on the server. Please try again." and the log has the reason.

- **With Node.js, the log says Chromium's `Executable doesn't exist`.** Install it as the user that runs Hireline: `node node_modules/playwright-core/cli.js install --only-shell chromium`, from Hireline's folder. On Linux, also install its system libraries once with `sudo node node_modules/playwright-core/cli.js install-deps chromium`. Run it again after each upgrade.
- **Out of memory.** Chromium needs room: give the container at least 768 MB. The Compose file gives it 1 GB.

## Gmail and Calendar

See [If something goes wrong](gmail-and-calendar.md#if-something-goes-wrong) in Connecting Gmail and Calendar. The most common one is Google's `redirect_uri_mismatch`: the redirect URI in your Google client must match `<your Hireline address>/api/google/callback` exactly.

## Claude connector

See [If something goes wrong](claude-connector.md#if-something-goes-wrong) in Connecting Claude. Claude's web, Desktop and mobile apps need Hireline on a public HTTPS address.

## Still stuck

Search the [issues](https://github.com/achyuthkp27/hireline/issues?q=is%3Aissue), then open one with the steps, the message word for word, your version (Settings → About) and how you run Hireline. Leave out passwords, API keys, values from your `.env`, and anything from your profile. Report a security problem [privately](https://github.com/achyuthkp27/hireline/security/advisories/new) instead (see [SECURITY.md](../SECURITY.md)).
