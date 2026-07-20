# Using Qwen Code CLI with this free proxy

This makes the [Qwen Code](https://github.com/QwenLM/qwen-code) CLI (`qwen`) run
as a **free agent** — writing files, running commands, using git — through the
proxy, backed by your free `chat.qwen.ai` account.

## 1. Install Qwen Code

```bash
npm install -g @qwen-code/qwen-code
qwen --version
```

## 2. Point it at the proxy

Create `~/.qwen/.env` (Windows: `C:\Users\<you>\.qwen\.env`) from
[`examples/qwen-code/.env.example`](../examples/qwen-code/.env.example):

```
OPENAI_API_KEY=<your chat.qwen.ai token>
OPENAI_BASE_URL=https://your-proxy.vercel.app/v1
OPENAI_MODEL=qwen3.7-max
```

In `~/.qwen/settings.json` set the auth type to OpenAI-compatible:

```json
{
  "security": { "auth": { "selectedType": "openai" } },
  "model": { "name": "qwen3.7-max" }
}
```

That's the minimum. Run `qwen` and it works as a free coding agent.

> To go back to Qwen's own login later, set `selectedType` to `"qwen-oauth"`.

## 3. (Optional) Add MCP servers — more power

MCP servers add whole new tool sets (git, browser automation, web fetch,
planning, memory). Prerequisites:

- Node.js 18+ (`node`, `npx`)
- [`uv`](https://docs.astral.sh/uv/) for the Python servers (`uvx`)

Install the Node-based servers globally (see the Windows note below for *why*):

```bash
npm i -g @modelcontextprotocol/server-sequential-thinking \
         @modelcontextprotocol/server-memory \
         @playwright/mcp
```

Then merge the `mcpServers` block from
[`examples/qwen-code/settings.json`](../examples/qwen-code/settings.json) into
your `~/.qwen/settings.json`.

Find your global `node_modules` path with:

```bash
npm root -g
# e.g. Windows: C:\Users\<you>\AppData\Roaming\npm\node_modules
#      macOS:   /usr/local/lib/node_modules
```

Replace `<PATH_TO_GLOBAL_NODE_MODULES>` in the example with that path.

Verify every server connects:

```bash
qwen mcp list
```

You want all `✓ Connected`.

### ⚠️ Windows gotcha (important)

On Windows, Qwen Code often **cannot reliably spawn `npx`** (it's `npx.cmd`) —
servers show up flaky/`Disconnected`. The fix used here: install each Node
server globally with `npm i -g`, then launch it with **`command: "node"`** and
the **absolute path** to its entry file (`dist/index.js` or `cli.js`). `node`
is a real executable, so it starts instantly and reliably.

Python servers (`uvx mcp-server-git`, `uvx mcp-server-fetch`) work directly —
no wrapper needed.

## 4. Try it

```bash
mkdir demo && cd demo
qwen -p "Create index.js that prints 2+3, run it, then git init and commit."
```

The agent should write the file, run it (`5`), and make a commit — all free.

## Notes & limits

- **Tool calling is emulated** by the proxy (the free `chat.qwen.ai` backend has
  no native function-calling), so it's not 100% reliable on very long runs. If
  the agent misbehaves with many tools active, disable MCP servers you don't
  need to shrink the tool list.
- Free-tier rate limits of your `chat.qwen.ai` account still apply.
- When your token expires, update `OPENAI_API_KEY` in `~/.qwen/.env`.
