import { PassThrough } from "stream";
import crypto from "crypto";
import _ from "lodash";
import axios, { AxiosResponse } from "axios";

import APIException from "@/lib/exceptions/APIException.ts";
import EX from "@/api/consts/exceptions.ts";
import logger from "@/lib/logger.ts";
import util from "@/lib/util.ts";

// 基础URL
const BASE_URL = "https://chat.qwen.ai";
// 最大重试次数
const MAX_RETRY_COUNT = 3;
// 重试延迟
const RETRY_DELAY = 5000;

// 伪装headers
const FAKE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
  Connection: "keep-alive",
  Accept: "application/json",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Content-Type": "application/json",
  "sec-ch-ua":
    '"Microsoft Edge";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
  source: "web",
  Version: "0.1.13",
  "bx-v": "2.5.31",
  Origin: BASE_URL,
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Dest": "empty",
  "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
};

// 模型名称映射
const MODEL_MAP = {
  "qwen-plus": "qwen3.5-plus",
  "qwen-turbo": "qwen3.5-plus",
  "qwen-max": "qwen3.6-plus",
  "qwen3.5-plus": "qwen3.5-plus",
  "qwen3.5-flash": "qwen3.5-flash",
  "qwen3.6-plus": "qwen3.6-plus",
  "qwen3.6-max-preview": "qwen3.6-max-preview",
  "qwen3.6-27b": "qwen3.6-27b",
  "qwen3.7-plus": "qwen3.7-plus",
  "qwen3.7-max": "qwen3.7-max",
  "qwen3.8-max-preview": "qwen3.8-max-preview",
  "qwen3-max": "qwen3-max",
  "qwen3-coder": "qwen3-coder-plus",
  "qwen3-coder-plus": "qwen3-coder-plus",
  "qwen3-vl-plus": "qwen3-vl-plus",
  "qwen3-vl-flash": "qwen3-vl-flash",
  "qwen3-plus": "qwen3.5-plus",
  "qwen-think": "qwen3.5-plus",
  "qwen-search": "qwen3.5-plus",
  "qwen-think-search": "qwen3.5-plus",
};

// 是否启用思考的模型
const THINKING_MODELS = ["qwen-think", "qwen-think-search"];

// 是否启用搜索的模型
const SEARCH_MODELS = ["qwen-search", "qwen-think-search"];

/**
 * 从Authorization头中提取token列表
 */
function tokenSplit(authorization: string): string[] {
  return authorization
    .replace("Bearer ", "")
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v);
}

/**
 * 获取token存活状态
 */
async function getTokenLiveStatus(token: string): Promise<boolean> {
  try {
    const result = await axios.get(`${BASE_URL}/api/v1/auths/`, {
      headers: {
        ...FAKE_HEADERS,
        Authorization: `Bearer ${token}`,
        Referer: `${BASE_URL}/`,
      },
      timeout: 15000,
      validateStatus: () => true,
    });
    return result.status === 200;
  } catch (err) {
    logger.error("Token检查失败:", err.message);
    return false;
  }
}

/**
 * 消息预处理 - 将OpenAI格式转为单条消息
 */
function messagesPrepare(messages: any[]): string {
  const validMessages = messages.filter((msg) =>
    ["system", "user", "assistant"].includes(msg.role)
  );

  // 提取文本内容
  const extractContent = (content: any): string => {
    if (_.isString(content)) return content;
    if (_.isArray(content)) {
      return content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n");
    }
    return "";
  };

  // 合并连续同角色消息
  const mergedMessages: any[] = [];
  for (const msg of validMessages) {
    const content = extractContent(msg.content);
    if (!content) continue;
    if (
      mergedMessages.length > 0 &&
      mergedMessages[mergedMessages.length - 1].role === msg.role
    ) {
      mergedMessages[mergedMessages.length - 1].content += "\n" + content;
    } else {
      mergedMessages.push({ role: msg.role, content });
    }
  }

  // 如果只有一条用户消息，直接返回
  if (mergedMessages.length === 1 && mergedMessages[0].role === "user") {
    return mergedMessages[0].content;
  }

  // 多轮对话 - 用角色前缀格式化
  return mergedMessages
    .map((msg) => {
      switch (msg.role) {
        case "system":
          return `System: ${msg.content}`;
        case "assistant":
          return `Assistant: ${msg.content}`;
        case "user":
          return `User: ${msg.content}`;
        default:
          return msg.content;
      }
    })
    .join("\n\n");
}

