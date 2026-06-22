import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2, Download, Loader2 } from 'lucide-react'
import { supabase } from '../utils/supabase'

export default function OfferPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [projekt, setProjekt] = useState(null)
  const [positionen, setPositionen] = useState([])
  const [anmerkung, setAnmerkung] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function ladeProjekt() {
      const { data, error } = await supabase
        .from('projekte')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        setProjekt(data)
        // Positionen aus protokoll laden
        const pos = data.protokoll?.positionen
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
      setLoading(false)
    }
    ladeProjekt()
  }, [id])

  const update = (posId, field, value) => {
    setPositionen((prev) =>
      prev.map((p) => p.id === posId ? { ...p, [field]: value } : p)
    )
    setSaved(false)
  }

  const remove = (posId) => {
    setPositionen((prev) => prev.filter((p) => p.id !== posId))
    setSaved(false)
  }

  const addPosition = () => {
    const newId = `new-${Date.now()}`
    setPositionen((prev) => [
      ...prev,
      { id: newId, bezeichnung: '', einheit: 'm²', menge: 1, ep: 0 }
    ])
    setSaved(false)
  }

  const speichern = async () => {
    setSaving(true)
    // Positionen zurück in protokoll-Format bringen
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

    if (!error) setSaved(true)
    setSaving(false)
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
      {/* Header */}
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

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4 pb-36">

        {/* Keine Positionen */}
        {positionen.length === 0 && (
          <div className="card border-2 border-amber-100 bg-amber-50">
            <p className="text-sm text-amber-700 font-medium mb-1">⏳ Noch keine KI-Positionen</p>
            <p className="text-xs text-amber-600">
              Nach der KI-Analyse werden hier automatisch Positionen vorgeschlagen. Du kannst aber auch manuell welche hinzufügen.
            </p>
          </div>
        )}

        {/* Positionen */}
        {positionen.length > 0 && <h2 className="font-semibold text-zinc-900">Leistungspositionen</h2>}

        <div className="space-y-2">
          {positionen.map((pos) => (
            <div key={pos.id} className="card space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pos.bezeichnung}
                  onChange={(e) => update(pos.id, 'bezeichnung', e.target.value)}
                  placeholder="Bezeichnung"
                  className="input flex-1 text-sm py-2"
                />
                <button onClick={() => remove(pos.id)} className="p-2 text-zinc-400 active:text-red-500 flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 mb-1 block">Menge</label>
                  <input
                    type="number"
                    value={pos.menge}
                    onChange={(e) => update(pos.id, 'menge', e.target.value)}
                    className="input text-sm py-2"
                    min="0"
                  />
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
                  <input
                    type="number"
                    value={pos.ep}
                    onChange={(e) => update(pos.id, 'ep', e.target.value)}
                    className="input text-sm py-2"
                    min="0"
                    step="0.5"
                  />
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

        {/* Position hinzufügen */}
        <button
          onClick={addPosition}
          className="w-full border-2 border-dashed border-zinc-300 rounded-xl py-3
                     flex items-center justify-center gap-2 text-sm text-zinc-500
                     active:bg-zinc-100 transition-colors"
        >
          <Plus size={16} />
          Position hinzufügen
        </button>

        {/* Anmerkung */}
        <div>
          <label className="label">Anmerkung</label>
          <textarea
            value={anmerkung}
            onChange={(e) => { setAnmerkung(e.target.value); setSaved(false) }}
            placeholder="z.B. Ausführung nur bei trockenem Wetter."
            rows={3}
            className="input resize-none"
          />
        </div>

        {/* Summe */}
        <div className="card border-2 border-brand-100">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Netto</span>
              <span>{netto.toLocaleString('de-DE')} €</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-600">
              <span>MwSt. 19%</span>
              <span>{mwst.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</span>
            </div>
            <div className="border-t border-zinc-200 pt-2 flex justify-between font-bold text-zinc-900 text-lg">
              <span>Gesamt</span>
              <span className="text-brand-600">{brutto.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 pb-safe px-4 py-3">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button onClick={speichern} disabled={saving} className="btn-primary flex items-center justify-center gap-2">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {saving ? 'Wird gespeichert…' : 'Speichern'}
          </button>
        </div>
        <p className="text-xs text-center text-zinc-400 mt-2">
          Die KI verschickt das Angebot nie selbst — du hast immer die Kontrolle
        </p>
      </div>
    </div>
  )
}
