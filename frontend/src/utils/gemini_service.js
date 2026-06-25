/**
 * Claude API Service — via Supabase Edge Function
 * Läuft serverseitig, kein CORS Problem
 */

import { supabase } from './supabase'

export async function analysiereBestellung(fotos, kunde, adresse, notiz, preiseText = '') {
  // Fotos zu base64 konvertieren
  const fotosBase64 = await Promise.all(
    fotos.slice(0, 5).map(async (foto) => {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(foto.file)
      })
      return {
        data: base64,
        media_type: foto.file.type || 'image/jpeg'
      }
    })
  )

  // Edge Function aufrufen
  const { data, error } = await supabase.functions.invoke('analyse', {
    body: {
      fotos: fotosBase64,
      kunde,
      adresse,
      notiz,
      preiseText,
    }
  })

  if (error) throw new Error(error.message)
  if (data.error) throw new Error(data.error)

  return data.protokoll
}
