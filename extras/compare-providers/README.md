# Extra: Compare Providers

The lessons use Claude, but [`ailib/llm.py`](../../ailib/llm.py) can also talk to **OpenAI**, **DeepSeek**, **Qwen** and **local models with Ollama** through one simple interface. This script asks all of them the same question so you can compare answers, speed and token counts.

## Run it

Add the keys you have to `.env` (see [`.env.example`](../../.env.example)), then:

```bash
python run.py providers "Explain recursion to a 10-year-old in 3 sentences"
```

Only providers with a key are asked.

## Using `ailib/llm.py` in your own code

```python
from ailib.llm import chat, chat_stream, describe_image, transcribe

# Plain chat (provider defaults to LLM_PROVIDER / DEFAULT_AI_PROVIDER in .env, else Claude)
result = chat(
    provider="deepseek",
    system="You are a helpful tutor.",
    messages=[{"role": "user", "content": "What is a closure?"}],
)
print(result["text"], result["usage"])

# Streaming
for piece in chat_stream(provider="qwen", messages=messages):
    print(piece, end="", flush=True)

# Images (VISION_PROVIDER) and audio (TRANSCRIPTION_PROVIDER)
caption = describe_image("https://example.com/photo.jpg", "What's in this photo?")["text"]
transcript = transcribe({"url": "https://example.com/talk.wav", "format": "wav"}, language="Nepali")["text"]
```

Every function returns `{"text", "stop_reason", "usage": {"input_tokens", "output_tokens"}, "provider", "model"}`, whichever provider answered.

## Providers

| Provider | `.env` key | Default model | Notes |
|---|---|---|---|
| `anthropic` | `ANTHROPIC_API_KEY` | `claude-opus-5` | Text, images and PDFs. No audio input |
| `openai` | `OPENAI_API_KEY` | `gpt-6-sol` | Override with `OPENAI_MODEL` |
| `deepseek` | `DEEPSEEK_API_KEY` | `deepseek-flash` | Override with `DEEPSEEK_MODEL` (e.g. `deepseek-v4-pro`) |
| `qwen` | `DASHSCOPE_API_KEY` | `qwen-plus` | Set `QWEN_BASE_URL` to the API host shown when you create your key. "Omni" models also read images and audio |
| `ollama` | none | `qwen3:4b` | Free, runs on your own computer. [Install Ollama](https://ollama.com), then `ollama pull qwen3:4b` and set `OLLAMA_MODEL` |

OpenAI, DeepSeek, Qwen and Ollama all use the same "Chat Completions" API, so `ailib/llm.py` talks to them with the official `openai` package and a different `base_url`. That's also why adding another compatible provider is usually just a few lines in `PROVIDERS`.

## What's different between providers

`ailib/llm.py` smooths over the small differences for you:

- **System prompt**: Claude takes a separate `system` field; the others take a `system` message.
- **Token limit**: OpenAI's newer models use `max_completion_tokens`; the others use `max_tokens`.
- **Stop reasons**: `stop`/`length` are converted to Claude's `end_turn`/`max_tokens`.
- **Images and audio**: one content format in, each provider's own format out.
- **Qwen Omni models only work with streaming**, so `chat()` streams behind the scenes for them.

The bigger features the course teaches (tool use, citations, prompt caching, structured output) work differently on every provider, so the lessons use the Claude SDK directly for those.

## Keep your keys safe

- Keys go in `.env` only. It's in `.gitignore`, so it's never committed.
- Never paste a key into code, a chat, an issue or a screenshot. If you do, delete it in the provider's console and create a new one.
- Set a spending limit in every provider's console.
