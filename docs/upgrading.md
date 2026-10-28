# Upgrading

New versions are published as [releases on GitHub](https://github.com/achyuthkp27/hireline/releases), each with notes on what changed. Settings → About tells you when one is out: with **Check for updates daily** on (it is by default), the server asks GitHub for the latest release once on each day Hireline is used, and the sidebar says when a newer one is out. **Check for updates** asks at once. Settings → About also shows the version you have.

## Before you upgrade

1. **Back up.** Export your data in Settings → Your data, or take a database dump (see [Backups and restore](backups.md)). Hireline can't undo a migration, so a backup is your way back.
2. **Read the release notes**, for anything you have to do yourself.

## What happens when it starts

The Docker image brings the database up to date each time it starts (`docker/start.sh`):

1. It applies any new database migrations (`prisma migrate deploy`).
2. It loads the built-in themes. This never overwrites your profile or settings.
3. It starts the server.

If a step fails, the container stops with an error, and the log says which step, such as "Hireline didn't start: applying the database migrations failed (see the error above)." It doesn't serve until the step works. [Troubleshooting](troubleshooting.md#hireline-didnt-start-applying-the-database-migrations-failed) says what to look for.

With Node.js, you run those steps yourself, as below.

## Docker Compose

```bash
cd ~/hireline
docker compose pull
docker compose up -d
```

`pull` fetches the new image and `up -d` replaces the container; your data stays in the volumes. `docker compose logs -f app` shows the migrations and the start.

If the release notes say the Compose file changed, fetch it again first. It doesn't hold your settings: those are in `.env` and `compose.override.yml`.

```bash
curl -fsSL -o compose.yml https://raw.githubusercontent.com/achyuthkp27/hireline/main/compose.production.yml
```

### Stay on one version

The `latest` tag follows the newest release. To choose the version yourself, set the image's tag in `.env`, with the release's tag name:

```bash
HIRELINE_IMAGE=ghcr.io/achyuthkp27/hireline:v1.0.0
```

To upgrade, change the version there, then `docker compose up -d`. CI also tags an image for every commit on `main`, as `main` and as the commit's SHA. Those aren't releases: use them only to try something out.

### Your own image

If you built the image yourself (see [Build the image yourself](install.md#build-the-image-yourself)), update the source and build it again, then restart:

```bash
git -C ~/hireline-source pull
docker build -t hireline:local ~/hireline-source
cd ~/hireline && docker compose up -d
```

`docker compose pull` doesn't apply here: there's nothing to pull.

## Docker

With the `docker run` setup from [Run locally with Docker](install.md#run-locally-with-docker):

```bash
docker pull ghcr.io/achyuthkp27/hireline
docker rm -f hireline
```

Then run the same `docker run` command as before for the `hireline` container. Your data is in the `hireline-db` and `hireline-data` volumes, not in the container.

## Node.js

Stop Hireline first: the build replaces the files the running server uses. For the service on the [Ubuntu server](install.md#without-docker), that's `sudo systemctl stop hireline`.

Then, from the folder you cloned Hireline into (`/opt/hireline/app` on the Ubuntu server, as the `hireline` user):

```bash
git pull
yarn install --immutable
yarn prisma generate
yarn build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
node node_modules/playwright-core/cli.js install --only-shell chromium
yarn prisma migrate deploy
yarn prisma db seed
```

Then start it again: `sudo systemctl start hireline` for the service, or as in step 7 of [Run locally with Node.js](install.md#run-locally-with-nodejs).

The Chromium step installs the version that matches the new Playwright, and does nothing when it's already there. If a new version needs other system libraries, run `sudo node node_modules/playwright-core/cli.js install-deps chromium` as well.

To upgrade to one release rather than the newest code on `main`, check out its tag instead of `git pull`: `git fetch --tags` then `git checkout v1.0.0`.

## CapRover

- **Deployed from the image:** deploy it again by its name. With `ghcr.io/achyuthkp27/hireline:latest`, CapRover fetches the newest release; with a version tag, put in the new one.
- **Built from source:** update your copy of the repository and run `caprover deploy` again.

The new container applies the migrations before it serves. If it doesn't start, the old one keeps running, and the app's logs say why.

## Coolify and Dokploy

Redeploy the application. From the image with the `latest` tag, the platform fetches the newest release; with a version tag, change it first. Built from the Git repository, the platform builds the new commit. The container applies the migrations before it serves.

## Going back to an older version

Migrations only go forward: an older version may not run on a database a newer one changed. To go back, restore the database dump you took before upgrading (see [Restore a database dump](backups.md#restore-a-database-dump)), then run the older version.

An export from a newer version may not import on an older one either: when its format is newer, the older server says "That export comes from a newer version of Hireline" and refuses it.
