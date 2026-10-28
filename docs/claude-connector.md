# Connecting Claude

The Claude connector lets you use Hireline from Claude: in chats on claude.ai, in the Desktop and mobile apps, and in Claude Code, Claude's command-line app. It runs on your own Claude plan. Claude can search for jobs, score them against your profile, read your profile and applications, and save the resume and cover letter it writes as a Draft in Hireline. It never sends or deletes anything.

It's off until you turn it on. While it's off, its addresses answer as if they didn't exist.

## What you need

- **For claude.ai, Desktop and mobile:** Hireline on a public HTTPS address, such as `https://hireline.example.com`. Claude reaches Hireline from Anthropic's servers, not from your computer, so a local address or plain `http://` doesn't work. See [Self-host on a server](README.md#self-host-on-a-server).
- **For Claude Code on the computer Hireline runs on:** the local address is enough, such as `http://localhost:3000`.
- **`HIRELINE_PUBLIC_URL`**, if Hireline is reached at another address than the one it sees, for example behind a reverse proxy that doesn't pass the host on. Hireline builds the connector's address and its sign-in links from it.

## Turn it on

1. Open **Settings → Claude connector**.
2. Turn on **Let Claude connect**.
3. Copy the **Address to add in Claude**. It's your Hireline address with `/api/mcp` at the end, such as `https://hireline.example.com/api/mcp`.

If the address shown is local or isn't HTTPS, Settings says so: Claude's web, Desktop and mobile apps can't use it.

## Connect from claude.ai, Desktop or mobile

1. In Claude, open **Settings → Connectors** and choose **Add custom connector**.
2. Name it **Hireline**, paste the address and press **Add**, then **Connect**.
3. Claude opens Hireline's **Connect Claude to Hireline** page. Sign in if it asks, read what Claude may do, and press **Allow**. **Deny** sends you back to Claude without access.

Press **Allow** only when you've just added Hireline in Claude yourself. The page says which site it sends you back to.

## Connect from Claude Code

Add the connector, with your own address:

```bash
claude mcp add --transport http hireline https://hireline.example.com/api/mcp
```

Then, in Claude Code, run `/mcp` and sign in. Your browser opens the same **Connect Claude to Hireline** page; press **Allow**.

## What Claude can do

| Tool | What it does |
|---|---|
| `get_profile` | Reads your profile: headline, summary, facts about you, skills, languages, experience, projects, education and publications. Without contact details or links |
| `search_jobs` | Searches the job source in Settings → Job search. The search is kept under Find jobs → Past searches, like your own, and uses one search from your plan with that source |
| `more_jobs` | The next page of a search. Uses one more search from your plan |
| `get_posting` | Reads a posting's whole text: from a search, one Hireline handed over, or a link, which Hireline fetches from your server |
| `save_job_scores` | Saves how well postings fit you, with reasons and red flags, so Find jobs shows each score |
| `list_applications` | Lists your applications with their status, newest activity first |
| `get_application` | Reads one application: its posting, how your profile matches it, and the resume and cover letter as text |
| `save_application` | Saves a resume and cover letter Claude wrote as a Draft application, checked like Hireline's own |
| `draft_application` | Has Hireline's own AI model draft the application, only when an AI provider is set up in Hireline. Takes one to three minutes |
| `check_draft` | How a draft from `draft_application` is coming along, and its link when it's done |
| `set_application_status` | Moves an application to another status, such as Sent or Interview. It only records the change |

## What Claude can't do

- Send an application or an email, or apply anywhere.
- Delete or archive anything.
- Read your contact details, links, references or private notes, or a letter's sender and signature.
- Search without a job source set up in Settings → Job search, or draft with Hireline's own model without an AI provider. Without one, Claude writes the application itself and saves it with `save_application`.

What Claude reads goes to Anthropic, under your Claude account and its terms, as anything you put in a chat does. [Privacy](../PRIVACY.md#claude-connector) has the details.

## Write it with Claude

With the connector on and no AI model of Hireline's own, the buttons that need one hand the work to Claude:

- In **New application**, **Write it with Claude →** keeps the posting you pasted for Claude to read, for 14 days, and opens a new claude.ai chat with a short prompt that names it.
- In **Find jobs**, **Score** does the same for a posting's fit score.

Claude then reads the posting and your profile through the connector, and saves what it writes back to Hireline. For this, add the connector to the Claude account you use on claude.ai.

## Sign Claude out

**Disconnect Claude** in Settings → Claude connector signs every Claude out. So do turning the connector off, a new `HIRELINE_PASSWORD` and a new `HIRELINE_SECRET`. To use it again, connect again from Claude.

Hireline keeps no tokens in its database: Claude's sign-in is signed with keys derived from `HIRELINE_SECRET`. An access token lasts an hour. Claude renews it with a refresh token, which lasts 30 days and is replaced each time it's used.

## If something goes wrong

| What you see | What to do |
|---|---|
| Claude can't reach Hireline, or the connection fails at once | Claude's web, Desktop and mobile apps need a public HTTPS address. Check that `https://hireline.example.com/api/health` opens from outside your network. |
| The address in Settings, or the one Claude is sent to sign in at, is wrong: for example `http://` behind your HTTPS proxy | Set `HIRELINE_PUBLIC_URL` to your HTTPS address and restart Hireline, then connect again. |
| "The Claude connector is off. Turn it on in Settings → Claude connector, then connect again from Claude." | Turn on **Let Claude connect**, then connect again. |
| "Claude's sign-in link isn't valid any more. Remove the connector in Claude and add it again." | The connector was registered under another `HIRELINE_SECRET`. Remove it in Claude and add it again. |
| "This sign-in would send you somewhere other than Claude, so it was stopped." | Hireline only sends you back to claude.ai, claude.com, or a `localhost` address for Claude Code. Start the connection from Claude. |
| Claude asks you to connect again | Claude was signed out: by **Disconnect Claude**, the connector turned off, a new password or a new secret. Connect again. |

Claude finds Hireline's sign-in through `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource` on your address. If your reverse proxy answers `/.well-known/` itself, let those two through to Hireline.
