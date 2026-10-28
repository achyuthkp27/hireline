# Choosing a job source

**Find jobs** searches one job source for postings, near your city or anywhere you choose. You save the good ones, dismiss the rest, score any of them against your profile with **Score**, and start an application from one with **Start application →**. You choose the source in **Settings → Job search**.

Find jobs is off until you choose. A search sends the source what you search for: the keywords, place, country, radius and filters. Nothing from your profile goes with it. The job source's key, if it has one, only goes to that source.

| Source | Covers | Key | Cost |
|---|---|---|---|
| [JSearch](#jsearch) | Most countries: LinkedIn, Indeed, Glassdoor and company sites, through Google for Jobs | Yes, from OpenWeb Ninja or RapidAPI | Free key with 200 searches a month |
| [Adzuna](#adzuna) | Adzuna's own index, in 19 countries | App ID and key | Free key, about 250 searches a day |
| [Bundesagentur für Arbeit](#bundesagentur-für-arbeit-germany-unofficial) | Germany only | No | Free; unofficial |
| [Off](#off) | Nothing | No | Nothing is sent anywhere |

The quotas are what the services offered when this was written: check their sites for their current plans.

## Settings → Job search

1. **Pick a source.** The choice saves at once. You can switch any time: each source keeps its own key.
2. **Enter its key.** A key is saved when you leave the field or press Enter, stored encrypted on your server, and never shown again. **Remove saved key** deletes it.
3. **Test connection.** Hireline sends a small search and says **Connected** with how long the source took, or what went wrong. With JSearch, a test uses one search from your plan.

## JSearch

JSearch finds postings from LinkedIn, Indeed, Glassdoor and company sites, through Google for Jobs, in most countries.

1. Get a key, either from [OpenWeb Ninja](https://www.openwebninja.com/api/jsearch) (the default), or from [JSearch on RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch).
2. In Settings → Job search, choose **JSearch**.
3. Under **Key from**, choose where your key is from: **OpenWeb Ninja** or **RapidAPI**.
4. Paste the key under **API key**, and press **Test connection**.

## Adzuna

Adzuna searches its own job index in 19 countries: Australia, Austria, Belgium, Brazil, Canada, France, Germany, India, Italy, Mexico, the Netherlands, New Zealand, Poland, Singapore, South Africa, Spain, Switzerland, the United Kingdom and the United States. In another country, Hireline says Adzuna doesn't list jobs there.

Adzuna only shares the start of each posting. Hireline fetches the rest from the posting's own page when it needs it, for example when you score it. Its results say **Jobs by Adzuna**, as Adzuna's terms ask.

1. Sign up on [Adzuna's developer site](https://developer.adzuna.com/signup) to get an app ID and an app key.
2. In Settings → Job search, choose **Adzuna**.
3. Enter the **App ID** and the **App key**, and press **Test connection**.

## Bundesagentur für Arbeit (Germany, unofficial)

The Bundesagentur für Arbeit (BA) is Germany's federal job board. Its postings come in full, with no key and no plan to sign up for, for jobs in Germany only.

Read this before you choose it. The BA has no official API. Hireline searches it through the access its own job search uses, without its permission, and the BA's terms of use don't allow automated access. You choose this source on your own responsibility, and it can stop working at any time.

1. In Settings → Job search, choose **Bundesagentur für Arbeit**.
2. Read the note, and tick **I understand, and choose this source myself**. Until then, Hireline doesn't search it.

Its results link to each posting's page on arbeitsagentur.de, and say **Source: Bundesagentur für Arbeit**. The [job agent](#the-job-agent) never searches it: choose JSearch or Adzuna for the agent.

To take it out of Hireline altogether, so nobody on your server can choose it, set `HIRELINE_JOBS_ARBEITSAGENTUR=off` and restart. A choice saved before then counts as Off.

## Off

Find jobs stays off, and no search leaves your server.

## Past searches

Every search is kept with what it found, under **Past searches** in Find jobs, until you remove it. Opening one again asks the source nothing. Hireline also keeps a source's answers in memory for 30 minutes, so the same search again soon doesn't ask the source a second time.

## Set it with environment variables

These set the job source until you choose one in Settings. A choice saved there, Off included, wins. A key saved in Settings wins over the one in the environment; until you save one, the key field says, for example, **Using HIRELINE_JSEARCH_KEY · type one to save it here**.

| Variable | What it does | Default |
|---|---|---|
| `HIRELINE_JOBS_SOURCE` | `jsearch`, `adzuna`, `arbeitsagentur` or `off` | Unset: off |
| `HIRELINE_JSEARCH_KEY` | Your JSearch key | None |
| `HIRELINE_JSEARCH_HOST` | Where that key is from: `openwebninja` or `rapidapi` | `openwebninja` |
| `HIRELINE_ADZUNA_APP_ID` | Your Adzuna app ID | None |
| `HIRELINE_ADZUNA_KEY` | Your Adzuna app key | None |
| `HIRELINE_JOBS_ARBEITSAGENTUR` | `off` takes the Bundesagentur für Arbeit out of Hireline; `on` offers it | `on` |

With `HIRELINE_JOBS_SOURCE=arbeitsagentur` and no choice saved in Settings, the server log says what that source is when Hireline starts. It still isn't searched until you tick **I understand** in Settings. Setting it together with `HIRELINE_JOBS_ARBEITSAGENTUR=off` stops Hireline from starting, with a message that says so.

The Docker Compose file passes all of these through from `.env` except `HIRELINE_JOBS_ARBEITSAGENTUR`: set that one in `compose.override.yml` (see [Set other variables](install.md#set-other-variables)).

## Startups

**Startups** is a separate screen, with nothing to set up. It lists startups that are hiring, from YC startups' job posts and the posts in Hacker News' monthly "Who is hiring?" thread, through Hacker News' official API and Algolia's search of it. It keeps the ones that hire where your profile says you live, or remotely and open to your country, and ranks them against your profile on your server, without AI.

Nothing is fetched until you press **Refresh** once. After that, it refreshes once a day while you open the screen at least every 14 days. For a startup with a site of its own, Hireline looks for the address it publishes for applications. It reads the site's robots.txt first and follows it. **Look for people's addresses** looks for people's own addresses too, only when you press it. Hireline never writes to anyone: you start an application, and decide whom to send it to.

[Privacy](../PRIVACY.md#startups) says what Startups reads, keeps and deletes, and what to keep in mind before you write to a startup.

## The job agent

The job agent runs one search for you once a day. It skips what you've seen, scores the new postings against your profile and keeps the best on the **Agent** screen, each with its score, reasons and red flags. It can prepare tailored drafts too, which wait for your review. It never sends or applies.

### What it needs

- **A job source:** JSearch or Adzuna, in Settings → Job search. It searches with that source's key, and never the Bundesagentur für Arbeit.
- **An AI provider**, in Settings → AI provider, which does the scoring and the drafts. They go to the provider with your profile, as a new application does.
- **A search with keywords and a country.**

### Settings → Job agent

| Setting | What it does | Default |
|---|---|---|
| **Run the job agent** | Turns it on. Off, nothing is searched or scored | Off |
| **What it looks for** | The same search fields as in Find jobs. Postings you saved, dismissed or applied for there are left out | Empty |
| **Runs after** | The hour after which the day's run starts, in your time zone | 07:00 |
| **Minimum score** | Postings scored lower stay out of the queue (50 to 90) | 70 |
| **Postings scored per run** | The most new postings one run scores (1 to 30) | 15 |
| **Prepare drafts on its own** | For the best new postings of each run, a tailored resume and cover letter, waiting for your review | Off |
| **Drafts per run, at most** | How many drafts a run prepares on its own (0 to 10) | 3 |

"Your time zone" is your browser's, as it last told the server, not the server's.

### How it runs

- Each run asks the source for the first page of results only, drops what Find jobs or the agent has seen, and scores the newest of the rest.
- It runs once a day, after the hour you chose. **Run now** on the Agent screen runs it at once, but no sooner than an hour after the last run.
- At most three runs in any 24 hours, scheduled or with Run now.
- Each run scores up to **Postings scored per run** postings, and prepares up to **Drafts per run, at most** drafts while **Prepare drafts on its own** is on.

### The Agent screen

- **Drafts to review:** the drafts it prepared. **Review draft** opens one. **Approve** moves it to Applications, the board and the dashboard; until then it stays off them. **Dismiss** deletes the draft.
- **Scored postings:** **Prepare draft** writes one for a posting. **Dismiss** removes a posting, and it won't come back.

The agent's timer runs inside the app's process, like the nightly backups, so run a single copy of Hireline.
