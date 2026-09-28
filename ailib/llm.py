"""One simple interface for several LLM providers: Claude, OpenAI, DeepSeek, Qwen, and local models.

    text = chat(provider="deepseek", messages=[{"role": "user", "content": "Hi!"}])["text"]
    for piece in chat_stream(provider="qwen", messages=messages): print(piece, end="")
    describe_image("https://example.com/photo.jpg", "What's in this photo?")
    transcribe({"url": "https://example.com/talk.wav", "format": "wav"})

OpenAI, DeepSeek, Qwen and Ollama all speak the same "Chat Completions" API, so one
`openai` client with a different base_url talks to all of them. Claude uses its own SDK.

This covers chat, streaming, images and audio. Features that differ a lot between providers
(tools, citations, prompt caching, structured output) are taught with the Claude SDK in the lessons.
"""

import os
import re
from collections.abc import Iterator

from openai import OpenAI

from ailib.claude import client as anthropic  # also loads .env

PROVIDERS = {
    "anthropic": {
        "label": "Claude (Anthropic)",
        "key_env": "ANTHROPIC_API_KEY",
        "model_env": "MODEL",
        "default_model": "claude-opus-5",
        "audio": False,  # Claude reads text, images and PDFs, but not audio
    },
    "openai": {
        "label": "OpenAI",
        "key_env": "OPENAI_API_KEY",
        "model_env": "OPENAI_MODEL",
        "default_model": "gpt-6-sol",
        "base_url_env": "OPENAI_BASE_URL",
        "base_url": None,  # the SDK's default
        "max_tokens_param": "max_completion_tokens",  # OpenAI's newer name for max_tokens
    },
    "deepseek": {
        "label": "DeepSeek",
        "key_env": "DEEPSEEK_API_KEY",
        "model_env": "DEEPSEEK_MODEL",
        "default_model": "deepseek-flash",
        "base_url_env": "DEEPSEEK_BASE_URL",
        "base_url": "https://api.deepseek.com",
    },
    "qwen": {
        "label": "Qwen (Alibaba Cloud Model Studio)",
        "key_env": "DASHSCOPE_API_KEY",
        "model_env": "QWEN_MODEL",
        "vision_model_env": "QWEN_VISION_MODEL",
        "audio_model_env": "QWEN_ASR_MODEL",
        "default_model": "qwen-plus",
        # The console shows your exact API host when you create a key. It depends on your region
        # and workspace, e.g. https://ws-xxxx.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1
        "base_url_env": "QWEN_BASE_URL",
        "base_url": "https://dashscope-us.aliyuncs.com/compatible-mode/v1",
    },
    "ollama": {
        "label": "Local model (Ollama)",
        "key_env": None,  # runs on your computer: no key, no cost
        "model_env": "OLLAMA_MODEL",
        "default_model": "qwen3:4b",
        "base_url_env": "OLLAMA_BASE_URL",
        "base_url": "http://localhost:11434/v1",
    },
}


def _normalize(name: str | None) -> str | None:
    return name.strip().lower() if name else None


# Accepts "qwen", "Qwen" or "QWEN". LLM_PROVIDER and DEFAULT_AI_PROVIDER mean the same thing.
DEFAULT_PROVIDER = _normalize(os.getenv("LLM_PROVIDER") or os.getenv("DEFAULT_AI_PROVIDER")) or "anthropic"
VISION_PROVIDER = _normalize(os.getenv("VISION_PROVIDER")) or DEFAULT_PROVIDER
TRANSCRIPTION_PROVIDER = _normalize(os.getenv("TRANSCRIPTION_PROVIDER")) or DEFAULT_PROVIDER

# Different providers name the same stop reasons differently; use Claude's names everywhere
STOP_REASONS = {"stop": "end_turn", "length": "max_tokens", "content_filter": "refusal", "tool_calls": "tool_use"}


def available_providers() -> list[str]:
    """Providers that have an API key set (Ollama is always listed: it needs no key)."""
    return [name for name, p in PROVIDERS.items() if not p["key_env"] or os.getenv(p["key_env"])]


