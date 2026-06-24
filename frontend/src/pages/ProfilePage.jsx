import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Save } from 'lucide-react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../hooks/useAuth'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profil, setProfil] = useState({
    firmenname: '',
    inhaber: '',
    strasse: '',
    plz: '',
    ort: '',
    telefon: '',
    email: '',
    website: '',
    steuernummer: '',
  })

  useEffect(() => {
    async function ladeProfil() {
      const { data } = await supabase
        .from('profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setProfil({
          firmenname: data.firmenname || '',
          inhaber: data.inhaber || '',
          strasse: data.strasse || '',
          plz: data.plz || '',
          ort: data.ort || '',
          telefon: data.telefon || '',
          email: data.email || '',
          website: data.website || '',
          steuernummer: data.steuernummer || '',
        })
      }
      setLoading(false)
    }
    ladeProfil()
  }, [user])

  const update = (field, value) => {
    setProfil((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const speichern = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profile')
      .upsert({ user_id: user.id, ...profil, updated_at: new Date().toISOString() })

    if (!error) setSaved(true)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-brand-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="bg-white border-b border-zinc-100 px-4 py-4 pt-safe flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-zinc-500">
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-zinc-900">Mein Profil</h1>
          <p className="text-xs text-zinc-500">Erscheint auf jedem Angebot</p>
        </div>
        {saved && <span className="text-xs text-green-600 font-medium">Gespeichert ✓</span>}
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4 pb-32">

        <div className="card space-y-4">
          <h2 className="font-semibold text-zinc-900">Firma</h2>
          <div>
            <label className="label">Firmenname</label>
            <input type="text" value={profil.firmenname} onChange={(e) => update('firmenname', e.target.value)}
              placeholder="z.B. Dachdeckerei Müller" className="input" />
          </div>
          <div>
            <label className="label">Inhaber</label>
            <input type="text" value={profil.inhaber} onChange={(e) => update('inhaber', e.target.value)}
              placeholder="z.B. Hans Müller" className="input" />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-zinc-900">Adresse</h2>
          <div>
            <label className="label">Straße + Hausnummer</label>
            <input type="text" value={profil.strasse} onChange={(e) => update('strasse', e.target.value)}
              placeholder="z.B. Hauptstraße 12" className="input" />
          </div>
          <div className="flex gap-3">
            <div className="w-28">
              <label className="label">PLZ</label>
              <input type="text" value={profil.plz} onChange={(e) => update('plz', e.target.value)}
                placeholder="80331" className="input" />
            </div>
            <div className="flex-1">
              <label className="label">Ort</label>
              <input type="text" value={profil.ort} onChange={(e) => update('ort', e.target.value)}
                placeholder="München" className="input" />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-zinc-900">Kontakt</h2>
          <div>
            <label className="label">Telefon</label>
            <input type="tel" value={profil.telefon} onChange={(e) => update('telefon', e.target.value)}
              placeholder="z.B. 089 123456" className="input" />
          </div>
          <div>
            <label className="label">E-Mail</label>
            <input type="email" value={profil.email} onChange={(e) => update('email', e.target.value)}
              placeholder="info@dachdeckerei-mueller.de" className="input" />
          </div>
          <div>
            <label className="label">Website (optional)</label>
            <input type="text" value={profil.website} onChange={(e) => update('website', e.target.value)}
              placeholder="www.dachdeckerei-mueller.de" className="input" />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-zinc-900">Steuer</h2>
          <div>
            <label className="label">Steuernummer</label>
            <input type="text" value={profil.steuernummer} onChange={(e) => update('steuernummer', e.target.value)}
              placeholder="z.B. 123/456/78901" className="input" />
          </div>
        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 pb-safe px-4 py-3">
        <button onClick={speichern} disabled={saving} className="btn-primary flex items-center justify-center gap-2">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Wird gespeichert…' : 'Profil speichern'}
        </button>
      </div>
    </div>
  )
}
