# Choosing an AI provider

Hireline uses an AI model to read job postings, match them against your profile, write the tailored resume, cover letter and email, refine them in the chat, read a resume you import, and score postings. With Gmail connected, it also reads employers' replies and drafts your answers. You choose the model in **Settings → AI provider**.

Until you choose one, the AI features wait: New application, for one, says "No AI provider is set up yet, so nothing can read the posting." With the [Claude connector](claude-connector.md) on and no model of Hireline's own, New application and **Score** in Find jobs hand the work to a new Claude chat instead.

## Local or hosted

| Provider | Where it runs | Needs a key |
|---|---|---|
| [Local model](#local-model-ollama-or-llamacpp) | Ollama or llama.cpp, on your own hardware | No |
| [LM Studio](#lm-studio) | LM Studio, on your computer or your network | Only if you turned on authentication in LM Studio |
| [OpenAI-compatible](#openai-compatible) | Any server that speaks the OpenAI API, hosted or on your network | Usually |
| [Anthropic](#anthropic) | Anthropic's API, with Claude models | Yes |
| [Mistral](#mistral) | Mistral's API | Yes |

**A local model** keeps your profile, postings and documents on your own hardware. It's free and private, and slower: Hireline runs one AI task at a time on it.

**A hosted model** is usually faster, and Hireline runs up to three AI tasks at once on it. The provider receives what the model writes from: your profile without contact details, the postings, your drafts and chat messages, and the whole text of a resume you import. [Privacy](../PRIVACY.md#what-a-hosted-ai-provider-receives) lists exactly what each task sends. Read the provider's terms for API use before you send them a resume. An OpenAI-compatible server on your own network keeps everything on it, like a local model.

## Settings → AI provider

1. **Pick a provider.** The card saves at once and fills in its usual address and model, where it has them.
2. **Server address.** Check it, or type your server's. It must start with `http://` or `https://`.
3. **Model.** Choose one from the list the server gives, or choose **Other model…** and type its name.
4. **API key**, for providers that take one. It's saved when you leave the field, stored encrypted with a key derived from `HIRELINE_SECRET`, and never shown again. The field then says **Saved · type a new key to replace it**.
5. **Test connection.** Hireline sends a short test prompt. It says **Connected** with the model and how long it took, or what went wrong.

Each field saves on its own. Below the provider, the same screen has:

- **Creativity:** Faithful, Balanced (the default) or Expressive. Lower keeps drafts close to your own wording. Higher takes more liberties with phrasing, but never with facts.
- **Never invent experience:** on by default. Drafts only use facts from your profile, and what a posting asks for that you don't have is shown as a gap. Turned off, drafts may stretch beyond your profile.
- **Show what changed:** after each draft, a list of what was tailored compared with your base resume.

A new `HIRELINE_SECRET` makes saved keys unreadable. Settings then says "Your saved API key can't be read. Please enter it again."

## Local model (Ollama or llama.cpp)

Choose **Local model** for [Ollama](https://ollama.com), or for llama.cpp's server and anything like it. Hireline asks the server once which kind it is: Ollama, through its own API, or an OpenAI-compatible server at the same address under `/v1`.

The address depends on where Hireline and the model run:

| Hireline runs | The model runs | Address |
|---|---|---|
| With Node.js | On the same computer | `http://localhost:11434` (the default) |
| In Docker | On the same computer | `http://host.docker.internal:11434` |
| With Docker Compose | In the Compose file's `ollama` service | `http://ollama:11434` |

Inside Docker, `localhost` is Hireline's own container, not your computer. For llama.cpp's server, use its own port.

Hireline asks Ollama for a context of 16,384 tokens, enough for a profile, a posting and a tailored resume, and turns the model's thinking off, so it answers within the time limit.

### Ollama in Docker Compose

The Compose file has an Ollama service, off by default. To try the AI features with a small model:

```bash
echo "COMPOSE_PROFILES=ai" >> .env
docker compose up -d
docker compose exec ollama ollama pull qwen2.5:3b   # about 2 GB
```

Then choose **Local model**, with the address `http://ollama:11434`, and pick `qwen2.5:3b` as the model. The Ollama image takes about 9 GB of disk, and a 3B model about 3 GB of memory while it runs. The Compose file doesn't give Ollama a GPU, so it runs models on the CPU. Models are kept in the `ollama` volume. `docker compose exec ollama ollama pull <model>` adds others.

### Ollama on the host

To use an Ollama you already run, choose **Local model** with `http://host.docker.internal:11434` (or `http://localhost:11434` without Docker). The Compose file and the `docker run` command in the [installation guide](install.md#run-locally-with-docker) map `host.docker.internal` to your computer. On Linux, Ollama has to accept connections from Docker's network, not only from `localhost`: Ollama's own documentation says how.

## LM Studio

Choose **LM Studio** for models you run in [LM Studio](https://lmstudio.ai), on the same computer or your network.

- **Address:** `http://host.docker.internal:1234` (the default) is LM Studio on the computer Hireline's Docker runs on. Without Docker, use `http://localhost:1234`. On another computer, use its address.
- **Start LM Studio's server** in its Developer tab. With Hireline in Docker, also turn on **Serve on Local Network** there.
- **API token:** only needed if you turned on authentication in LM Studio's server settings.

From LM Studio 0.4 on, the model list shows only chat models. When Hireline uses a model that isn't loaded, it loads it with a context of 16,384 tokens, and it stays loaded until you eject it in LM Studio. If it's already loaded with less context, Hireline says so: eject it, and Hireline loads it again with enough.

## OpenAI-compatible

Choose **OpenAI-compatible** for OpenAI itself, or any other server that speaks the OpenAI chat completions API, hosted or on your network.

- **Address:** the API's base address, usually ending in `/v1`, such as `https://api.openai.com/v1`.
- **Model:** pick one from the list the server gives, or type its name.
- **API key:** the server's key. A server on your network may not need one.

Servers differ in what they accept: some refuse a temperature or `max_tokens`, or don't support JSON schemas. Hireline learns what each server and model accepts, once, and adapts. With a key set, Hireline doesn't follow a redirect to another host, so your key only goes to the address you typed.

## Anthropic

Choose **Anthropic** for Claude models through your own API key. The address is `https://api.anthropic.com` and the default model is `claude-sonnet-5`. Pick another from the list, or type its name.

This uses an Anthropic API key, billed per use. To use your Claude plan instead, see [Connecting Claude](claude-connector.md).

## Mistral

Choose **Mistral** for Mistral's models through your own API key. The address is `https://api.mistral.ai/v1` and the default model is `mistral-medium-latest`. Mistral has a free tier to start. If your plan doesn't include a model, Hireline says so; pick another.

## Set it with environment variables

The `HIRELINE_AI_*` variables set the provider until you save one in Settings. That's handy for a server you set up from a file, or for Hireline's own Ollama service:

```bash
HIRELINE_AI_PROVIDER=local
HIRELINE_AI_URL=http://ollama:11434
HIRELINE_AI_MODEL=qwen2.5:3b
```

| Variable | What it does | Default |
|---|---|---|
| `HIRELINE_AI_PROVIDER` | `local` (Ollama or llama.cpp), `lmstudio`, `openai` (any OpenAI-compatible server), `anthropic` or `mistral`, in lower case | Unset: no provider is chosen |
| `HIRELINE_AI_URL` | The server's address, `http://` or `https://` | The provider's usual address, as above |
| `HIRELINE_AI_MODEL` | The model's name | `claude-sonnet-5` for Anthropic, `mistral-medium-latest` for Mistral, none for the others |
| `HIRELINE_AI_KEY` | The API key | None |
| `HIRELINE_AI_TIMEOUT_SECONDS` | How long one AI call may take, in whole seconds, at least 5 | 300 for a local model and LM Studio, 120 for hosted ones |

How they combine with Settings:

- Once you pick a provider in Settings, Settings decides, and `HIRELINE_AI_PROVIDER`, `HIRELINE_AI_URL` and `HIRELINE_AI_MODEL` no longer count.
- `HIRELINE_AI_KEY` still serves a provider saved in Settings when it's the same kind as `HIRELINE_AI_PROVIDER` and has no key of its own. The key field then says **Using HIRELINE_AI_KEY · type one to save it here**.
- `HIRELINE_AI_TIMEOUT_SECONDS` always applies. There's no setting for it in the app.

With Docker Compose, put them in `.env` and run `docker compose up -d`. [Environment variables](environment-variables.md) lists every variable.

## When something goes wrong

The AI's errors are worded so you can act on them, such as "Couldn't reach the server. Check the address and that it's running." [Troubleshooting](troubleshooting.md#ai-provider) lists them, with what to do.