/**
 * 提取消息文本内容（支持字符串或OpenAI多模态数组）
 */
function extractTextContent(content: any): string {
  if (_.isString(content)) return content;
  if (_.isArray(content)) {
    return content
      .filter((item) => item && item.type === "text")
      .map((item) => item.text)
      .join("\n");
  }
  return "";
}

/**
 * 构建工具调用(Function Calling)的系统提示词
 * chat.qwen.ai 的网页后端不原生支持 OpenAI tools 协议，
 * 因此这里用提示词方式让模型输出 Qwen 原生的 <tool_call> 格式，随后再解析回 OpenAI tool_calls。
 */
function buildToolSystemPrompt(tools: any[]): string {
  const toolDefs = tools
    .map((t) => (t && t.type === "function" && t.function ? t.function : t))
    .filter(Boolean);
  const toolsJson = JSON.stringify(toolDefs, null, 2);
  return [
    "# Tool Calling",
    "",
    "You are an agent with access to the tools listed below. When you need to use a tool, you MUST reply with one or more tool-call blocks in EXACTLY this format (Qwen native format):",
    "",
    "<tool_call>",
    '{"name": "<tool_name>", "arguments": {<json-arguments>}}',
    "</tool_call>",
    "",
    "Strict rules:",
    "- When calling tools, output ONLY the <tool_call> block(s). Do NOT add any prose before or after them.",
    '- "arguments" MUST be a valid JSON object that matches the tool\'s parameter schema.',
    "- To call several tools at once, emit several <tool_call> blocks back to back.",
    "- Tool results are returned to you inside <tool_response> blocks. Use them to continue.",
    "- When the task is finished and you are giving the final answer to the user, reply in plain text with NO <tool_call> block.",
    "",
    "Available tools (JSON Schema):",
    "<tools>",
    toolsJson,
    "</tools>",
  ].join("\n");
}

/**
 * 解析可能包裹在 markdown 代码块中的 JSON
 */
function safeParseToolJson(raw: string): any {
  if (!raw) return null;
  let s = raw.trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) s = fence[1].trim();
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * 将解析出的 {name, arguments} 转换为 OpenAI tool_call 结构
 */
function toOpenAIToolCall(parsed: any): any {
  const args = parsed.arguments;
  return {
    id: `call_${util.uuid(false).slice(0, 24)}`,
    type: "function",
    function: {
      name: parsed.name,
      arguments: _.isString(args) ? args : JSON.stringify(args ?? {}),
    },
  };
}

/**
 * 从模型文本输出中解析 <tool_call> 块，返回清理后的正文与 tool_calls 列表
 */
function parseToolCalls(text: string): { content: string; toolCalls: any[] } {
  const toolCalls: any[] = [];
  const regex = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const parsed = safeParseToolJson(match[1]);
    if (parsed && parsed.name) toolCalls.push(toOpenAIToolCall(parsed));
  }
  let content = text.replace(regex, "").trim();

  // 回退：模型可能省略了标签，直接输出了一个裸的工具调用 JSON
  if (!toolCalls.length) {
    const bare = safeParseToolJson(text);
    if (bare && bare.name && bare.arguments !== undefined) {
      toolCalls.push(toOpenAIToolCall(bare));
      content = "";
    }
  }
  return { content, toolCalls };
}

/**
 * 带工具定义的消息预处理：注入工具系统提示词，并把工具调用/结果历史还原为文本
 */
