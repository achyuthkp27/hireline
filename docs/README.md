# Hireline documentation

How to install Hireline, set it up and keep it running. For what Hireline does, see the [README](../README.md). For what stays on your server and what leaves it, see [Privacy](../PRIVACY.md).

## Run it on your computer

Hireline runs as one server next to a PostgreSQL database. On your own computer, it's only reachable from that computer.

- [With Docker Compose](install.md#run-locally-with-docker-compose): the quickest way, and the one the README shows. Also covers another port, your time zone, upgrades and removing it.
- [With Docker, without Compose](install.md#run-locally-with-docker): the same image, started with `docker run`.
- [With Node.js](install.md#run-locally-with-nodejs): built from source, without Docker.

## Self-host on a server

To reach Hireline from anywhere, on your own domain with HTTPS. Give the server at least 2 vCPUs and 2 GB of memory.

- [A plain Ubuntu server](install.md#self-host-on-an-ubuntu-server), with [Docker Compose and Caddy](install.md#with-docker-compose-and-caddy), or [with Node.js and no Docker](install.md#without-docker).
- [CapRover](install.md#self-host-with-caprover)
- [Coolify](install.md#self-host-with-coolify)
- [Dokploy](install.md#self-host-with-dokploy)

The [top of the installation guide](install.md) lists what every server setup needs, whichever you choose: the database, three variables, a data folder, HTTPS in front, and one copy of the app.

## After installing

- [Choosing an AI provider](ai-providers.md): a local model with Ollama or LM Studio, or a hosted one (OpenAI-compatible, Anthropic or Mistral).
- [Choosing a job source](job-sources.md): JSearch or Adzuna, the unofficial source for Germany, Startups, and the job agent.
- [Connecting Gmail and Calendar](gmail-and-calendar.md): your own Google OAuth client, step by step.
- [Connecting Claude](claude-connector.md): the Claude connector, in Claude's apps and on the command line.

## Keeping it running

- [Backups and restore](backups.md): exports, nightly backups, database dumps, and getting your data back.
- [Upgrading](upgrading.md) to a new version, for each way of running Hireline.
- [Troubleshooting](troubleshooting.md): what the common errors mean, and what to do about them.
- [Environment variables](environment-variables.md): every setting the server reads.

## More

- [Privacy](../PRIVACY.md): what Hireline keeps, for how long, and who receives what.
- [Security](../SECURITY.md): what protects your data, and how to report a problem.
- [Developing Hireline](../DEVELOPMENT.md): working on Hireline itself.
