import axios from 'axios';
import { v4 as uuid } from 'uuid';

const TOKEN = process.env.QWEN_TOKEN || "";
if (!TOKEN) {
  console.error("Set your chat.qwen.ai token first:  QWEN_TOKEN=... node test-api.js");
  process.exit(1);
}
const BASE = "https://chat.qwen.ai";

const FAKE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
  "Connection": "keep-alive",
  "Accept": "application/json",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Content-Type": "application/json",
  "sec-ch-ua": '"Microsoft Edge";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
  "source": "web",
  "Version": "0.1.13",
  "bx-v": "2.5.31",
  "Origin": BASE,
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Dest": "empty",
  "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
};

async function main() {
  // Step 1: Create chat
  console.log("=== Creating chat ===");
  const chatRes = await axios.post(`${BASE}/api/v2/chats/new`, {
    title: "New Chat",
    models: ["qwen3.5-plus"],
    chat_mode: "normal",
    chat_type: "t2t",
    timestamp: Date.now(),
    project_id: ""
  }, {
    headers: {
      ...FAKE_HEADERS,
      Authorization: `Bearer ${TOKEN}`,
      Referer: `${BASE}/`,
    },
    validateStatus: () => true,
  });
  console.log("Chat response:", JSON.stringify(chatRes.data));
  const chatId = chatRes.data?.data?.id;
  if (!chatId) { console.log("FAILED to create chat"); return; }
  console.log("Chat ID:", chatId);

  // Step 2: Send completion
  console.log("\n=== Sending completion ===");

  const body = {
    stream: true,
    incremental_output: true,
    chat_type: "t2t",
    model: "qwen3.5-plus",
    messages: [
      {
        role: "user",
        content: "Say hi in one word",
        chat_type: "t2t",
        extra: {},
        feature_config: {
          thinking_enabled: false,
          output_schema: "phase",
        },
      },
    ],
    session_id: uuid(),
    id: uuid(),
    sub_chat_type: "t2t",
    chat_mode: "normal",
    chat_id: chatId,
  };

  const compRes = await axios.post(
    `${BASE}/api/v2/chat/completions?chat_id=${chatId}`,
    body,
    {
      headers: {
        ...FAKE_HEADERS,
        Authorization: `Bearer ${TOKEN}`,
        Timezone: new Date().toString(),
        "x-request-id": uuid(),
        "x-accel-buffering": "no",
        Referer: `${BASE}/c/${chatId}`,
      },
      responseType: "stream",
      validateStatus: () => true,
    }
  );

  console.log("Status:", compRes.status);
  console.log("Content-Type:", compRes.headers["content-type"]);
  console.log("x-actual-status-code:", compRes.headers["x-actual-status-code"]);

  // Read the response
  let data = "";
  compRes.data.on("data", (chunk) => { data += chunk.toString(); });
  compRes.data.on("end", () => {
    console.log("\n=== Response ===");
    console.log(data.slice(0, 3000));
  });
}

main().catch(console.error);
