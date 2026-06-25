/**
 * Claude API Service
 */

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `Du bist ein erfahrener Dachdecker-Meister mit 30 Jahren Berufserfahrung und kennst die deutschen Normen, typische Materialien und aktuelle Marktpreise.

Aus Fotos einer Besichtigung und einer kurzen Beschreibung erstellst du ein strukturiertes Baustellenprotokoll mit realistischen Leistungspositionen und Einheitspreisen.

WICHTIGE REGELN:
- Verwende deutsche Fachterminologie (Biberschwanz, Ortgang, First, Traufe, Kehle, etc.)
- Wenn persönliche Preise des Dachdeckers angegeben sind, verwende IMMER diese — nie die Marktpreise
- Wenn keine persönlichen Preise vorhanden, orientiere dich an deutschen Marktpreisen (netto):
  * Ziegelwechsel: 12-25 €/Stk
  * Firstziegel: 35-65 €/m
  * Dachrinne Titanzink: 40-75 €/m
  * Ortgangblech: 25-50 €/m
  * Gerüststellung: 600-1200 € pauschal
  * Anfahrt: 60-120 € pauschal
- Antworte NUR als JSON, kein Markdown, keine Erklärungen`

function buildPrompt(kunde, adresse, notiz, preiseText) {
  return `Analysiere diese Fotos einer Dachbesichtigung und erstelle ein Baustellenprotokoll.

Kunde: ${kunde}
Adresse: ${adresse}
Notiz des Dachdeckers: "${notiz || 'Keine Notiz'}"
${preiseText}

Antworte NUR mit diesem JSON (keine Backticks, kein Markdown):
{
  "zusammenfassung": "2-3 Sätze Gesamteinschätzung der Baustelle",
  "dachtyp": "z.B. Satteldach, Walmdach, Flachdach",
  "dachflaeche_schaetzung": "ca. X m²",
  "risikohinweise": ["Hinweis der vor Auftragserteilung zu klären ist"],
  "positionen": [
    {
      "kategorie": "Ziegel & Deckung",
      "pos": [
        {
          "nr": "1.1",
          "bezeichnung": "Vollständige Leistungsbeschreibung",
          "einheit": "m² oder m oder Stk oder pauschal",
          "menge": 0,
          "ep": 0,
          "begruendung": "Kurze Erklärung warum diese Position"
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

export async function analysiereBestellung(fotos, kunde, adresse, notiz, preiseText = '') {
  const content = []

  for (const foto of fotos.slice(0, 5)) {
    const base64 = await imageToBase64(foto.file)
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: foto.file.type || 'image/jpeg', data: base64 }
    })
  }

  content.push({ type: 'text', text: buildPrompt(kunde, adresse, notiz, preiseText) })

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'Claude API Fehler')
  }

  const data = await response.json()
  const rawText = data.content?.[0]?.text || ''
  const clean = rawText.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    throw new Error('KI hat kein valides JSON zurückgegeben')
  }
}
