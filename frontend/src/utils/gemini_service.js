/**
 * Gemini API Service — temporärer Ersatz für Claude API
 * Wird ersetzt sobald Anthropic API Key da ist
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

const SYSTEM_PROMPT = `Du bist ein erfahrener Dachdecker-Meister mit 30 Jahren Berufserfahrung.
Aus Fotos einer Besichtigung und einer kurzen Beschreibung erstellst du ein strukturiertes Baustellenprotokoll.

WICHTIGE REGELN:
- Verwende deutsche Fachterminologie (Biberschwanz, Ortgang, First, Traufe, etc.)
- Einheitspreise orientieren sich an aktuellen deutschen Marktpreisen (netto, ohne MwSt.)
- Typische Einheitspreise:
  * Ziegelwechsel: 12-25 €/Stk
  * Firstziegel: 35-65 €/m
  * Dachrinne Titanzink: 40-75 €/m
  * Ortgangblech: 25-50 €/m
  * Gerüststellung: 600-1200 € pauschal
  * Anfahrt: 60-120 € pauschal
- Antworte NUR als JSON, kein Markdown, keine Erklärungen`

function buildPrompt(kunde, adresse, notiz) {
  return `Analysiere diese Fotos und erstelle ein Baustellenprotokoll.

Kunde: ${kunde}
Adresse: ${adresse}
Notiz: "${notiz || 'Keine Notiz'}"

Antworte NUR mit diesem JSON (keine Backticks, kein Markdown):
{
  "zusammenfassung": "2-3 Sätze Gesamteinschätzung",
  "dachtyp": "z.B. Satteldach",
  "risikohinweise": ["Hinweis 1"],
  "positionen": [
    {
      "kategorie": "Ziegel & Deckung",
      "pos": [
        {
          "nr": "1.1",
          "bezeichnung": "Beschreibung der Leistung",
          "einheit": "m² oder m oder Stk oder pauschal",
          "menge": 0,
          "ep": 0,
          "begruendung": "Warum diese Position"
        }
      ]
    }
  ]
}`
}

async function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function analysiereBestellung(fotos, kunde, adresse, notiz) {
  // Bilder vorbereiten
  const bildParts = []
  for (const foto of fotos.slice(0, 5)) {
    const base64 = await imageToBase64(foto.file)
    bildParts.push({
      inlineData: {
        mimeType: foto.file.type || 'image/jpeg',
        data: base64
      }
    })
    bildParts.push({
      text: `Foto ${bildParts.length / 2 + 0.5} von ${Math.min(fotos.length, 5)}`
    })
  }

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{
        parts: [
          ...bildParts,
          { text: buildPrompt(kunde, adresse, notiz) }
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
      }
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'Gemini API Fehler')
  }

  const data = await response.json()
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // JSON extrahieren
  const clean = rawText.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    throw new Error('KI hat kein valides JSON zurückgegeben')
  }
}