function messagesPrepareWithTools(messages: any[], tools: any[]): string {
  const parts: string[] = [buildToolSystemPrompt(tools)];

  for (const msg of messages) {
    switch (msg.role) {
      case "system": {
        const c = extractTextContent(msg.content);
        if (c) parts.push(`System: ${c}`);
        break;
      }
      case "user": {
        const c = extractTextContent(msg.content);
        if (c) parts.push(`User: ${c}`);
        break;
      }
      case "assistant": {
        let c = extractTextContent(msg.content);
        if (_.isArray(msg.tool_calls) && msg.tool_calls.length) {
          const calls = msg.tool_calls
            .map((tc: any) => {
              const name = tc.function?.name;
              let args: any = tc.function?.arguments;
              try {
                args = JSON.parse(args);
              } catch {
                /* keep raw */
              }
              return `<tool_call>\n${JSON.stringify({
                name,
                arguments: args ?? {},
              })}\n</tool_call>`;
            })
            .join("\n");
          c = c ? `${c}\n${calls}` : calls;
        }
        if (c) parts.push(`Assistant: ${c}`);
        break;
      }
      case "tool": {
        const c = extractTextContent(msg.content);
        const name = msg.name || msg.tool_call_id || "";
        parts.push(
          `Tool result${name ? ` for ${name}` : ""}:\n<tool_response>\n${c}\n</tool_response>`
        );
        break;
      }
    }
  }

  // 提示模型继续输出
  parts.push("Assistant:");
  return parts.join("\n\n");
}

/**
 * 把一个完整的 completion 结果转换为 SSE 流（用于带工具时的流式返回）
 */
