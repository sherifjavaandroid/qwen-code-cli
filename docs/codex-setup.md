# Using OpenAI Codex CLI with this free proxy

Run [Codex](https://developers.openai.com/codex) (`codex`) as a **free agent**
through the proxy, backed by your free `chat.qwen.ai` account — no OpenAI API
billing.

> **Why the Responses API?** Codex 0.144+ **only** speaks OpenAI's *Responses
> API* (`/v1/responses`) — it dropped Chat Completions. This proxy implements
> `/v1/responses`, so Codex works against it. (Qwen Code, Cursor, Cline use the
> Chat Completions endpoint instead — both are supported.)

## 1. Install Codex

```bash
npm install -g @openai/codex
codex --version
```

## 2. Set your token as an environment variable

Codex reads the token from the `QWEN_TOKEN` env var (see the main README for
[how to get your token](../README.md#how-to-get-your-token)).

**Windows (PowerShell) — persistent:**
```powershell
[Environment]::SetEnvironmentVariable("QWEN_TOKEN", "<your chat.qwen.ai token>", "User")
```
(Re-open the terminal afterward.)

**macOS / Linux** — add to `~/.zshrc` or `~/.bashrc`:
```bash
export QWEN_TOKEN="<your chat.qwen.ai token>"
```

## 3. Configure `~/.codex/config.toml`

Use [`examples/codex/config.toml`](../examples/codex/config.toml). Point
`base_url` at your deployed proxy:

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

That makes `qwen-free` the **default** provider, so plain `codex` uses it.

> Prefer to keep it as an opt-in profile instead of the default? Put the
> `model_provider`/`model` lines in a separate `~/.codex/qwen.config.toml`
> (see [`examples/codex/qwen.config.toml`](../examples/codex/qwen.config.toml))
> and select it with `codex -p qwen`. Codex rejects legacy `[profiles.x]`
> tables inside `config.toml`.

## 4. Run it

```bash
codex                       # interactive
codex exec "create a hello.py that prints hi, then run it"   # one-shot
```

Non-interactive file writing:
```bash
codex exec --skip-git-repo-check -s workspace-write "create index.js that prints 2+3"
```

## Notes & limits

- **Tool calling is emulated** by the proxy (the free `chat.qwen.ai` backend has
  no native function-calling). Simple edits/shell commands work well; complex
  `apply_patch` diffs may occasionally misfire — retry or simplify.
- The *"Model metadata for `qwen3.7-max` not found"* warning is harmless; the
  `model_context_window` / `model_max_output_tokens` lines reduce it.
- Free-tier rate limits of your `chat.qwen.ai` account apply.
- Update `QWEN_TOKEN` when the token expires.
