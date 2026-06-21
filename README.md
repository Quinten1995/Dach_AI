# DachProfi AI

> 5 Fotos + 60s Sprachnotiz → Baustellenprotokoll + Angebotsentwurf als PDF

**Für Solo-Dachdecker. Fertig in 5 Minuten nach der Besichtigung.**

---

## Schnellstart

### 1. Voraussetzungen
- Node.js 18+
- Python 3.11+
- [Supabase Account](https://supabase.com) (kostenlos)
- [Anthropic API Key](https://console.anthropic.com)

### 2. Frontend
```bash
cd frontend
cp .env.example .env          # Supabase Keys eintragen
npm install
npm run dev                   # → http://localhost:3000
```

### 3. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # API Keys eintragen
uvicorn main:app --reload     # → http://localhost:8000
```

### 4. Datenbank
```sql
-- In Supabase Dashboard → SQL Editor:
-- Inhalt von docs/supabase_schema.sql ausführen
```

---

## Projektstruktur

```
dachdecker-ai/
├── frontend/                 # React PWA (Mobile-first)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx         # Magic Link Auth
│   │   │   ├── DashboardPage.jsx     # Projektübersicht
│   │   │   ├── NewProjectPage.jsx    # Foto + Sprachnotiz
│   │   │   ├── ProjectDetailPage.jsx # Protokoll + Positionen
│   │   │   └── OfferPage.jsx         # Angebot bearbeiten
│   │   ├── components/
│   │   │   └── layout/AppShell.jsx   # Bottom Navigation
│   │   ├── hooks/useAuth.js          # Supabase Auth
│   │   └── utils/supabase.js         # Supabase Client
│   ├── tailwind.config.js
│   └── vite.config.js                # PWA Plugin
│
├── backend/                  # FastAPI
│   ├── main.py               # App Entry Point + CORS
│   ├── routers/
│   │   ├── analyse.py        # POST /api/analyse (Kernlogik)
│   │   ├── projekte.py       # GET/PUT /api/projekte
│   │   └── pdf_export.py     # POST /api/projekt/{id}/pdf
│   ├── services/
│   │   ├── claude_service.py # Claude API Integration ⭐
│   │   └── prompts.py        # System Prompt + User Prompt ⭐
│   └── utils/config.py       # Pydantic Settings
│
└── docs/
    ├── ARCHITEKTUR.md        # Datenfluss, Kosten, Entscheidungen
    ├── MANUELLE_TESTS.md     # Test-Protokoll vor Woche 1
    └── supabase_schema.sql   # DB Schema + RLS Policies
```

## Die wichtigsten Dateien

| Datei | Warum wichtig |
|-------|---------------|
| `backend/services/prompts.py` | Das Gehirn — hier entscheidet sich ob die KI gute Protokolle macht |
| `backend/services/claude_service.py` | Claude API Integration mit Foto-Encoding |
| `frontend/src/pages/NewProjectPage.jsx` | Die UX die über Adoption entscheidet |
| `docs/MANUELLE_TESTS.md` | Tests VOR dem Coden |

## Was wir bewusst nicht bauen

- ❌ Automatischer Versand an Kunden
- ❌ Rechnungserstellung / Mahnwesen  
- ❌ DATEV/Lexware Export
- ❌ CRM / Kalender
- ❌ WhatsApp Integration

**Erst wenn echte Kunden dafür zahlen und explizit danach fragen.**

## Roadmap

| Wann | Was |
|------|-----|
| Jetzt | 3 echte Fälle manuell testen (kein Code!) |
| Woche 1 | PWA Grundstruktur, Login, Foto-Upload |
| Woche 2-3 | Claude API Integration |
| Woche 4-5 | PDF-Export |
| Woche 6-8 | Pilot mit 3 Dachdeckern für €49-79/Mo |
