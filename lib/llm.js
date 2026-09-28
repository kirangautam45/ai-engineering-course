// One simple interface for several LLM providers: Claude, OpenAI, DeepSeek, Qwen, and local models.
//
//   const { text } = await chat({ provider: "deepseek", messages: [{ role: "user", content: "Hi!" }] });
//   for await (const piece of chatStream({ provider: "qwen", messages })) process.stdout.write(piece);
//   const { text } = await describeImage("https://example.com/photo.jpg", "What's in this photo?");
//   const { text } = await transcribe({ url: "https://example.com/talk.wav", format: "wav" });
//
// OpenAI, DeepSeek, Qwen and Ollama all speak the same "Chat Completions" API, so one
// `openai` client with a different baseURL talks to all of them. Claude uses its own SDK.
//
// This covers chat, streaming, images and audio. Features that differ a lot between providers
// (tools, citations, prompt caching, structured output) are taught with the Claude SDK in the lessons.
import OpenAI from "openai";
import { client as anthropic } from "./claude.js"; // also loads .env

export const PROVIDERS = {
  anthropic: {
    label: "Claude (Anthropic)",
    keyEnv: "ANTHROPIC_API_KEY",
    modelEnv: "MODEL",
    defaultModel: "claude-opus-5",
    audio: false, // Claude reads text, images and PDFs, but not audio
  },
  openai: {
    label: "OpenAI",
    keyEnv: "OPENAI_API_KEY",
    modelEnv: "OPENAI_MODEL",
    defaultModel: "gpt-6-sol",
    baseURLEnv: "OPENAI_BASE_URL",
    baseURL: undefined, // the SDK's default
    maxTokensParam: "max_completion_tokens", // OpenAI's newer name for max_tokens
  },
  deepseek: {
    label: "DeepSeek",
    keyEnv: "DEEPSEEK_API_KEY",
    modelEnv: "DEEPSEEK_MODEL",
    defaultModel: "deepseek-flash",
    baseURLEnv: "DEEPSEEK_BASE_URL",
    baseURL: "https://api.deepseek.com",
  },
  qwen: {
    label: "Qwen (Alibaba Cloud Model Studio)",
    keyEnv: "DASHSCOPE_API_KEY",
    modelEnv: "QWEN_MODEL",
    visionModelEnv: "QWEN_VISION_MODEL",
    audioModelEnv: "QWEN_ASR_MODEL",
    defaultModel: "qwen-plus",
    // The console shows your exact API host when you create a key. It depends on your region
    // and workspace, e.g. https://ws-xxxx.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1
    baseURLEnv: "QWEN_BASE_URL",
    baseURL: "https://dashscope-us.aliyuncs.com/compatible-mode/v1",
  },
  ollama: {
    label: "Local model (Ollama)",
    keyEnv: null, // runs on your computer: no key, no cost
    modelEnv: "OLLAMA_MODEL",
    defaultModel: "qwen3:4b",
    baseURLEnv: "OLLAMA_BASE_URL",
    baseURL: "http://localhost:11434/v1",
  },
};

// Accepts "qwen", "Qwen" or "QWEN". LLM_PROVIDER and DEFAULT_AI_PROVIDER mean the same thing.
const normalize = (name) => name?.trim().toLowerCase();
export const DEFAULT_PROVIDER = normalize(process.env.LLM_PROVIDER ?? process.env.DEFAULT_AI_PROVIDER) ?? "anthropic";
export const VISION_PROVIDER = normalize(process.env.VISION_PROVIDER) ?? DEFAULT_PROVIDER;
export const TRANSCRIPTION_PROVIDER = normalize(process.env.TRANSCRIPTION_PROVIDER) ?? DEFAULT_PROVIDER;

// Providers that have an API key set (Ollama is always listed: it needs no key)
export function availableProviders() {
  return Object.keys(PROVIDERS).filter((name) => {
    const { keyEnv } = PROVIDERS[name];
    return !keyEnv || Boolean(process.env[keyEnv]);
  });
}