def _settings_for(provider: str, model: str | None, purpose: str = "chat") -> dict:
    """purpose: "chat", "vision" or "audio". Some providers use a different model for each."""
    provider = _normalize(provider)
    settings = PROVIDERS.get(provider)
    if settings is None:
        raise ValueError(f'Unknown provider "{provider}". Use one of: {", ".join(PROVIDERS)}.')
    if settings["key_env"] and not os.getenv(settings["key_env"]):
        raise ValueError(f"Add {settings['key_env']} to your .env file to use {settings['label']}.")
    purpose_env = {"vision": settings.get("vision_model_env"), "audio": settings.get("audio_model_env")}.get(purpose)
    chosen = model or (purpose_env and os.getenv(purpose_env)) or os.getenv(settings["model_env"]) or settings["default_model"]
    return {**settings, "provider": provider, "model": chosen}


def _must_stream(settings: dict) -> bool:
    """Qwen "Omni" models (which understand text, images and audio) only work with streaming."""
    return settings["provider"] == "qwen" and bool(re.search(r"omni", settings["model"], re.I))


_openai_clients: dict[str, OpenAI] = {}


def openai_client_for(provider: str) -> OpenAI:
    """One OpenAI-compatible client per provider, created on first use (also used by ailib/embeddings.py)."""
    if provider not in _openai_clients:
        settings = PROVIDERS[provider]
        _openai_clients[provider] = OpenAI(
            api_key=os.getenv(settings["key_env"]) if settings["key_env"] else "ollama",  # Ollama ignores the key
            base_url=(settings.get("base_url_env") and os.getenv(settings["base_url_env"])) or settings["base_url"],
        )
    return _openai_clients[provider]


# ---- Message content ----------------------------------------------------------------
# Content is either a string, or a list of parts in ONE format for every provider:
#   {"type": "text", "text": ...}
#   {"type": "image", "url": ...}                  or  {"type": "image", "base64": ..., "media_type": "image/png"}
#   {"type": "audio", "url": ..., "format": "wav"} or  {"type": "audio", "base64": ..., "format": "mp3"}
# These helpers convert the parts into each provider's own format.

def _to_claude_content(content, settings: dict):
    if isinstance(content, str):
        return content
    parts = []
    for part in content:
        if part["type"] == "text":
            parts.append(part)
        elif part["type"] == "image":
            source = ({"type": "url", "url": part["url"]} if "url" in part
                      else {"type": "base64", "media_type": part["media_type"], "data": part["base64"]})
            parts.append({"type": "image", "source": source})
        elif part["type"] == "audio" and settings.get("audio") is False:
            raise ValueError("Claude can't read audio. Use another provider.")
        else:
            raise ValueError(f'Unknown content part type "{part["type"]}"')
    return parts


def _to_openai_content(content, settings: dict):
    if isinstance(content, str):
        return content
    parts = []
    for part in content:
        if part["type"] == "text":
            parts.append(part)
        elif part["type"] == "image":
            url = part.get("url") or f"data:{part['media_type']};base64,{part['base64']}"
            parts.append({"type": "image_url", "image_url": {"url": url}})
        elif part["type"] == "audio":
            # OpenAI wants plain base64; Qwen wants it as a data URL
            data = part.get("url") or (part["base64"] if settings["provider"] == "openai" else f"data:;base64,{part['base64']}")
            parts.append({"type": "input_audio", "input_audio": {"data": data, "format": part["format"]}})
        else:
            raise ValueError(f'Unknown content part type "{part["type"]}"')
    return parts


def _openai_request(settings: dict, system: str | None, messages: list, max_tokens: int) -> dict:
    """Chat Completions puts the system prompt in the messages list; Claude has a separate field."""
    request = {
        "model": settings["model"],
        "messages": ([{"role": "system", "content": system}] if system else [])
        + [{"role": m["role"], "content": _to_openai_content(m["content"], settings)} for m in messages],
        settings.get("max_tokens_param", "max_tokens"): max_tokens,
    }
    if _must_stream(settings):
        request["modalities"] = ["text"]  # Omni models can also answer with speech; we want text
    return request


def _claude_request(settings: dict, system: str | None, messages: list, max_tokens: int) -> dict:
    return {
        "model": settings["model"],
        "max_tokens": max_tokens,
        **({"system": system} if system else {}),
        "messages": [{"role": m["role"], "content": _to_claude_content(m["content"], settings)} for m in messages],
    }


