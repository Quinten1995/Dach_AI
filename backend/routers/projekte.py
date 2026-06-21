"""
GET  /api/projekte        – Alle Projekte des eingeloggten Nutzers
GET  /api/projekte/{id}   – Ein Projekt
PUT  /api/projekte/{id}   – Positionen aktualisieren (nach Bearbeitung)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class Position(BaseModel):
    id: int
    bezeichnung: str
    einheit: str
    menge: float
    ep: float


class ProjektUpdate(BaseModel):
    positionen: List[Position]
    anmerkung: Optional[str] = ""


@router.get("/projekte")
async def get_projekte():
    """Projekte des Users — TODO: Supabase Query mit Auth"""
    # Placeholder bis Supabase angebunden
    return {"projekte": [], "total": 0}


@router.get("/projekte/{projekt_id}")
async def get_projekt(projekt_id: str):
    """Einzelnes Projekt — TODO: Supabase Query"""
    raise HTTPException(status_code=404, detail="Noch nicht implementiert")


@router.put("/projekte/{projekt_id}")
async def update_projekt(projekt_id: str, update: ProjektUpdate):
    """Positionen nach Bearbeitung speichern — TODO: Supabase Update"""
    return {"status": "ok", "projekt_id": projekt_id}
