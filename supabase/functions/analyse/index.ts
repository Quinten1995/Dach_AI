import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fotos, kunde, adresse, notiz, preiseText } = await req.json()

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY nicht gesetzt')

    const SYSTEM_PROMPT = `Du bist ein erfahrener Dachdecker-Meister mit 30 Jahren Berufserfahrung und kennst die deutschen Normen, typische Materialien und aktuelle Marktpreise.

Aus Fotos einer Besichtigung und einer kurzen Beschreibung erstellst du ein strukturiertes Baustellenprotokoll mit realistischen Leistungspositionen und Einheitspreisen.

WICHTIGE REGELN:
- Verwende deutsche Fachterminologie (Biberschwanz, Ortgang, First, Traufe, Kehle, etc.)
- Wenn persönliche Preise des Dachdeckers angegeben sind, verwende IMMER diese
- Wenn keine persönlichen Preise vorhanden, orientiere dich an deutschen Marktpreisen (netto):
  * Ziegelwechsel: 12-25 €/Stk
  * Firstziegel: 35-65 €/m
  * Dachrinne Titanzink: 40-75 €/m
  * Ortgangblech: 25-50 €/m
  * Gerüststellung: 600-1200 € pauschal
  * Anfahrt: 60-120 € pauschal
- Antworte NUR als JSON, kein Markdown, keine Erklärungen`

    // Content aufbauen
    const content: any[] = []

    // Fotos hinzufügen
    for (const foto of fotos.slice(0, 5)) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: foto.media_type || 'image/jpeg',
          data: foto.data,
        }
      })
    }

    // Text-Prompt
    content.push({
      type: 'text',
      text: `Analysiere diese Fotos einer Dachbesichtigung und erstelle ein Baustellenprotokoll.

Kunde: ${kunde}
Adresse: ${adresse}
Notiz des Dachdeckers: "${notiz || 'Keine Notiz'}"
${preiseText || ''}

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
    })

    // Claude API aufrufen
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
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

    let protokoll
    try {
      protokoll = JSON.parse(clean)
    } catch {
      throw new Error('KI hat kein valides JSON zurückgegeben')
    }

    return new Response(JSON.stringify({ protokoll }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
