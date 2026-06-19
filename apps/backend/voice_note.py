import base64
import json
import os
import warnings
from datetime import datetime

from pydantic import BaseModel, Field

VOICE_NOTE_MODEL = os.environ.get("VOICE_NOTE_MODEL", "gemini-3.5-flash")

SYSTEM_INSTRUCTION = (
    "You summarize mechanic voice notes for a motorcycle repair shop invoice. "
    "Transcribe the audio accurately. Extract work performed, parts mentioned, "
    "diagnostics, issues found, and recommended follow-ups as concise bullet points. "
    "Ignore filler words. Use plain language suitable for an internal shop record."
)

USER_PROMPT = (
    "Transcribe this mechanic voice note and summarize it as bullet points "
    "for the invoice record."
)


class VoiceNoteSummary(BaseModel):
    transcript: str
    summaryBullets: list[str] = Field(default_factory=list)


def is_auth_api_key(api_key: str) -> bool:
    """Google AI Studio authorization keys (AQ.) replace legacy AIza traffic keys."""
    return api_key.strip().startswith("AQ.")


def normalize_audio_mime_type(mime_type: str) -> str:
    base_type = (mime_type or "").split(";")[0].strip().lower()

    if not base_type:
        return "audio/webm"

    supported = {
        "audio/wav",
        "audio/x-wav",
        "audio/mpeg",
        "audio/mp3",
        "audio/aiff",
        "audio/aac",
        "audio/mp4",
        "audio/ogg",
        "audio/flac",
        "audio/webm",
    }

    if base_type in supported:
        if base_type == "audio/x-wav":
            return "audio/wav"
        if base_type == "audio/mp3":
            return "audio/mpeg"
        return base_type

    if "ogg" in base_type:
        return "audio/ogg"
    if "mp4" in base_type or "m4a" in base_type:
        return "audio/mp4"
    if "webm" in base_type:
        return "audio/webm"

    return base_type


def interactions_audio_mime_type(mime_type: str) -> str:
    """Map browser recording types to Interactions API supported audio MIME types."""
    normalized = normalize_audio_mime_type(mime_type)
    if normalized == "audio/webm":
        return "audio/ogg"
    if normalized == "audio/mp4":
        return "audio/m4a"
    return normalized


def format_voice_note_block(summary: VoiceNoteSummary) -> str:
    timestamp = datetime.now().strftime("%m/%d/%Y, %I:%M:%S %p")
    bullets = "\n".join(f"- {item}" for item in summary.summaryBullets)
    return f"--- Voice note ({timestamp}) ---\n{bullets}"


def append_voice_note_to_mechanic_notes(
    existing_notes: str,
    summary: VoiceNoteSummary,
) -> str:
    block = format_voice_note_block(summary)
    trimmed = existing_notes.strip()
    return f"{trimmed}\n\n{block}" if trimmed else block


def _parse_summary_json(text: str) -> VoiceNoteSummary:
    if not text:
        raise RuntimeError("Empty response from Gemini")
    return VoiceNoteSummary.model_validate(json.loads(text))


def _summarize_with_generate_content(client, audio_bytes: bytes, mime_type: str):
    from google.genai import types
    from google.genai.errors import ClientError

    try:
        return client.models.generate_content(
            model=VOICE_NOTE_MODEL,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=USER_PROMPT),
                        types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                    ],
                )
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_json_schema=VoiceNoteSummary.model_json_schema(),
            ),
        )
    except ClientError as e:
        if e.code == 401:
            raise RuntimeError(
                "Gemini rejected the API key. Create or verify your key at "
                "https://aistudio.google.com/apikey"
            ) from e
        if e.code == 404:
            raise RuntimeError(
                f"Gemini model '{VOICE_NOTE_MODEL}' was not found. "
                "Set VOICE_NOTE_MODEL (e.g. gemini-2.5-flash)."
            ) from e
        raise RuntimeError(f"Gemini API error ({e.code}): {e.message}") from e


def _gemini_status_code(error: Exception) -> int | None:
    return getattr(error, "status_code", None) or getattr(error, "code", None)


def _summarize_with_interactions(client, audio_base64: str, mime_type: str) -> str:
    input_payload = [
        {"type": "text", "text": USER_PROMPT},
        {
            "type": "audio",
            "data": audio_base64,
            "mime_type": interactions_audio_mime_type(mime_type),
        },
    ]
    response_format = {
        "type": "text",
        "mime_type": "application/json",
        "schema": VoiceNoteSummary.model_json_schema(),
    }

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", UserWarning)
            interaction = client.interactions.create(
                model=VOICE_NOTE_MODEL,
                system_instruction=SYSTEM_INSTRUCTION,
                input=input_payload,
                response_format=response_format,
            )
    except Exception as e:
        status_code = _gemini_status_code(e)
        message = getattr(e, "message", str(e))
        if status_code == 401:
            raise RuntimeError(
                "Gemini rejected the authorization key (AQ.). Verify the key at "
                "https://aistudio.google.com/apikey and that the Generative "
                "Language API is enabled for your project."
            ) from e
        if status_code == 404:
            raise RuntimeError(
                f"Gemini model '{VOICE_NOTE_MODEL}' was not found. "
                "Set VOICE_NOTE_MODEL (e.g. gemini-3.5-flash)."
            ) from e
        if status_code is not None:
            raise RuntimeError(f"Gemini API error ({status_code}): {message}") from e
        raise

    if interaction.status != "completed":
        raise RuntimeError(
            f"Gemini interaction failed with status: {interaction.status}"
        )

    return interaction.output_text


def summarize_voice_note(audio_base64: str, mime_type: str) -> VoiceNoteSummary:
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    audio_bytes = base64.b64decode(audio_base64)
    normalized_mime = normalize_audio_mime_type(mime_type)

    from google import genai

    client = genai.Client(api_key=api_key)

    if is_auth_api_key(api_key):
        text = _summarize_with_interactions(client, audio_base64, mime_type)
        return _parse_summary_json(text)

    response = _summarize_with_generate_content(client, audio_bytes, normalized_mime)
    return _parse_summary_json(response.text or "")