function buildStreamFromCompletion(completion: any): PassThrough {
  const transStream = new PassThrough();
  const choice = completion.choices[0];
  const base = {
    id: completion.id,
    model: completion.model,
    object: "chat.completion.chunk",
    created: completion.created,
  };
  const send = (delta: any, finishReason: any = null) =>
    transStream.write(
      `data: ${JSON.stringify({
        ...base,
        choices: [{ index: 0, delta, finish_reason: finishReason }],
      })}\n\n`
    );

  send({ role: "assistant", content: "" });
  if (choice.message.tool_calls?.length) {
    send({
      tool_calls: choice.message.tool_calls.map((tc: any, i: number) => ({
        index: i,
        id: tc.id,
        type: "function",
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
    });
  } else if (choice.message.content) {
    send({ content: choice.message.content });
  }
  send({}, choice.finish_reason || "stop");
  transStream.write("data: [DONE]\n\n");
  transStream.end();
  return transStream;
}

/**
 * 确定实际使用的Qwen模型ID
 */
function resolveModel(model: string): string {
  // Mapped alias first; otherwise pass the id through to chat.qwen.ai as-is
  // (so any valid Qwen model id works without editing this map).
  return MODEL_MAP[model] || model || "qwen3.5-plus";
}

/**
 * 判断是否为guest模式（无token）
 */
function isGuestMode(token: string): boolean {
  return !token || token === "guest" || token === "none";
}

/**
 * 创建对话
 */
async function createConversation(
  model: string,
  token: string,
  chatType: string = "t2t"
): Promise<string> {
  const qwenModel = resolveModel(model);
  const isGuest = isGuestMode(token);

  const headers: Record<string, string> = {
    ...FAKE_HEADERS,
    Timezone: new Date().toString(),
    "x-request-id": util.uuid(),
    Referer: isGuest ? `${BASE_URL}/c/guest` : `${BASE_URL}/`,
  };

  if (!isGuest) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const body = {
    title: "New Chat",
    models: [qwenModel],
    chat_mode: isGuest ? "guest" : "normal",
    chat_type: chatType,
    timestamp: Date.now(),
    project_id: "",
  };

  const result = await axios.post(`${BASE_URL}/api/v2/chats/new`, body, {
    headers,
    timeout: 15000,
    validateStatus: () => true,
  });

  const chatId = result.data?.data?.id || result.data?.id;
  if (!chatId) {
    logger.error("创建对话失败:", JSON.stringify(result.data));
    throw new APIException(
      EX.API_REQUEST_FAILED,
      `创建对话失败: ${JSON.stringify(result.data)}`
    );
  }
  logger.info(`对话已创建: ${chatId}`);
  return chatId;
}

/**
 * 删除对话（清理）
 */
async function removeConversation(chatId: string, token: string) {
  const isGuest = isGuestMode(token);
  if (isGuest) return;

  try {
    await axios.delete(`${BASE_URL}/api/v2/chats/${chatId}`, {
      headers: {
        ...FAKE_HEADERS,
        Authorization: `Bearer ${token}`,
        Referer: `${BASE_URL}/`,
      },
      timeout: 15000,
      validateStatus: () => true,
    });
    logger.info(`对话已删除: ${chatId}`);
  } catch (err) {
    logger.warn(`删除对话失败: ${err.message}`);
  }
}

/**
 * 构建完成请求body
 */
function buildCompletionBody(
  model: string,
  chatId: string,
  content: string,
  token: string
): any {
  const qwenModel = resolveModel(model);
  const isGuest = isGuestMode(token);
  const enableThinking = THINKING_MODELS.includes(model);
  const enableSearch = SEARCH_MODELS.includes(model);
  const chatType = enableSearch ? "search" : "t2t";

  return {
    stream: true,
    incremental_output: true,
    chat_type: chatType,
    model: qwenModel,
    messages: [
      {
        role: "user",
        content: content,
        chat_type: chatType,
        extra: {},
        feature_config: {
          thinking_enabled: enableThinking,
          output_schema: "phase",
        },
      },
    ],
    session_id: util.uuid(),
    id: util.uuid(),
    sub_chat_type: chatType,
    chat_mode: isGuest ? "guest" : "normal",
    chat_id: chatId,
  };
}

/**
 * 发送完成请求并返回流
 */
async function sendCompletionRequest(
  model: string,
  chatId: string,
  content: string,
  token: string
): Promise<AxiosResponse> {
  const isGuest = isGuestMode(token);

  const headers: Record<string, string> = {
    ...FAKE_HEADERS,
    Timezone: new Date().toString(),
    "x-request-id": util.uuid(),
    "x-accel-buffering": "no",
    Referer: isGuest ? `${BASE_URL}/c/guest` : `${BASE_URL}/c/${chatId}`,
  };

  if (!isGuest) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const body = buildCompletionBody(model, chatId, content, token);

  return await axios.post(
    `${BASE_URL}/api/v2/chat/completions?chat_id=${chatId}`,
    body,
    {
      headers,
      timeout: 120000,
      responseType: "stream",
      validateStatus: () => true,
    }
  );
}

/**
 * 从流中接收完整响应（非流式）
 */
async function receiveStream(
  model: string,
  stream: any
): Promise<{ content: string; thinkingContent: string; responseId: string }> {
  return new Promise((resolve, reject) => {
    let content = "";
    let thinkingContent = "";
    let responseId = "";
    let buffer = "";

    stream.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") continue;

        try {
          const data = JSON.parse(dataStr);

          if (data["response.created"]) {
            responseId = data["response.created"].response_id || responseId;
            continue;
          }

          const choices = data.choices;
          if (!choices || !choices[0]) continue;

          const delta = choices[0].delta;
          if (!delta) continue;

          const phase = delta.phase;
          const status = delta.status;

          if (phase === "thinking_summary" && status === "typing") {
            if (delta.extra?.summary_thought?.content) {
              thinkingContent += delta.extra.summary_thought.content.join("");
            }
          } else if (phase === "answer" && status === "typing") {
            if (delta.content) {
              content += delta.content;
            }
          }
        } catch (err) {
          // 忽略解析错误
        }
      }
    });

    stream.on("end", () => {
      resolve({ content, thinkingContent, responseId });
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * 创建非流式完成
 */
async function createCompletion(
  model: string,
  messages: any[],
  token: string,
  refConvId?: string,
  retryCount = 0,
  tools?: any[],
  toolChoice?: any
) {
  const useTools =
    _.isArray(tools) && tools.length > 0 && toolChoice !== "none";
  return (async () => {
    const content = useTools
      ? messagesPrepareWithTools(messages, tools)
      : messagesPrepare(messages);
    const chatType = SEARCH_MODELS.includes(model) ? "search" : "t2t";
    const chatId =
      refConvId || (await createConversation(model, token, chatType));

    const result = await sendCompletionRequest(model, chatId, content, token);

    // 检查非流式错误响应
    if (result.headers["content-type"]?.includes("application/json")) {
      const errorData = await new Promise<string>((resolve) => {
        let data = "";
        result.data.on("data", (chunk) => (data += chunk.toString()));
        result.data.on("end", () => resolve(data));
      });
      throw new APIException(EX.API_REQUEST_FAILED, `请求失败: ${errorData}`);
    }

    const {
      content: responseContent,
      thinkingContent,
      responseId,
    } = await receiveStream(model, result.data);

    // 异步删除对话
    if (!refConvId) {
      removeConversation(chatId, token).catch(() => {});
    }

    // 工具模式：解析 <tool_call> 并以 OpenAI tool_calls 返回
    if (useTools) {
      const { content: cleaned, toolCalls } = parseToolCalls(responseContent);
      if (toolCalls.length) {
        return {
          id: responseId || chatId,
          model,
          object: "chat.completion",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: cleaned || null,
                tool_calls: toolCalls,
              },
              finish_reason: "tool_calls",
            },
          ],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          created: util.unixTimestamp(),
        };
      }
      return {
        id: responseId || chatId,
        model,
        object: "chat.completion",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: cleaned,
              ...(thinkingContent
                ? { reasoning_content: thinkingContent }
                : {}),
            },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        created: util.unixTimestamp(),
      };
    }

    return {
      id: responseId || chatId,
      model,
      object: "chat.completion",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: responseContent,
            ...(thinkingContent
              ? { reasoning_content: thinkingContent }
              : {}),
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 1,
        completion_tokens: 1,
        total_tokens: 2,
      },
      created: util.unixTimestamp(),
    };
  })().catch((err) => {
    if (retryCount < MAX_RETRY_COUNT) {
      logger.error(
        `Stream error (will retry ${retryCount + 1}/${MAX_RETRY_COUNT}):`,
        err.message
      );
      return (async () => {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return createCompletion(
          model,
          messages,
          token,
          null,
          retryCount + 1,
          tools,
          toolChoice
        );
      })();
    }
    throw err;
  });
}

