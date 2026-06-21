# Manuelle Tests — Vor dem ersten Code

**Ziel**: Bevor eine Zeile Code geschrieben wird, prüfen ob Claude 
aus echten Dachdecker-Fotos + Notizen brauchbare Protokolle macht.

---

## Testfall-Vorlage

Für jeden der 3 Fälle vom Freund:

### Vorbereitung
- [ ] 3-5 Fotos des damaligen Dachs
- [ ] Handschriftliche Notizen oder das alte Angebot
- [ ] 60 Sekunden Sprachnotiz diktieren (oder schriftlich rekonstruieren)

### Claude Prompt (direkt in claude.ai testen)

```
[Fotos hochladen]

Du bist ein erfahrener Dachdecker-Meister. 
Analysiere diese Fotos einer Besichtigung.

Kundenname: [NAME]
Adresse: [ADRESSE]
Sprachnotiz des Dachdeckers: "[NOTIZ]"

Erstelle ein strukturiertes Baustellenprotokoll mit:
1. Kurze Zusammenfassung (2-3 Sätze)
2. Leistungspositionen mit Mengen und Einheitspreisen
   Kategorien: Ziegel/Deckung, First/Ortgang, Rinne/Entwässerung, 
   Abdichtung, Gerüst/Anfahrt
3. Risikohinweise

Antworte als JSON.
```

### Bewertungskriterien

**Protokoll-Qualität (1-5):**
- [ ] Erkennt der Dachtyp korrekt?
- [ ] Stimmen die Leistungspositionen?
- [ ] Sind die Mengen realistisch?
- [ ] Sind die Einheitspreise marktgerecht?
- [ ] Fehlt etwas Wichtiges?

**Vergleich mit echtem Angebot:**
| Position | Claude | Echt | Abweichung |
|---------|--------|------|------------|
| Gesamtbetrag | X € | X € | X% |
| Wichtigste Pos. | ✓/✗ | — | — |

### Erkenntnisse
- Was macht Claude gut?
- Was fehlt / ist falsch?
- Welche Prompt-Anpassungen brauchen wir?

---

## Entscheidungskriterium

**Go / No-Go für Woche 1:**

✅ GO wenn:
- Bei 2 von 3 Fällen sind >80% der Positionen korrekt erkannt
- Gesamtbetrag weicht <20% vom echten Angebot ab
- Der Dachdecker sagt "Das würde mir Zeit sparen"

❌ STOP wenn:
- Claude erkennt grundlegende Dachtypen nicht
- Preise sind systematisch falsch (>50% Abweichung)
- Prompt-Anpassungen helfen nicht nach 5 Iterationen

---

## Test-Log

### Fall 1: [Datum] — [Kurzbeschreibung]
**Ergebnis**: 
**Feedback Dachdecker**: 
**Prompt-Änderungen**: 

### Fall 2: [Datum] — [Kurzbeschreibung]
**Ergebnis**: 
**Feedback Dachdecker**: 
**Prompt-Änderungen**: 

### Fall 3: [Datum] — [Kurzbeschreibung]
**Ergebnis**: 
**Feedback Dachdecker**: 
**Prompt-Änderungen**: 

---

## Finaler Prompt (nach Tests)

*Hier den verfeinerten Prompt einfügen, der dann in services/prompts.py kommt*
