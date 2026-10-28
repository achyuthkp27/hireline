# Backups and restore

Hireline keeps your data in its PostgreSQL database, and writes backups to its data folder. Keep copies of three things:

- **Your data:** an export, the nightly backups, or a database dump. Each has its use, below.
- **Your `.env`**, or wherever your variables live. `HIRELINE_SECRET` matters most: saved API keys, the Google client's secret and Google's access are encrypted with keys derived from it. Without the same secret, a restored database still works, but you enter the keys again and reconnect Google.
- **Your Compose files**, if you changed them, such as `compose.override.yml`.

Exports, backups and dumps hold your profile and applications in plain text. Keep them somewhere safe, and delete old ones yourself.

## Export everything

**Settings → Your data → Export everything → Export** downloads one JSON file, such as `hireline-export-2026-10-28.json`. It holds your profile, custom themes, settings, every application with its history, documents, chat and notes, the postings you kept from Find jobs and your past searches, the job agent's finds, and Startups with what you did with them.

It leaves out:

- **API keys**, unless you tick **Include my API keys** (shown once a key is saved). Then the AI provider's and the job sources' keys go into the file in plain text, so anyone with the file can use them.
- What belongs to the server rather than your data: the Google client and the connected Google account, the mail fetched from Gmail, the Claude connector's state, the update check, task data and failed sign-ins.
- Fit scores, which can be made again.

Use an export to move to another server, to keep a copy outside the server, or to answer someone who asks for their data (see [Privacy](../PRIVACY.md#gdpr-and-similar-laws)).

## Nightly backups

With **Nightly backups** on in Settings → Your data (it is by default), Hireline writes the same export to the `backups` folder in its data folder every night at 03:00, in the server's time zone. Nightly backups never hold API keys.

- **Where:** `HIRELINE_DATA_DIR/backups`, which is `/data/backups` in the image, in the `data` volume with Docker Compose. Settings → Your data shows the folder.
- **Names:** `hireline-backup-nightly-2026-10-28-030000.json`. Each import also writes one first, named `hireline-backup-before-import-…`.
- **How long:** backups older than `HIRELINE_BACKUP_RETENTION_DAYS`, 14 days by default, are deleted when the next nightly backup runs.
- **When:** at 03:00 in the time zone in `TZ`. Without `TZ`, Docker usually runs on UTC: set it as in [Set your time zone](install.md#set-your-time-zone).

If a backup fails, Settings → Your data says "The last backup failed:" and why, until one works again. The timer runs inside the app's process, so run a single copy of Hireline.

The nightly backups live on the same server as the database. Copy them somewhere else now and then. With Docker Compose:

```bash
cd ~/hireline
docker compose cp app:/data/backups ./backups
```

## Database dumps

The exports are Hireline's own backups. Back up the PostgreSQL database itself too, the way your host does it. A dump holds everything in the database, the Google account and fetched mail included, and restores it exactly. Keep `HIRELINE_SECRET` with it.

**With Docker Compose:**

```bash
cd ~/hireline
docker compose exec -T db pg_dump -U hireline --clean --if-exists hireline > hireline-$(date +%F).sql
```

**With Docker** (as in [Run locally with Docker](install.md#run-locally-with-docker)):

```bash
docker exec hireline-db pg_dump -U hireline --clean --if-exists hireline > hireline-$(date +%F).sql
```

**With Node.js**, from the folder with your `.env`:

```bash
set -a; . ./.env; set +a
pg_dump --clean --if-exists --dbname="$DATABASE_URL" > hireline-$(date +%F).sql
```

**On CapRover, Coolify or Dokploy:** turn on the platform's own database backups if it has them, or run `pg_dump` in the database's container.

To dump every night, add a line like this with `crontab -e`, with your own paths. Cron needs the `%` written as `\%`:

```
0 4 * * * cd /path/to/hireline && docker compose exec -T db pg_dump -U hireline --clean --if-exists hireline | gzip > /path/to/dumps/hireline-$(date +\%F).sql.gz
```

## Restore from an export or a backup

1. Copy the file to the computer you use Hireline from. For a nightly backup in Docker Compose, `docker compose cp` above does it.
2. Open **Settings → Your data → Import**, press **Choose file** and pick the file.
3. Hireline says when the file was exported and what's in it, and what it replaces. Press **Import and replace**.

Hireline first writes a backup of your current data to the `backups` folder, then replaces everything in one go. If the import fails, nothing changes.

Exports made by Dossier, the app Hireline started from, import the same way.

What an import does and doesn't touch:

- It replaces your profile, settings, applications, postings and searches, the job agent's finds, Startups and your custom themes.
- It removes the mail fetched from Gmail, which belongs to the applications it replaces. The next inbox check fetches what's still relevant.
- It keeps the server's own settings: the Google client, the connected Google account, the Claude connector's state and the update check.
- A saved API key stays as it is, unless the file carries one: then the file's key is saved, encrypted with this server's secret.

The file must be a Hireline export of a version this server can read. An export from a newer version needs this server upgraded first. Files over 10 MB are refused: see [Troubleshooting](troubleshooting.md#that-file-is-over-10-mb-more-than-this-server-accepts).

## Restore a database dump

This replaces the whole database with the dump. Stop Hireline first, so nothing writes while you restore.

**With Docker Compose:**

```bash
cd ~/hireline
docker compose stop app
docker compose exec -T db psql -U hireline -d hireline < hireline-2026-10-28.sql
docker compose start app
```

For a compressed dump, use `gunzip -c hireline-2026-10-28.sql.gz | docker compose exec -T db psql -U hireline -d hireline` instead of the third line.

**With Node.js:** stop the service (`sudo systemctl stop hireline`), run `psql --dbname="$DATABASE_URL" < hireline-2026-10-28.sql` with your `.env` loaded, then start it again.

A dump from an older version is fine: the Docker image applies the newer migrations when it starts, and with Node.js you run them as in [Upgrading](upgrading.md#nodejs). Use the same `HIRELINE_SECRET` as when the dump was taken, or enter the API keys again and reconnect Google afterwards.

## Move to another server

1. Install Hireline on the new server, as in the [installation guide](install.md). Use the same `HIRELINE_SECRET` if you're restoring a dump.
2. Restore a database dump, or import an export in Settings → Your data.
3. With an export, enter your API keys again (unless you included them), and enter the Google client and connect Google again in Settings → Google. Turn the Claude connector on again too.
4. If the address changed, register the new redirect URI with Google (see [Connecting Gmail and Calendar](gmail-and-calendar.md)), and add the connector again in Claude.

## Download all PDFs

**Settings → Your data → Download all PDFs** zips every tailored resume and cover letter, sorted by company, as `hireline-pdfs-2026-10-28.zip`. Hireline makes the zip in the `downloads` folder of its data folder, and removes it once you've downloaded it, or after an hour.

## Delete everything

**Delete everything** in Settings → Your data removes the profile, every application, the postings and searches, the job agent's finds, Startups, custom themes, settings, task data, backups and zips, and the mail and the Google account, after revoking Hireline's access at Google. Type `DELETE` to confirm. It can't be undone, and it can't reach your own exports and dumps: export first if you might want the data back.
