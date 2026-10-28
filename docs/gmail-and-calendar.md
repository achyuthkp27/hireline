# Connecting Gmail and Calendar

With your Google account connected, Hireline can:

- send an application from your own Gmail address, with its resume and cover letter PDFs attached;
- find employers' replies, show each one next to its application, have the AI read what they ask, and draft your answer from your profile;
- offer interview times you're free, from your calendar;
- add interviews to Google Calendar and keep them in step both ways, and show your month and the week ahead on the dashboard.

Nothing is sent without your confirmation.

Hireline has no Google client of its own. You make one in Google Cloud, for your own server, and give Hireline its ID and secret. This page shows how.

## Before you start

Google sends you back to Hireline after you sign in, at a redirect URI on the address you use Hireline at:

```
<your Hireline address>/api/google/callback
```

- **On your own computer:** `http://localhost:3000/api/google/callback`, or the port you chose with `HIRELINE_PORT`.
- **On a server:** `https://hireline.example.com/api/google/callback`, with your own domain. Set `HIRELINE_PUBLIC_URL=https://hireline.example.com` as well, so Hireline always uses that address, whatever the reverse proxy passes on.

With `HIRELINE_PUBLIC_URL` set, Hireline always sends Google that address. Without it, it uses the address in your browser (behind a reverse proxy, the forwarded host and protocol). Sign in to Hireline at the same address you register: Google's answer only counts with your Hireline session.

Google only takes `http://` for `localhost`. Anywhere else, it needs an `https://` address on a domain name.

Until Google is set up, **Settings → Google** shows these steps, with the exact redirect URI for the address you opened it at, and a **Copy** button.

## 1. Make a project and turn on the APIs

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and sign in with your Google account.
2. Create a project, for example named `Hireline`.
3. In that project, enable the **Gmail API** and the **Google Calendar API** (APIs & Services → Library).

## 2. Set up the consent screen

1. Set up the **OAuth consent screen** for the project, with **External** as the user type. Give it an app name, such as `Hireline`, and your email address where it asks for one.
2. Add yourself as a **test user**, with the Gmail address you'll connect.
3. **Publish** the app, so its status is **In production**. While it's unpublished (in testing), Google stops Hireline's access after 7 days, and you'd have to connect again each week.

Your client isn't verified by Google, so when you connect, Google warns that it hasn't verified the app. It's your own client, on your own server: continue past the warning.

Google's console changes its wording from time to time; the parts stay the same.

## 3. Make the OAuth client