/**
 * 创建流式转换流
 */
function createTransStream(
  model: string,
  stream: any,
  chatId: string,
  endCallback?: Function
): PassThrough {
  const transStream = new PassThrough();
  let responseId = chatId;

  const writeChunk = (
    content: string,
    reasoningContent?: string,
    finishReason?: string
  ) => {
    const chunk: any = {
      id: responseId,
      model,
      object: "chat.completion.chunk",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: content || "",
            ...(reasoningContent !== undefined
              ? { reasoning_content: reasoningContent }
              : {}),
          },
          finish_reason: finishReason || null,
        },
      ],
      created: util.unixTimestamp(),
    };
    transStream.write(`data: ${JSON.stringify(chunk)}\n\n`);
  };

  let buffer = "";

  stream.on("data", (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === "[DONE]") continue;

      try {
        const data = JSON.parse(dataStr);

        if (data["response.created"]) {
          responseId = data["response.created"].response_id || responseId;
          continue;
        }

        const choices = data.choices;
        if (!choices || !choices[0]) continue;

        const delta = choices[0].delta;
        if (!delta) continue;

        const phase = delta.phase;
        const status = delta.status;

        if (phase === "thinking_summary") {
          if (status === "typing") {
            if (delta.extra?.summary_thought?.content) {
              const thinkText = delta.extra.summary_thought.content.join("");
              if (thinkText) {
                writeChunk("", thinkText);
              }
            }
          }
        } else if (phase === "answer") {
          if (status === "typing") {
            if (delta.content) {
              writeChunk(delta.content);
            }
          } else if (status === "finished") {
            writeChunk("", undefined, "stop");
            transStream.write("data: [DONE]\n\n");
            transStream.end();
            endCallback && endCallback();
          }
        }
      } catch (err) {
        // 忽略解析错误
      }
    }
  });

  stream.on("error", (err) => {
    logger.error("Stream error:", err.message);
    writeChunk(`\n[Stream Error] ${err.message}`, undefined, "stop");
    transStream.write("data: [DONE]\n\n");
    transStream.end();
    endCallback && endCallback();
  });

  stream.on("end", () => {
    if (!transStream.writableEnded) {
      writeChunk("", undefined, "stop");
      transStream.write("data: [DONE]\n\n");
      transStream.end();
      endCallback && endCallback();
    }
  });

  return transStream;
}

