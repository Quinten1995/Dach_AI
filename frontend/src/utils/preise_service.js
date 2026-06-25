/**
 * Preise Service — lernt aus Korrekturen des Dachdeckers
 */
import { supabase } from './supabase'

/**
 * Preise aus Supabase laden
 */
export async function ladePreise(userId) {
  const { data } = await supabase
    .from('preise')
    .select('*')
    .eq('user_id', userId)
    .order('anzahl_verwendungen', { ascending: false })
  return data || []
}

/**
 * Preis speichern/updaten wenn Dachdecker etwas ändert
 */
export async function speicherePreis(userId, bezeichnung, einheit, preis) {
  await supabase
    .from('preise')
    .upsert({
      user_id: userId,
      bezeichnung: bezeichnung.trim(),
      einheit,
      mein_preis: preis,
      anzahl_verwendungen: 1,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,bezeichnung,einheit',
      ignoreDuplicates: false,
    })

  // Verwendungsanzahl erhöhen
  await supabase.rpc('increment_verwendungen', {
    p_user_id: userId,
    p_bezeichnung: bezeichnung.trim(),
    p_einheit: einheit,
  }).catch(() => {}) // Falls RPC nicht existiert, ignorieren
}

/**
 * Preise als Prompt-Text formatieren
 */
export function preiseAlsPromptText(preise) {
  if (!preise || preise.length === 0) return ''

  const top = preise.slice(0, 15) // Max 15 Positionen
  return `
PERSÖNLICHE PREISE DIESES DACHDECKERS (immer diese Preise verwenden!):
${top.map(p => `- ${p.bezeichnung} (${p.einheit}): ${p.mein_preis}€`).join('\n')}

Verwende exakt diese Preise wenn die Position vorkommt.`
}