1. Create an **OAuth client ID** (APIs & Services → Credentials), of type **Web application**.
2. Under **Authorized redirect URIs**, add the redirect URI from [Before you start](#before-you-start), such as `https://hireline.example.com/api/google/callback`. It must match exactly: the scheme, the host, the port and the path.
3. If you use Hireline at more than one address, add the redirect URI for each one.
4. Create it, and copy the **client ID** and the **client secret**.

## 4. Give Hireline the client

Either way works. Settings needs no restart.

**In Settings → Google.** Paste the **Client ID** and the **Client secret** in the **OAuth client** card. Each is saved when you leave its field. The secret is stored encrypted with a key derived from `HIRELINE_SECRET`, and never shown again; **Remove saved secret** deletes it.

**With environment variables.** Set both, then restart Hireline:

```bash
HIRELINE_GOOGLE_CLIENT_ID=1234567890-example.apps.googleusercontent.com
HIRELINE_GOOGLE_CLIENT_SECRET=<the client secret>
```

What you save in Settings wins over the variables, the ID and the secret each on its own. The fields then say where each comes from, such as **Using HIRELINE_GOOGLE_CLIENT_SECRET · type one to save it here**. The Docker Compose file passes both variables through from `.env`.

## 5. Connect your Google account

1. In Settings → Google, press **Connect Google account**.
2. Google's own page opens. Sign in, and choose what Hireline may do.
3. Google sends you back to Settings → Google, which says **Connected to Google.** and shows the account.

Settings lists each permission, with **Allow** next to any you didn't give. You can add them one at a time later.

| Permission in Settings | What Hireline asks Google for |
|---|---|
| Send email from your address | `gmail.send` |
| Read your mail, to find replies to your applications | `gmail.readonly` |
| See when you're free and add interviews to your calendar | `calendar.freebusy` and `calendar.events` |

Hireline also asks for your email address (`openid` and `email`), to show which account is connected. Google's refresh token is stored encrypted with a key derived from `HIRELINE_SECRET`; access tokens stay in the server's memory.

## 6. Choose what Hireline does

Once connected, Settings → Google has:

| Setting | What it does | Default |
|---|---|---|
| **Read replies** | Checks Gmail for employers' replies, links them to applications and has the AI read them | On |
| **Which mail** | **Threads I started and company domains**: only mail that matches an application is kept and sent to the AI. **Every new email**: mail that doesn't match waits under **Needs a look**, and with a hosted AI it's sent to the provider to be read | Threads I started and company domains |
| **Check every** | How often the inbox is checked: 5, 10, 15, 30 or 60 minutes. **Check now** checks at once | 10 minutes |
| **Offer times from my calendar** | When an employer asks to meet, the drafted answer offers times you're free | On |
| **Add interviews to my calendar** | Once a time is agreed, adds it with a link back to the application, and keeps it in step: a time changed in Hireline or in Google changes on both sides | On |
| **Working days**, **From** and **Until** | When interview times may be offered | Monday to Friday, 09:00 to 17:00 |
| **Interview length** | 15, 30, 45, 60 or 90 minutes | 45 minutes |
| **Keep free around meetings** | The gap kept around other events: none, 10, 15 or 30 minutes | 15 minutes |
| **Time zone** | The zone for free times and interviews. Empty uses your browser's | Empty |
| **Calendar** | `primary` is your main calendar; or a calendar's ID from Google Calendar's settings | `primary` |

The inbox check runs inside the app's process, so run a single copy of Hireline. [Privacy](../PRIVACY.md#what-leaves-your-server) says what goes to Google, and what Hireline keeps of your mail.

## Disconnect

**Disconnect** in Settings → Google revokes Hireline's access at Google and forgets the account. Mail already in Hireline stays with its applications; nothing new comes in until you connect again. **Delete everything** in Settings → Your data revokes the access too.

Changing the client ID disconnects the account: connect again afterwards. A new `HIRELINE_SECRET` makes the saved secret and Google's access unreadable: enter the secret again and reconnect.

## If something goes wrong

| What you see | What to do |
|---|---|
| Google's page says `redirect_uri_mismatch` | The redirect URI Hireline sent isn't one of the client's. Add it exactly as Settings → Google shows it, or set `HIRELINE_PUBLIC_URL` to the address you registered. |
| Google says access is blocked, or that the app is still being tested | Add your Gmail address as a test user, or publish the app (step 2). |
| "Google isn't set up on this server yet. See the steps below." | Hireline has no client ID and secret yet. Do step 4. |
| "Google refused the sign-in. Check the client ID and secret below." | The ID or the secret is wrong, or from another client. Paste both again. |
| "Google wasn't given access, so nothing changed." | You pressed Cancel on Google's page. Connect again when you're ready. |
| "That took too long or didn't start here. Try connecting again." | The sign-in has to finish within 10 minutes of pressing **Connect Google account**. Start again from Settings → Google. |
| You land on Hireline's sign-in page after Google | Your Hireline session isn't at the address Google sent you back to. Sign in at that address (the one in `HIRELINE_PUBLIC_URL`), then connect again. |
| "Google didn't give Hireline lasting access. Remove Hireline at myaccount.google.com/permissions and connect again." | Remove Hireline's access in your Google account's permissions, then connect again, so Google gives a new refresh token. |
| "Google no longer accepts Hireline's access. Connect your Google account again." | The access was revoked or expired, for example 7 days after connecting while the app wasn't published. Publish it (step 2), then connect again. |
| "Google refused that. Check the permissions in Settings → Google." | Allow the missing permission in Settings → Google. Also check that the Gmail API and the Google Calendar API are enabled in the project (step 1). |
| "The saved Google access can't be read, probably since HIRELINE_SECRET changed. Connect your Google account again." | `HIRELINE_SECRET` changed. Connect again. |

[Troubleshooting](troubleshooting.md) has the rest.
