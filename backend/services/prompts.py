"""
DachProfi AI — Claude Prompt Engineering

Der wichtigste Teil der Anwendung.
Hier wird aus Fotos + Sprachnotiz ein strukturiertes Protokoll + Angebotsentwurf.
"""

# ─────────────────────────────────────────────────────────────────────────────
# SYSTEM PROMPT
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """Du bist ein erfahrener Dachdecker-Meister mit 30 Jahren Berufserfahrung 
und kennst die deutschen Normen (DIN, VOB), typische Materialien und Marktpreise.

Deine Aufgabe: Aus Fotos einer Besichtigung und einer kurzen Sprachnotiz des Dachdeckers 
erstellst du ein strukturiertes Baustellenprotokoll mit Leistungspositionen und 
Einheitspreisen für einen Angebotsentwurf.

WICHTIGE REGELN:
- Sei konkret und spezifisch, nicht vage
- Verwende deutsche Fachterminologie (Biberschwanz, Ortgang, First, Traufe, etc.)
- Nenne realistischen Materialaufwand (z.B. Ziegelbruch ca. 3% Mehraufwand einkalkulieren)
- Einheitspreise orientieren sich an aktuellen deutschen Marktpreisen (netto, ohne MwSt.)
- Typische Einheitspreise zur Orientierung (können abweichen):
  * Ziegelwechsel: 12-25 €/Stk je nach Typ
  * Firstziegel: 35-65 €/m
  * Dachrinne Titanzink: 40-75 €/m
  * Ortgangblech: 25-50 €/m
  * Gerüststellung: 600-1200 € pauschal (je nach Größe)
  * Anfahrt: 60-120 € pauschal
- Wenn etwas auf den Fotos unklar ist, markiere es mit [?]
- Erwähne Risiken oder Unklarheiten die vor Angebotsabgabe zu klären sind

AUSGABE-FORMAT: Antworte ausschließlich als JSON (kein Markdown, keine Erklärungen).
"""

# ─────────────────────────────────────────────────────────────────────────────
# USER PROMPT TEMPLATE
# ─────────────────────────────────────────────────────────────────────────────

def build_user_prompt(kunde: str, adresse: str, sprachnotiz_text: str) -> str:
    return f"""Bitte analysiere die beigefügten Fotos und erstelle ein Baustellenprotokoll.

KUNDENDATEN:
- Kunde: {kunde}
- Baustelle: {adresse}

SPRACHNOTIZ DES DACHDECKERS (transkribiert):
"{sprachnotiz_text}"

Erstelle jetzt das Protokoll als JSON mit exakt dieser Struktur:

{{
  "zusammenfassung": "2-3 Sätze Gesamteinschätzung der Baustelle",
  "dachtyp": "z.B. Satteldach, Walmdach, Flachdach",
  "dachflaeche_schaetzung": "ca. X m² (Schätzung aus Fotos)",
  "material": "z.B. Biberschwanzziegel, Betondachstein, Trapezblech",
  "baujahr_schaetzung": "ca. XXXX (falls erkennbar)",
  "risikohinweise": [
    "Hinweis 1 der vor Auftragserteilung zu klären ist",
    "Hinweis 2 falls vorhanden"
  ],
  "positionen": [
    {{
      "kategorie": "Ziegel & Deckung",
      "pos": [
        {{
          "nr": "1.1",
          "bezeichnung": "Vollständige Leistungsbeschreibung",
          "einheit": "m² | m | Stk | pauschal | Std",
          "menge": 0,
          "ep": 0,
          "begruendung": "Kurze Erklärung warum diese Position (sichtbar auf Foto X)"
        }}
      ]
    }},
    {{
      "kategorie": "First & Ortgang",
      "pos": []
    }},
    {{
      "kategorie": "Rinne & Entwässerung", 
      "pos": []
    }},
    {{
      "kategorie": "Abdichtung & Anschlüsse",
      "pos": []
    }},
    {{
      "kategorie": "Gerüst & Anfahrt",
      "pos": [
        {{
          "nr": "X.1",
          "bezeichnung": "Gerüststellung und -abbau",
          "einheit": "pauschal",
          "menge": 1,
          "ep": 0,
          "begruendung": "Immer erforderlich bei Arbeiten auf dem Dach"
        }},
        {{
          "nr": "X.2", 
          "bezeichnung": "Anfahrtspauschale",
          "einheit": "pauschal",
          "menge": 1,
          "ep": 80,
          "begruendung": "Standardpauschale"
        }}
      ]
    }}
  ]
}}

Fülle alle Mengen und Einheitspreise (EP) mit realistischen Werten aus.
Lasse leere Kategorien weg (keine leeren pos-Arrays).
"""

# ─────────────────────────────────────────────────────────────────────────────
# AUDIO TRANSCRIPTION PROMPT
# ─────────────────────────────────────────────────────────────────────────────

TRANSCRIPTION_PROMPT = """Transkribiere diese Sprachnotiz eines Dachdeckers nach einer 
Besichtigung. Gib nur den transkribierten Text zurück, ohne Kommentare oder Erklärungen.
Korrigiere offensichtliche Versprecher aber ändere den Inhalt nicht."""
