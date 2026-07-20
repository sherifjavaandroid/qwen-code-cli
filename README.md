# Qwen Free API + Qwen Code CLI (free agent setup)

An **OpenAI-compatible API gateway** in front of your free
[`chat.qwen.ai`](https://chat.qwen.ai) account, plus a guide to wire the
[Qwen Code](https://github.com/QwenLM/qwen-code) CLI to it so you get a
**free coding agent** that actually writes files and runs commands.

```
Qwen Code / Cursor / Cline  ──►  this proxy (/v1/chat/completions)  ──►  chat.qwen.ai (free)
        OpenAI request                    forwards your token                  your account
```

- ✅ OpenAI-compatible: `POST /v1/chat/completions`, `GET /v1/models`
- ✅ Streaming (SSE)
- ✅ **Tool / function calling** — emulated so agents (write files, run shell, git) work
- ✅ Many Qwen models exposed (`qwen3.7-max`, `qwen3.6-plus`, `qwen3-vl-plus`, …)
- ✅ Deploy free on Vercel; run locally; or Docker

> **Auth model:** the "API key" is your own `chat.qwen.ai` token, sent as
> `Authorization: Bearer <token>`. The proxy forwards it upstream. Everyone uses
> **their own** token — nothing is shared or stored.

---

## Quick start

### A. Deploy your own proxy (recommended)

**Vercel CLI:**
```bash
npm i -g vercel
git clone https://github.com/sherifjavaandroid/qwen-code-cli.git
cd qwen-code-cli
vercel --prod
```
Copy the production URL it prints (e.g. `https://your-proxy.vercel.app`).

**Or via the Vercel dashboard:** import the GitHub repo at
<https://vercel.com/new> and click Deploy. The included `vercel.json` builds a
serverless function automatically.

No environment variables are required (see [`.env.example`](.env.example)).

### B. Run locally
```bash
npm install
npm run build
npm start          # serves on http://localhost:5566
```

### C. Docker
```bash
docker compose up -d
```

---

## How to get your token

1. Open <https://chat.qwen.ai> and log in.
2. Press **F12** → **Application** tab → **Local Storage** → `https://chat.qwen.ai`.
3. Copy the value of the **`token`** entry (a long `eyJ...` JWT).

That string is your `OPENAI_API_KEY` / `Authorization: Bearer` value.
When it expires, repeat these steps.

---

## Use it with Qwen Code (free agent)

Full guide: **[docs/qwen-code-setup.md](docs/qwen-code-setup.md)**. Short version:

```bash
npm i -g @qwen-code/qwen-code
```

`~/.qwen/.env`:
```
OPENAI_API_KEY=<your chat.qwen.ai token>
OPENAI_BASE_URL=https://your-proxy.vercel.app/v1
OPENAI_MODEL=qwen3.7-max
```

`~/.qwen/settings.json`:
```json
{ "security": { "auth": { "selectedType": "openai" } }, "model": { "name": "qwen3.7-max" } }
```

Then just run `qwen`. To add extra tools (git, browser, web-fetch, planning,
memory) via MCP, follow the [setup doc](docs/qwen-code-setup.md#3-optional-add-mcp-servers--more-power).

Works with any OpenAI-compatible client too — Cursor, Cline, Continue, the
OpenAI SDK — just point the base URL at your proxy and use your token.

---

## Test the proxy

```bash
# list models
curl https://your-proxy.vercel.app/v1/models

# chat
curl -X POST https://your-proxy.vercel.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"model":"qwen3.7-max","messages":[{"role":"user","content":"hi"}]}'
```

Or run the included script:
```bash
QWEN_TOKEN=YOUR_TOKEN node test-api.js
```

---

## Limitations & fair use

- **Tool calling is emulated** (the free web backend has no native
  function-calling). It's reliable for most tasks but not guaranteed on very
  long agent runs. Fewer active tools = more reliable.
- Your `chat.qwen.ai` account's **free-tier rate limits** apply.
- This is an **unofficial** reverse-proxy of the web interface; it may break if
  Qwen changes their web API, and you should review Qwen's Terms of Service for
  your use case.
- Use your own account/token. Don't abuse the service.

## License

MIT — see [LICENSE](LICENSE). This project only contains original code and does
not include any proprietary or third-party leaked source.
