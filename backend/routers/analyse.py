"""
POST /api/analyse
Nimmt Fotos + Sprachnotiz, schickt sie an Claude, speichert Protokoll in Supabase.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, List
import uuid

from services.claude_service import analyse_baustelle

router = APIRouter()


@router.post("/analyse")
async def analyse_besichtigung(
    kunde: str = Form(...),
    adresse: str = Form(...),
    audio: Optional[UploadFile] = File(None),
    foto_0: Optional[UploadFile] = File(None),
    foto_1: Optional[UploadFile] = File(None),
    foto_2: Optional[UploadFile] = File(None),
    foto_3: Optional[UploadFile] = File(None),
    foto_4: Optional[UploadFile] = File(None),
):
    """
    Hauptendpunkt: Besichtigungsdaten → KI-Protokoll → Projekt-ID
    """
    
    # Fotos sammeln
    foto_files = [f for f in [foto_0, foto_1, foto_2, foto_3, foto_4] if f is not None]
    
    if not foto_files:
        raise HTTPException(status_code=400, detail="Mindestens ein Foto erforderlich")
    
    # Bilder lesen
    fotos_bytes = []
    foto_media_types = []
    for foto in foto_files:
        content = await foto.read()
        fotos_bytes.append(content)
        foto_media_types.append(foto.content_type or "image/jpeg")
    
    # Audio lesen (optional)
    audio_bytes = None
    if audio:
        audio_bytes = await audio.read()
    
    # Claude Analyse
    try:
        protokoll = await analyse_baustelle(
            fotos=fotos_bytes,
            foto_media_types=foto_media_types,
            sprachnotiz_bytes=audio_bytes,
            kunde=kunde,
            adresse=adresse,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysefehler: {str(e)}")
    
    # TODO: In Supabase speichern (Woche 1)
    # projekt_id = await save_to_supabase(protokoll, kunde, adresse, user_id)
    projekt_id = str(uuid.uuid4())  # Placeholder
    
    return {
        "projekt_id": projekt_id,
        "protokoll": protokoll,
    }