// purpose: "chat", "vision" or "audio". Some providers use a different model for each.
function settingsFor(provider, model, purpose = "chat") {
  provider = normalize(provider);
  const settings = PROVIDERS[provider];
  if (!settings) throw new Error(`Unknown provider "${provider}". Use one of: ${Object.keys(PROVIDERS).join(", ")}.`);
  if (settings.keyEnv && !process.env[settings.keyEnv]) {
    throw new Error(`Add ${settings.keyEnv} to your .env file to use ${settings.label}.`);
  }
  const purposeEnv = { vision: settings.visionModelEnv, audio: settings.audioModelEnv }[purpose];
  const chosen = model ?? (purposeEnv && process.env[purposeEnv]) ?? process.env[settings.modelEnv] ?? settings.defaultModel;
  return { ...settings, provider, model: chosen };
}

// Qwen "Omni" models (which understand text, images and audio) only work with streaming
const mustStream = ({ provider, model }) => provider === "qwen" && /omni/i.test(model);

// One OpenAI-compatible client per provider, created on first use (also used by lib/embeddings.js)
const openAIClients = {};
export function openAIClientFor(provider) {
  const settings = PROVIDERS[provider];
  openAIClients[provider] ??= new OpenAI({
    apiKey: settings.keyEnv ? process.env[settings.keyEnv] : "ollama", // Ollama ignores the key, but the SDK needs one
    baseURL: (settings.baseURLEnv && process.env[settings.baseURLEnv]) || settings.baseURL,
  });
  return openAIClients[provider];
}

// ---- Message content ----------------------------------------------------------
// Content is either a string, or a list of parts in ONE format for every provider:
//   { type: "text", text }
//   { type: "image", url }                   or  { type: "image", base64, mediaType: "image/png" }
//   { type: "audio", url, format: "wav" }    or  { type: "audio", base64, format: "mp3" }
// These helpers convert the parts into each provider's own format.

function toClaudeContent(content, { audio }) {
  if (typeof content === "string") return content;
  return content.map((part) => {
    if (part.type === "text") return part;
    if (part.type === "image") {
      return part.url
        ? { type: "image", source: { type: "url", url: part.url } }
        : { type: "image", source: { type: "base64", media_type: part.mediaType, data: part.base64 } };
    }
    if (part.type === "audio" && audio === false) throw new Error("Claude can't read audio. Use another provider.");
    throw new Error(`Unknown content part type "${part.type}"`);
  });
}

function toOpenAIContent(content, { provider }) {
  if (typeof content === "string") return content;
  return content.map((part) => {
    if (part.type === "text") return part;
    if (part.type === "image") {
      return { type: "image_url", image_url: { url: part.url ?? `data:${part.mediaType};base64,${part.base64}` } };
    }
    if (part.type === "audio") {
      // OpenAI wants plain base64; Qwen wants it as a data URL
      const data = part.url ?? (provider === "openai" ? part.base64 : `data:;base64,${part.base64}`);
      return { type: "input_audio", input_audio: { data, format: part.format } };
    }
    throw new Error(`Unknown content part type "${part.type}"`);
  });
}

// Chat Completions puts the system prompt in the messages list; Claude has a separate field
function toOpenAIRequest(settings, { system, messages, maxTokens }) {
  return {
    model: settings.model,
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      ...messages.map((m) => ({ role: m.role, content: toOpenAIContent(m.content, settings) })),
    ],
    [settings.maxTokensParam ?? "max_tokens"]: maxTokens,
    ...(mustStream(settings) && { modalities: ["text"] }), // Omni models can also answer with speech; we want text
  };
}

function toClaudeRequest(settings, { system, messages, maxTokens }) {
  return {
    model: settings.model,
    max_tokens: maxTokens,
    ...(system && { system }),
    messages: messages.map((m) => ({ role: m.role, content: toClaudeContent(m.content, settings) })),
  };
}

// Different providers name the same stop reasons differently; use Claude's names everywhere
const STOP_REASONS = { stop: "end_turn", length: "max_tokens", content_filter: "refusal", tool_calls: "tool_use" };