/**
 * 创建流式完成
 */
async function createCompletionStream(
  model: string,
  messages: any[],
  token: string,
  refConvId?: string,
  retryCount = 0,
  tools?: any[],
  toolChoice?: any
) {
  const useTools =
    _.isArray(tools) && tools.length > 0 && toolChoice !== "none";
  // 工具模式：先取得完整结果（含 tool_calls 解析），再以 SSE 形式一次性回放
  if (useTools) {
    const completion = await createCompletion(
      model,
      messages,
      token,
      refConvId,
      0,
      tools,
      toolChoice
    );
    return buildStreamFromCompletion(completion);
  }
  return (async () => {
    const content = messagesPrepare(messages);
    const chatType = SEARCH_MODELS.includes(model) ? "search" : "t2t";
    const chatId =
      refConvId || (await createConversation(model, token, chatType));

    const result = await sendCompletionRequest(model, chatId, content, token);

    // 检查非流式错误响应
    if (result.headers["content-type"]?.includes("application/json")) {
      const errorData = await new Promise<string>((resolve) => {
        let data = "";
        result.data.on("data", (chunk) => (data += chunk.toString()));
        result.data.on("end", () => resolve(data));
      });
      throw new APIException(EX.API_REQUEST_FAILED, `请求失败: ${errorData}`);
    }

    const transStream = createTransStream(model, result.data, chatId, () => {
      if (!refConvId) {
        removeConversation(chatId, token).catch(() => {});
      }
    });

    return transStream;
  })().catch((err) => {
    if (retryCount < MAX_RETRY_COUNT) {
      logger.error(
        `Stream error (will retry ${retryCount + 1}/${MAX_RETRY_COUNT}):`,
        err.message
      );
      return (async () => {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return createCompletionStream(
          model,
          messages,
          token,
          null,
          retryCount + 1
        );
      })();
    }
    throw err;
  });
}

// ============================================================
//  OpenAI Responses API (/v1/responses) — for Codex CLI etc.
//  Codex only supports the Responses wire API. We translate it
//  onto the same chat.qwen.ai flow + <tool_call> emulation.
// ============================================================

/** 提取 Responses 输入内容中的文本（content 可能是字符串或 parts 数组） */
function extractResponsesText(content: any): string {
  if (_.isString(content)) return content;
  if (_.isArray(content)) {
    return content
      .filter(
        (p) =>
          p &&
          (p.type === "input_text" ||
            p.type === "output_text" ||
            p.type === "text") &&
          p.text
      )
      .map((p) => p.text)
      .join("\n");
  }
  return "";
}

