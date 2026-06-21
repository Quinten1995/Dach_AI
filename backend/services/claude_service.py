"""
Claude API Integration — Kern der KI-Logik

Ablauf:
1. Audio transkribieren (falls vorhanden) via Claude
2. Fotos + Transkription an Claude schicken
3. JSON-Protokoll + Angebotspositionen zurückbekommen
"""

import anthropic
import base64
import json
from typing import Optional
from pathlib import Path

from utils.config import settings
from services.prompts import SYSTEM_PROMPT, build_user_prompt, TRANSCRIPTION_PROMPT


client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
MODEL = "claude-sonnet-4-6"


def encode_image(image_bytes: bytes, media_type: str = "image/jpeg") -> dict:
    """Bild als base64 für Claude API enkodieren."""
    return {
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": media_type,
            "data": base64.standard_b64encode(image_bytes).decode("utf-8"),
        },
    }


async def transcribe_audio(audio_bytes: bytes) -> str:
    """
    Sprachnotiz transkribieren.
    
    Hinweis: Claude unterstützt Audio noch nicht direkt.
    In Produktion: Whisper API (OpenAI) oder AWS Transcribe.
    Für MVP: Wir schicken eine Platzhalter-Transkription.
    TODO: Whisper API integrieren
    """
    # Placeholder für MVP — in Woche 2 mit Whisper ersetzen
    # from openai import OpenAI
    # whisper_client = OpenAI()
    # transcript = whisper_client.audio.transcriptions.create(
    #     model="whisper-1", file=("audio.webm", audio_bytes, "audio/webm")
    # )
    # return transcript.text
    
    # Für Tests: Leere Transkription zurückgeben
    return "[Sprachnotiz wird in der nächsten Version automatisch transkribiert]"


async def analyse_baustelle(
    fotos: list[bytes],
    foto_media_types: list[str],
    sprachnotiz_bytes: Optional[bytes],
    kunde: str,
    adresse: str,
) -> dict:
    """
    Hauptfunktion: Fotos + Sprachnotiz → strukturiertes Protokoll + Angebot.
    
    Returns:
        dict mit 'zusammenfassung', 'positionen', 'risikohinweise', etc.
    """
    
    # 1. Audio transkribieren
    sprachnotiz_text = ""
    if sprachnotiz_bytes:
        sprachnotiz_text = await transcribe_audio(sprachnotiz_bytes)
    
    # 2. Content-Liste aufbauen: Fotos + Text-Prompt
    content = []
    
    # Fotos hinzufügen (max. 5)
    for i, (foto_bytes, media_type) in enumerate(zip(fotos[:5], foto_media_types[:5])):
        content.append({
            "type": "text",
            "text": f"Foto {i+1} von {len(fotos)}:"
        })
        content.append(encode_image(foto_bytes, media_type))
    
    # Text-Prompt
    content.append({
        "type": "text",
        "text": build_user_prompt(kunde, adresse, sprachnotiz_text)
    })
    
    # 3. Claude API aufrufen
    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": content}
        ],
    )
    
    # 4. JSON parsen
    raw_text = response.content[0].text.strip()
    
    # JSON aus möglichem Markdown-Block extrahieren
    if raw_text.startswith("```"):
        lines = raw_text.split("\n")
        raw_text = "\n".join(lines[1:-1])
    
    try:
        protokoll = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Claude hat kein valides JSON zurückgegeben: {e}\n\nRaw: {raw_text[:500]}")
    
    return protokoll
