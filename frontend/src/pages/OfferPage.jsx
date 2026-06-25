import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2, Download, Loader2, FileText } from 'lucide-react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../hooks/useAuth'
import { speicherePreis } from '../utils/preise_service'
import { exportPDF } from '../utils/pdf_export'

export default function OfferPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projekt, setProjekt] = useState(null)
  const [positionen, setPositionen] = useState([])
  const [anmerkung, setAnmerkung] = useState('')
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function ladeAlles() {
      const [{ data: projektData }, { data: profilData }] = await Promise.all([
        supabase.from('projekte').select('*').eq('id', id).single(),
        supabase.from('profile').select('*').eq('user_id', user.id).single(),
      ])

      if (projektData) {
        setProjekt(projektData)
        const pos = projektData.protokoll?.positionen
          ?.flatMap((k, ki) =>
            (k.pos || []).map((p, pi) => ({
              id: `${ki}-${pi}`,
              bezeichnung: p.bezeichnung || '',
              einheit: p.einheit || 'm²',
              menge: p.menge || 0,
              ep: p.ep || 0,
            }))
          ) || []
        setPositionen(pos)
      }

      if (profilData) setProfil(profilData)
      setLoading(false)
    }
    ladeAlles()
  }, [id, user])

  const update = (posId, field, value) => {
    setPositionen((prev) => prev.map((p) => p.id === posId ? { ...p, [field]: value } : p))
    setSaved(false)
  }

  const remove = (posId) => {
    setPositionen((prev) => prev.filter((p) => p.id !== posId))
    setSaved(false)
  }

  const addPosition = () => {
    const newId = `new-${Date.now()}`
    setPositionen((prev) => [...prev, { id: newId, bezeichnung: '', einheit: 'm²', menge: 1, ep: 0 }])
    setSaved(false)
  }

  const speichern = async () => {
    setSaving(true)
    const updatedProtokoll = {
      ...(projekt.protokoll || {}),
      positionen: [{
        kategorie: 'Leistungen',
        pos: positionen.map((p, i) => ({
          nr: `${i + 1}`,
          bezeichnung: p.bezeichnung,
          einheit: p.einheit,
          menge: parseFloat(p.menge),
          ep: parseFloat(p.ep),
        }))
      }]
    }
    const { error } = await supabase
      .from('projekte')
      .update({ protokoll: updatedProtokoll, status: 'bearbeitet' })
      .eq('id', id)

    if (!error) {
      setSaved(true)
      // Preise lernen — jede Position mit Preis speichern
      try {
        for (const pos of positionen) {
          if (pos.bezeichnung && parseFloat(pos.ep) > 0) {
            await speicherePreis(user.id, pos.bezeichnung, pos.einheit, parseFloat(pos.ep))
          }
        }
      } catch (e) {
        console.error('Preise speichern fehlgeschlagen:', e)
      }
    }
    setSaving(false)
  }

  const handlePDF = () => {
    if (!profil?.firmenname) {
      if (confirm('Kein Firmenprofil hinterlegt. Trotzdem PDF erstellen?')) {
        exportPDF(projekt, positionen, profil, anmerkung)
      }
    } else {
      exportPDF(projekt, positionen, profil, anmerkung)
    }
  }

  const netto = positionen.reduce((sum, p) => sum + (parseFloat(p.menge) * parseFloat(p.ep) || 0), 0)
  const mwst = netto * 0.19
  const brutto = netto + mwst

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-brand-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="bg-white border-b border-zinc-100 px-4 py-4 pt-safe">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/projekt/${id}`)} className="p-2 -ml-2 text-zinc-500">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-zinc-900">Angebot bearbeiten</h1>
            {projekt && <p className="text-xs text-zinc-500">{projekt.kunde}</p>}
          </div>
          {saved && <span className="text-xs text-green-600 font-medium">Gespeichert ✓</span>}
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4 pb-52">

        {!profil?.firmenname && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center justify-between">
            <p className="text-xs text-amber-700">⚠️ Kein Firmenprofil — PDF ohne Firmendaten</p>
            <button onClick={() => navigate('/profil')} className="text-xs text-amber-700 font-semibold underline">
              Jetzt ausfüllen
            </button>
          </div>
        )}

        {positionen.length === 0 && (
          <div className="card border-2 border-amber-100 bg-amber-50">
            <p className="text-sm text-amber-700 font-medium mb-1">⏳ Noch keine KI-Positionen</p>
            <p className="text-xs text-amber-600">Nach der KI-Analyse werden hier Positionen vorgeschlagen. Du kannst auch manuell hinzufügen.</p>
          </div>
        )}

        {positionen.length > 0 && <h2 className="font-semibold text-zinc-900">Leistungspositionen</h2>}

        <div className="space-y-2">
          {positionen.map((pos) => (
            <div key={pos.id} className="card space-y-2">
              <div className="flex gap-2">
                <input type="text" value={pos.bezeichnung} onChange={(e) => update(pos.id, 'bezeichnung', e.target.value)}
                  placeholder="Bezeichnung" className="input flex-1 text-sm py-2" />
                <button onClick={() => remove(pos.id)} className="p-2 text-zinc-400 active:text-red-500 flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 mb-1 block">Menge</label>
                  <input type="number" value={pos.menge} onChange={(e) => update(pos.id, 'menge', e.target.value)}
                    className="input text-sm py-2" min="0" />
                </div>
                <div className="w-24">
                  <label className="text-xs text-zinc-500 mb-1 block">Einheit</label>
                  <select value={pos.einheit} onChange={(e) => update(pos.id, 'einheit', e.target.value)} className="input text-sm py-2">
                    {['m²', 'm', 'Stk', 'pauschal', 'Std', 'kg'].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <label className="text-xs text-zinc-500 mb-1 block">EP (€)</label>
                  <input type="number" value={pos.ep} onChange={(e) => update(pos.id, 'ep', e.target.value)}
                    className="input text-sm py-2" min="0" step="0.5" />
                </div>
              </div>
              <div className="flex justify-end">
                <span className="text-sm font-semibold text-zinc-700">
                  GP: {(parseFloat(pos.menge) * parseFloat(pos.ep) || 0).toLocaleString('de-DE')} €
                </span>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addPosition} className="w-full border-2 border-dashed border-zinc-300 rounded-xl py-3 flex items-center justify-center gap-2 text-sm text-zinc-500 active:bg-zinc-100">
          <Plus size={16} /> Position hinzufügen
        </button>

        <div>
          <label className="label">Anmerkung</label>
          <textarea value={anmerkung} onChange={(e) => { setAnmerkung(e.target.value); setSaved(false) }}
            placeholder="z.B. Ausführung nur bei trockenem Wetter." rows={3} className="input resize-none" />
        </div>

        <div className="card border-2 border-brand-100">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-zinc-600"><span>Netto</span><span>{netto.toLocaleString('de-DE')} €</span></div>
            <div className="flex justify-between text-sm text-zinc-600"><span>MwSt. 19%</span><span>{mwst.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</span></div>
            <div className="border-t border-zinc-200 pt-2 flex justify-between font-bold text-zinc-900 text-lg">
              <span>Gesamt</span>
              <span className="text-brand-600">{brutto.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 pb-safe px-4 py-3">
        <div className="flex gap-2 max-w-lg mx-auto">
          <button onClick={speichern} disabled={saving} className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3">
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
          <button onClick={handlePDF} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
            <FileText size={16} />
            PDF erstellen
          </button>
        </div>
        <p className="text-xs text-center text-zinc-400 mt-2">
          Die KI verschickt das Angebot nie selbst — du hast immer die Kontrolle
        </p>
      </div>
    </div>
  )
}