/** 把 Responses 请求（instructions + input items + tools）拍平成单条提示词 */
function prepareResponsesPrompt(
  instructions: any,
  input: any,
  tools: any[]
): string {
  const parts: string[] = [];
  if (_.isArray(tools) && tools.length) parts.push(buildToolSystemPrompt(tools));
  if (instructions && _.isString(instructions))
    parts.push(`System: ${instructions}`);

  const items = _.isString(input)
    ? [{ type: "message", role: "user", content: input }]
    : _.isArray(input)
    ? input
    : [];

  const cap = (r: string) =>
    r === "system" ? "System" : r === "assistant" ? "Assistant" : r === "tool" ? "Tool" : "User";

  for (const item of items) {
    if (!item) continue;
    const type = item.type || "message";
    if (type === "message") {
      const text = extractResponsesText(item.content);
      if (text) parts.push(`${cap(item.role || "user")}: ${text}`);
    } else if (type === "function_call") {
      let args: any = item.arguments;
      try {
        args = JSON.parse(args);
      } catch {
        /* keep raw */
      }
      parts.push(
        `Assistant: <tool_call>\n${JSON.stringify({
          name: item.name,
          arguments: args ?? {},
        })}\n</tool_call>`
      );
    } else if (type === "function_call_output") {
      const out = _.isString(item.output)
        ? item.output
        : JSON.stringify(item.output);
      parts.push(`Tool result:\n<tool_response>\n${out}\n</tool_response>`);
    }
    // reasoning / other item types are ignored
  }

  parts.push("Assistant:");
  return parts.join("\n\n");
}

/** 执行一次 chat.qwen.ai 往返，返回完整文本 */
async function fetchQwenAnswer(
  model: string,
  content: string,
  token: string,
  refConvId?: string
): Promise<{ responseContent: string; responseId: string }> {
  const chatType = SEARCH_MODELS.includes(model) ? "search" : "t2t";
  const chatId = refConvId || (await createConversation(model, token, chatType));
  const result = await sendCompletionRequest(model, chatId, content, token);
  if (result.headers["content-type"]?.includes("application/json")) {
    const errorData = await new Promise<string>((resolve) => {
      let data = "";
      result.data.on("data", (chunk) => (data += chunk.toString()));
      result.data.on("end", () => resolve(data));
    });
    throw new APIException(EX.API_REQUEST_FAILED, `请求失败: ${errorData}`);
  }
  const { content: responseContent, responseId } = await receiveStream(
    model,
    result.data
  );
  if (!refConvId) removeConversation(chatId, token).catch(() => {});
  return { responseContent, responseId: responseId || chatId };
}

/** 构建 Responses 的 output 项数组 */
function buildResponsesOutput(textContent: string, toolCalls: any[]): any[] {
  const output: any[] = [];
  if (textContent) {
    output.push({
      type: "message",
      id: `msg_${util.uuid(false).slice(0, 24)}`,
      status: "completed",
      role: "assistant",
      content: [{ type: "output_text", text: textContent, annotations: [] }],
    });
  }
  for (const tc of toolCalls) {
    output.push({
      type: "function_call",
      id: `fc_${util.uuid(false).slice(0, 24)}`,
      call_id: tc.id,
      name: tc.function.name,
      arguments: tc.function.arguments,
      status: "completed",
    });
  }
  return output;
}

/** 非流式 Responses */
async function createResponses(model: string, body: any, token: string) {
  const { instructions, input, tools, tool_choice } = body;
  const content = prepareResponsesPrompt(instructions, input, tools);
  const { responseContent } = await fetchQwenAnswer(model, content, token);
  const useTools =
    _.isArray(tools) && tools.length > 0 && tool_choice !== "none";
  let textContent = responseContent;
  let toolCalls: any[] = [];
  if (useTools) {
    const parsed = parseToolCalls(responseContent);
    textContent = parsed.content;
    toolCalls = parsed.toolCalls;
  }
  const output = buildResponsesOutput(textContent, toolCalls);
  return {
    id: `resp_${util.uuid(false).slice(0, 24)}`,
    object: "response",
    created_at: util.unixTimestamp(),
    status: "completed",
    model,
    output,
    usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
  };
}

/**
 * 流式 Responses。立即返回流并先发送 response.created，随后在后台请求
 * chat.qwen.ai；生成期间发送 SSE 心跳，避免客户端（如 Codex）因长时间
 * 无字节而断开（"stream closed before response.completed"）。
 */
