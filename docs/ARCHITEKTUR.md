# DachProfi AI — Architektur

## Datenfluss (der wichtigste Teil)

```
Dachdecker auf Baustelle
         │
         │ 5 Fotos + 60s Sprachnotiz
         ▼
┌─────────────────────┐
│   PWA (Mobile)      │  React + Vite + Tailwind
│   NewProjectPage    │  • Foto-Upload (Camera API)
│                     │  • MediaRecorder API (Audio)
└─────────┬───────────┘
          │ FormData: fotos + audio
          │ POST /api/analyse
          ▼
┌─────────────────────┐
│   FastAPI Backend   │  Python auf Railway (EU)
│   /routers/analyse  │
│                     │
│  1. Audio → Whisper │  → Transkription (TODO: Woche 2)
│  2. Fotos + Text    │
│     → Claude API    │  → claude-sonnet-4-6
│  3. JSON parsen     │
│  4. In Supabase     │  → Protokoll + Positionen
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Supabase          │  PostgreSQL + Auth (EU-Region)
│   • projekte        │
│   • positionen      │  Row Level Security: jeder sieht nur seine Daten
│   • fotos           │
└─────────────────────┘
          │
          │ Protokoll zurück ans Frontend
          ▼
┌─────────────────────┐
│   ProjectDetailPage │  Protokoll + Positionen anzeigen
│   OfferPage         │  Positionen bearbeiten (Mengen, Preise)
│                     │
│   PDF-Export        │  POST /api/projekt/{id}/pdf
│   WeasyPrint        │  → professionelles Angebots-PDF
└─────────────────────┘
          │
          │ Dachdecker prüft, passt an, schickt selbst ab
          ▼
         Kunde  (KI schickt NIE selbst etwas)
```

## Hosting (DSGVO-konform, EU-Server)

```
Frontend    → Vercel (Region: Frankfurt / fra1)
Backend     → Railway (Region: EU West)
Datenbank   → Supabase (Region: eu-central-1 Frankfurt)
```

## Wichtigste Design-Entscheidungen

### Warum Magic Link statt Passwort?
Solo-Dachdecker hat kein Zeit für Passwort-Management. Magic Link: E-Mail tippen, 
Link klicken, fertig. Kein Passwort vergessen.

### Warum kein automatischer Versand?
Kern-Differenzierungsmerkmal. KI als Assistent, nicht als Ersatz.
Dachdecker hat immer die Kontrolle. Vertrauen ist wichtiger als Automatisierung.

### Warum WeasyPrint statt einem PDF-Service?
Kein Drittanbieter-Abhängigkeit, kein zusätzlicher Kosten, DSGVO-sicher.
HTML → PDF funktioniert für unser einfaches Layout gut genug.

### Warum separate positionen-Tabelle statt JSON im Protokoll?
Editierbarkeit. Der Dachdecker ändert Mengen und Preise — das muss sauber 
versionierbar und abfragbar sein.

## Audio-Transkription (Woche 2)

Claude unterstützt noch kein Audio direkt. Optionen:
1. **OpenAI Whisper API** — einfachste Integration, günstig (~$0.006/min)
2. **AWS Transcribe** — EU-Region verfügbar, DSGVO-sicher
3. **Whisper self-hosted** — kostenlos, aber Infrastruktur-Overhead

Empfehlung für MVP: OpenAI Whisper API (schnell integriert, DSGVO mit Data Processing Agreement)

## Kosten-Schätzung pro Besichtigung

| Service         | Kosten      | Annahme                    |
|----------------|-------------|----------------------------|
| Claude API     | ~$0.15      | 5 Fotos (hoch auflösend) + Protokoll |
| Whisper API    | ~$0.01      | 60s Audio                  |
| Supabase       | ~$0.00      | Im Free Tier               |
| WeasyPrint     | $0.00       | Self-hosted                |
| **Gesamt**     | **~$0.16**  | Pro Besichtigung           |

Bei €79/Monat und angenommenen 20 Besichtigungen/Monat: ~$3.20 COGS = 96% Marge ✓

## Nächste Schritte (in Reihenfolge)

1. **Vor Code**: 3 echte Fälle manuell mit Claude testen
2. **Woche 1**: Supabase Projekt anlegen, .env befüllen, Frontend starten
3. **Woche 2**: Claude API Integration + Whisper
4. **Woche 3**: Echte Fotos testen, Prompt verfeinern
5. **Woche 4-5**: PDF-Export
6. **Woche 6-8**: Pilot mit 3 Dachdeckern