// ---- Streaming ---------------------------------------------------------------------
// Yields { text } pieces, then one final { done: true, stopReason, usage }.
async function* streamEvents(settings, request) {
  if (settings.provider === "anthropic") {
    const stream = anthropic.messages.stream(toClaudeRequest(settings, request));
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield { text: event.delta.text };
    }
    const final = await stream.finalMessage();
    yield {
      done: true,
      stopReason: final.stop_reason,
      usage: { inputTokens: final.usage.input_tokens, outputTokens: final.usage.output_tokens },
    };
    return;
  }

  const stream = await openAIClientFor(settings.provider).chat.completions.create({
    ...toOpenAIRequest(settings, request),
    stream: true,
    stream_options: { include_usage: true }, // the last chunk then carries the token counts
  });
  let finishReason;
  let usage;
  for await (const chunk of stream) {
    const choice = chunk.choices[0];
    if (choice?.delta?.content) yield { text: choice.delta.content };
    if (choice?.finish_reason) finishReason = choice.finish_reason;
    if (chunk.usage) usage = chunk.usage;
  }
  yield {
    done: true,
    stopReason: STOP_REASONS[finishReason] ?? finishReason,
    usage: { inputTokens: usage?.prompt_tokens, outputTokens: usage?.completion_tokens },
  };
}

// ---- Public functions ------------------------------------------------------------------

// Send a conversation and get the whole answer back.
// messages: [{ role: "user" | "assistant", content: "text" or [parts] }]
// Returns { text, stopReason, usage: { inputTokens, outputTokens }, provider, model }
export async function chat({ provider = DEFAULT_PROVIDER, model, system, messages, maxTokens = 2048, purpose = "chat" }) {
  const settings = settingsFor(provider, model, purpose);
  const request = { system, messages, maxTokens };
  const result = { provider: settings.provider, model: settings.model };

  // Models that only support streaming: stream anyway and collect the pieces
  if (mustStream(settings)) {
    let text = "";
    for await (const event of streamEvents(settings, request)) {
      if (event.done) return { ...result, text, stopReason: event.stopReason, usage: event.usage };
      text += event.text;
    }
  }

  if (settings.provider === "anthropic") {
    const response = await anthropic.messages.create(toClaudeRequest(settings, request));
    return {
      ...result,
      text: response.content.filter((b) => b.type === "text").map((b) => b.text).join(""),
      stopReason: response.stop_reason,
      usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
    };
  }

  const completion = await openAIClientFor(settings.provider).chat.completions.create(toOpenAIRequest(settings, request));
  const choice = completion.choices[0];
  return {
    ...result,
    text: choice.message.content ?? "",
    stopReason: STOP_REASONS[choice.finish_reason] ?? choice.finish_reason,
    usage: { inputTokens: completion.usage?.prompt_tokens, outputTokens: completion.usage?.completion_tokens },
  };
}

// Same as chat(), but yields the answer piece by piece as it's generated
export async function* chatStream({ provider = DEFAULT_PROVIDER, model, system, messages, maxTokens = 2048, purpose = "chat" }) {
  const settings = settingsFor(provider, model, purpose);
  for await (const event of streamEvents(settings, { system, messages, maxTokens })) {
    if (!event.done) yield event.text;
  }
}

// Ask about an image. `image` is a URL, or { base64, mediaType }.
// Uses VISION_PROVIDER (and QWEN_VISION_MODEL for Qwen) unless you pass a provider.
export async function describeImage(image, question = "Describe this image.", { provider = VISION_PROVIDER, model } = {}) {
  const imagePart = typeof image === "string" ? { type: "image", url: image } : { type: "image", ...image };
  return chat({
    provider,
    model,
    purpose: "vision",
    messages: [{ role: "user", content: [imagePart, { type: "text", text: question }] }],
  });
}

// Turn speech into text. `audio` is { url, format } or { base64, format }, e.g. format "wav" or "mp3".
// Uses TRANSCRIPTION_PROVIDER (and QWEN_ASR_MODEL for Qwen) unless you pass a provider.
export async function transcribe(audio, { provider = TRANSCRIPTION_PROVIDER, model, language } = {}) {
  const instructions =
    "Transcribe this audio exactly, word for word. Reply with the transcript only." +
    (language ? ` The speech is in ${language}.` : "");
  return chat({
    provider,
    model,
    purpose: "audio",
    maxTokens: 8192,
    messages: [{ role: "user", content: [{ type: "audio", ...audio }, { type: "text", text: instructions }] }],
  });
}