function createResponsesStream(model: string, body: any, token: string) {
  const { instructions, input, tools, tool_choice } = body;
  const content = prepareResponsesPrompt(instructions, input, tools);
  const useTools =
    _.isArray(tools) && tools.length > 0 && tool_choice !== "none";
  const respId = `resp_${util.uuid(false).slice(0, 24)}`;

  const ts = new PassThrough();
  let seq = 0;
  const emit = (type: string, obj: any) => {
    try {
      ts.write(
        `event: ${type}\ndata: ${JSON.stringify({
          type,
          sequence_number: seq++,
          ...obj,
        })}\n\n`
      );
    } catch {
      /* stream may be closed */
    }
  };
  const resp = (status: string, out: any[], error?: any) => ({
    id: respId,
    object: "response",
    created_at: util.unixTimestamp(),
    status,
    model,
    output: out,
    error: error || null,
    usage:
      status === "completed"
        ? { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
        : null,
  });

  // 立即发送首批事件，让客户端马上收到字节
  emit("response.created", { response: resp("in_progress", []) });
  emit("response.in_progress", { response: resp("in_progress", []) });

  // 生成期间发送心跳（SSE 注释行，解析器会忽略），保持连接
  const heartbeat = setInterval(() => {
    try {
      ts.write(`: keepalive\n\n`);
    } catch {
      /* ignore */
    }
  }, 5000);

  (async () => {
    try {
      // 注意：不把 previous_response_id 当作 chat.qwen.ai 的 chatId（两者不同），
      // Codex 每次都会重发完整历史，因此这里保持无状态。
      const { responseContent } = await fetchQwenAnswer(model, content, token);
      let textContent = responseContent;
      let toolCalls: any[] = [];
      if (useTools) {
        const parsed = parseToolCalls(responseContent);
        textContent = parsed.content;
        toolCalls = parsed.toolCalls;
      }
      const output = buildResponsesOutput(textContent, toolCalls);

      let idx = 0;
      for (const item of output) {
        if (item.type === "message") {
          const text = item.content[0].text;
          emit("response.output_item.added", {
            output_index: idx,
            item: { ...item, status: "in_progress", content: [] },
          });
          emit("response.content_part.added", {
            item_id: item.id,
            output_index: idx,
            content_index: 0,
            part: { type: "output_text", text: "", annotations: [] },
          });
          emit("response.output_text.delta", {
            item_id: item.id,
            output_index: idx,
            content_index: 0,
            delta: text,
          });
          emit("response.output_text.done", {
            item_id: item.id,
            output_index: idx,
            content_index: 0,
            text,
          });
          emit("response.content_part.done", {
            item_id: item.id,
            output_index: idx,
            content_index: 0,
            part: item.content[0],
          });
          emit("response.output_item.done", { output_index: idx, item });
        } else if (item.type === "function_call") {
          emit("response.output_item.added", {
            output_index: idx,
            item: { ...item, status: "in_progress", arguments: "" },
          });
          emit("response.function_call_arguments.delta", {
            item_id: item.id,
            output_index: idx,
            delta: item.arguments,
          });
          emit("response.function_call_arguments.done", {
            item_id: item.id,
            output_index: idx,
            arguments: item.arguments,
          });
          emit("response.output_item.done", { output_index: idx, item });
        }
        idx++;
      }

      emit("response.completed", { response: resp("completed", output) });
      ts.write("data: [DONE]\n\n");
    } catch (err: any) {
      logger.error("responses stream error:", err?.message || err);
      emit("response.failed", {
        response: resp("failed", [], {
          code: "upstream_error",
          message: String(err?.message || err),
        }),
      });
      ts.write("data: [DONE]\n\n");
    } finally {
      clearInterval(heartbeat);
      ts.end();
    }
  })();

  return ts;
}

export default {
  createCompletion,
  createCompletionStream,
  createResponses,
  createResponsesStream,
  tokenSplit,
  getTokenLiveStatus,
};