def _stream_events(settings: dict, system, messages, max_tokens) -> Iterator[dict]:
    """Yields {"text": ...} pieces, then one final {"done": True, "stop_reason", "usage"}."""
    if settings["provider"] == "anthropic":
        with anthropic.messages.stream(**_claude_request(settings, system, messages, max_tokens)) as stream:
            for text in stream.text_stream:
                yield {"text": text}
            final = stream.get_final_message()
        yield {"done": True, "stop_reason": final.stop_reason,
               "usage": {"input_tokens": final.usage.input_tokens, "output_tokens": final.usage.output_tokens}}
        return

    stream = openai_client_for(settings["provider"]).chat.completions.create(
        **_openai_request(settings, system, messages, max_tokens),
        stream=True,
        stream_options={"include_usage": True},  # the last chunk then carries the token counts
    )
    finish_reason = usage = None
    for chunk in stream:
        choice = chunk.choices[0] if chunk.choices else None
        if choice and choice.delta and choice.delta.content:
            yield {"text": choice.delta.content}
        if choice and choice.finish_reason:
            finish_reason = choice.finish_reason
        if chunk.usage:
            usage = chunk.usage
    yield {"done": True, "stop_reason": STOP_REASONS.get(finish_reason, finish_reason),
           "usage": {"input_tokens": usage and usage.prompt_tokens, "output_tokens": usage and usage.completion_tokens}}


# ---- Public functions ------------------------------------------------------------------

def chat(*, provider: str = DEFAULT_PROVIDER, model: str | None = None, system: str | None = None,
         messages: list, max_tokens: int = 2048, purpose: str = "chat") -> dict:
    """Send a conversation and get the whole answer back.

    messages: [{"role": "user" | "assistant", "content": "text" or [parts]}]
    Returns {"text", "stop_reason", "usage": {"input_tokens", "output_tokens"}, "provider", "model"}.
    """
    settings = _settings_for(provider, model, purpose)
    result = {"provider": settings["provider"], "model": settings["model"]}

    # Models that only support streaming: stream anyway and collect the pieces
    if _must_stream(settings):
        text = ""
        for event in _stream_events(settings, system, messages, max_tokens):
            if event.get("done"):
                return {**result, "text": text, "stop_reason": event["stop_reason"], "usage": event["usage"]}
            text += event["text"]

    if settings["provider"] == "anthropic":
        response = anthropic.messages.create(**_claude_request(settings, system, messages, max_tokens))
        return {**result,
                "text": "".join(b.text for b in response.content if b.type == "text"),
                "stop_reason": response.stop_reason,
                "usage": {"input_tokens": response.usage.input_tokens, "output_tokens": response.usage.output_tokens}}

    completion = openai_client_for(settings["provider"]).chat.completions.create(
        **_openai_request(settings, system, messages, max_tokens)
    )
    choice = completion.choices[0]
    return {**result,
            "text": choice.message.content or "",
            "stop_reason": STOP_REASONS.get(choice.finish_reason, choice.finish_reason),
            "usage": {"input_tokens": completion.usage and completion.usage.prompt_tokens,
                      "output_tokens": completion.usage and completion.usage.completion_tokens}}


def chat_stream(*, provider: str = DEFAULT_PROVIDER, model: str | None = None, system: str | None = None,
                messages: list, max_tokens: int = 2048, purpose: str = "chat") -> Iterator[str]:
    """Same as chat(), but yields the answer piece by piece as it's generated."""
    settings = _settings_for(provider, model, purpose)
    for event in _stream_events(settings, system, messages, max_tokens):
        if not event.get("done"):
            yield event["text"]


def describe_image(image, question: str = "Describe this image.", *, provider: str = VISION_PROVIDER, model: str | None = None) -> dict:
    """Ask about an image. `image` is a URL, or {"base64": ..., "media_type": ...}.
    Uses VISION_PROVIDER (and QWEN_VISION_MODEL for Qwen) unless you pass a provider."""
    part = {"type": "image", "url": image} if isinstance(image, str) else {"type": "image", **image}
    return chat(provider=provider, model=model, purpose="vision",
                messages=[{"role": "user", "content": [part, {"type": "text", "text": question}]}])


def transcribe(audio: dict, *, provider: str = TRANSCRIPTION_PROVIDER, model: str | None = None, language: str | None = None) -> dict:
    """Turn speech into text. `audio` is {"url": ..., "format": "wav"} or {"base64": ..., "format": "mp3"}.
    Uses TRANSCRIPTION_PROVIDER (and QWEN_ASR_MODEL for Qwen) unless you pass a provider."""
    instructions = "Transcribe this audio exactly, word for word. Reply with the transcript only."
    if language:
        instructions += f" The speech is in {language}."
    return chat(provider=provider, model=model, purpose="audio", max_tokens=8192,
                messages=[{"role": "user", "content": [{"type": "audio", **audio}, {"type": "text", "text": instructions}]}])
