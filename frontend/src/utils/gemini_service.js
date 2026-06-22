/**
 * OpenRouter API Service — temporärer Ersatz für Claude API
 * Wird ersetzt sobald Anthropic API Key da ist
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

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
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function analysiereBestellung(fotos, kunde, adresse, notiz) {
  const content = []

  // Fotos als base64 hinzufügen
  for (const foto of fotos.slice(0, 5)) {
    const base64 = await imageToBase64(foto.file)
    content.push({
      type: 'image_url',
      image_url: { url: base64 }
    })
  }

  // Text-Prompt
  content.push({
    type: 'text',
    text: buildPrompt(kunde, adresse, notiz)
  })

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://dach-ai.vercel.app',
      'X-Title': 'DachProfi AI',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.2-11b-vision-instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content }
      ],
      temperature: 0.2,
      max_tokens: 4096,
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'OpenRouter API Fehler')
  }

  const data = await response.json()
  const rawText = data.choices?.[0]?.message?.content || ''

  const clean = rawText.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    throw new Error('KI hat kein valides JSON zurückgegeben')
  }
}
