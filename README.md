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
- ✅ **Responses API** (`POST /v1/responses`) — so OpenAI **Codex** works too
- ✅ Streaming (SSE)
- ✅ **Tool / function calling** — emulated so agents (write files, run shell, git) work
- ✅ Many Qwen models exposed (`qwen3.7-max`, `qwen3.6-plus`, `qwen3-vl-plus`, …)
- ✅ Deploy free on Vercel; run locally; or Docker

> **Auth model:** the "API key" is your own `chat.qwen.ai` token, sent as
> `Authorization: Bearer <token>`. The proxy forwards it upstream. Everyone uses
> **their own** token — nothing is shared or stored.

---

## 🚀 Get started in 5 minutes

Do these 3 steps and you'll have a **free** coding agent (`qwen` and/or `codex`).

### Step 1 — Deploy your own proxy (one click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sherifjavaandroid/qwen-code-cli)

Click the button → sign in to Vercel → **Deploy**. When it finishes, copy your
URL (looks like `https://your-name.vercel.app`).

<sub>Prefer the terminal? `npm i -g vercel && vercel --prod` inside the cloned repo.</sub>

### Step 2 — Get your free token

1. Open **<https://chat.qwen.ai>** and log in.
2. Press **F12** → **Application** → **Local Storage** → `https://chat.qwen.ai`.
3. Copy the **`token`** value (a long string starting with `eyJ...`).

That token is your free key. (When it stops working, just grab a fresh one.)

### Step 3 — Use it with your tool

<details open>
<summary><b>🟢 Qwen Code</b></summary>

```bash
npm i -g @qwen-code/qwen-code
```

Create **`~/.qwen/.env`** (Windows: `C:\Users\<you>\.qwen\.env`):
```
OPENAI_API_KEY=PASTE_YOUR_TOKEN
OPENAI_BASE_URL=https://your-name.vercel.app/v1
OPENAI_MODEL=qwen3.7-max
```

Create/edit **`~/.qwen/settings.json`**:
```json
{ "security": { "auth": { "selectedType": "openai" } }, "model": { "name": "qwen3.7-max" } }
```

Run it:
```bash
qwen
```
</details>

<details open>
<summary><b>🔵 OpenAI Codex</b></summary>

```bash
npm i -g @openai/codex
```

Set your token as an environment variable (persistent):
```powershell
# Windows PowerShell
[Environment]::SetEnvironmentVariable("QWEN_TOKEN", "PASTE_YOUR_TOKEN", "User")
```
```bash
# macOS / Linux — add to ~/.zshrc or ~/.bashrc
export QWEN_TOKEN="PASTE_YOUR_TOKEN"
```

Create **`~/.codex/config.toml`**:
```toml
model_provider = "qwen-free"
model = "qwen3.7-max"
model_context_window = 262144
model_max_output_tokens = 32768

[model_providers.qwen-free]
name = "Qwen Free"
base_url = "https://your-name.vercel.app/v1"
env_key = "QWEN_TOKEN"
wire_api = "responses"
supports_websockets = false
```

Run it (open a fresh terminal first so the token is loaded):
```bash
codex
```
</details>

**That's it — you now have a free agent that writes files and runs commands.** 🎉
More detail: [Qwen Code guide](docs/qwen-code-setup.md) · [Codex guide](docs/codex-setup.md)

---

## 🚀 ابدأ خلال 5 دقائق (شرح بالعربي)

اتبع 3 خطوات وسيصبح لديك مساعد برمجة **مجاني** (`qwen` و/أو `codex`).

### الخطوة 1 — انشر البروكسي الخاص بك (بضغطة واحدة)

اضغط زر **Deploy with Vercel** بالأعلى → سجّل الدخول في Vercel → اضغط **Deploy**.
بعد الانتهاء انسخ الرابط (يكون بالشكل `https://your-name.vercel.app`).

### الخطوة 2 — احصل على التوكن المجاني

1. افتح **<https://chat.qwen.ai>** وسجّل الدخول.
2. اضغط **F12** ← **Application** ← **Local Storage** ← `https://chat.qwen.ai`.
3. انسخ قيمة **`token`** (نص طويل يبدأ بـ `eyJ...`). هذا هو مفتاحك المجاني.

### الخطوة 3 — استخدمه مع أداتك

**Qwen Code:** ثبّت `npm i -g @qwen-code/qwen-code`، ثم أنشئ ملف `~/.qwen/.env`
وضع فيه `OPENAI_API_KEY` (التوكن) و`OPENAI_BASE_URL` (رابط البروكسي + `/v1`)
و`OPENAI_MODEL=qwen3.7-max`، واضبط `~/.qwen/settings.json` على
`selectedType: "openai"` (انظر البلوكات بالأعلى)، ثم شغّل `qwen`.

**Codex:** ثبّت `npm i -g @openai/codex`، اضبط متغير البيئة `QWEN_TOKEN` بالتوكن،
وأنشئ `~/.codex/config.toml` كما بالأعلى (مع `wire_api = "responses"` ورابط
البروكسي)، ثم شغّل `codex`.

كل الطلبات تستخدم **التوكن الخاص بك** — لا شيء يُخزَّن أو يُشارَك. عند انتهاء صلاحية
التوكن، احصل على واحد جديد بنفس الطريقة.

---

## Deploy options (detailed)

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

## Use it with OpenAI Codex (free agent)

Codex 0.144+ only speaks OpenAI's **Responses API**, which this proxy implements
at `POST /v1/responses`. Full guide: **[docs/codex-setup.md](docs/codex-setup.md)**.
Short version:

```bash
npm i -g @openai/codex
```

Set your token as an env var (persistent):
```powershell
# Windows PowerShell
[Environment]::SetEnvironmentVariable("QWEN_TOKEN", "<your token>", "User")
```
```bash
# macOS / Linux (add to ~/.zshrc or ~/.bashrc)
export QWEN_TOKEN="<your token>"
```

`~/.codex/config.toml` (see [`examples/codex/config.toml`](examples/codex/config.toml)):
```toml
model_provider = "qwen-free"
model = "qwen3.7-max"
model_context_window = 262144
model_max_output_tokens = 32768

[model_providers.qwen-free]
name = "Qwen Free"
base_url = "https://your-proxy.vercel.app/v1"
env_key = "QWEN_TOKEN"
wire_api = "responses"
supports_websockets = false
```

Then run `codex` (or `codex exec "your task"`). It writes files and runs
commands for free through the proxy.

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
