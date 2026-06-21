import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2, Download, Send } from 'lucide-react'

// Gleiche Mock-Daten (später aus State/DB)
const initPositionen = [
  { id: 1, bezeichnung: 'Ziegelwechsel Biberschwanz, inkl. Mörtel', einheit: 'Stk', menge: 35, ep: 18 },
  { id: 2, bezeichnung: 'Firstziegel neu verlegen, Mörtel erneuern', einheit: 'm', menge: 12, ep: 45 },
  { id: 3, bezeichnung: 'Ortgangblech Titanzink erneuern', einheit: 'm', menge: 8, ep: 38 },
  { id: 4, bezeichnung: 'Dachrinne Titanzink DN 125 erneuern', einheit: 'm', menge: 14, ep: 55 },
  { id: 5, bezeichnung: 'Fallrohr Titanzink DN 80, inkl. Schellen', einheit: 'm', menge: 4, ep: 42 },
  { id: 6, bezeichnung: 'Dachfenster-Anschluss neu abdichten', einheit: 'Stk', menge: 1, ep: 280 },
  { id: 7, bezeichnung: 'Gerüststellung und -abbau', einheit: 'pauschal', menge: 1, ep: 850 },
  { id: 8, bezeichnung: 'Anfahrtspauschale', einheit: 'pauschal', menge: 1, ep: 80 },
]

export default function OfferPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [positionen, setPositionen] = useState(initPositionen)
  const [anmerkung, setAnmerkung] = useState('')
  const [downloading, setDownloading] = useState(false)

  const update = (posId, field, value) => {
    setPositionen((prev) =>
      prev.map((p) => p.id === posId ? { ...p, [field]: value } : p)
    )
  }

  const remove = (posId) => {
    setPositionen((prev) => prev.filter((p) => p.id !== posId))
  }

  const addPosition = () => {
    const newId = Math.max(...positionen.map((p) => p.id)) + 1
    setPositionen((prev) => [
      ...prev,
      { id: newId, bezeichnung: '', einheit: 'm²', menge: 1, ep: 0 }
    ])
  }

  const netto = positionen.reduce((sum, p) => sum + (p.menge * p.ep), 0)
  const mwst = netto * 0.19
  const brutto = netto + mwst

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/projekt/${id}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionen, anmerkung }),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Angebot_${id}.pdf`
      a.click()
    } catch {
      alert('PDF-Export fehlgeschlagen.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100 px-4 py-4 pt-safe">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-500">
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-semibold text-zinc-900">Angebot bearbeiten</h1>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4 pb-32">
        {/* Positionen */}
        <h2 className="font-semibold text-zinc-900">Leistungspositionen</h2>

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
                <button
                  onClick={() => remove(pos.id)}
                  className="p-2 text-zinc-400 active:text-red-500 flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 mb-1 block">Menge</label>
                  <input
                    type="number"
                    value={pos.menge}
                    onChange={(e) => update(pos.id, 'menge', parseFloat(e.target.value) || 0)}
                    className="input text-sm py-2"
                    min="0"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs text-zinc-500 mb-1 block">Einheit</label>
                  <select
                    value={pos.einheit}
                    onChange={(e) => update(pos.id, 'einheit', e.target.value)}
                    className="input text-sm py-2"
                  >
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
                    onChange={(e) => update(pos.id, 'ep', parseFloat(e.target.value) || 0)}
                    className="input text-sm py-2"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <span className="text-sm font-semibold text-zinc-700">
                  GP: {(pos.menge * pos.ep).toLocaleString('de-DE')} €
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
          <label className="label">Anmerkung / Bemerkung</label>
          <textarea
            value={anmerkung}
            onChange={(e) => setAnmerkung(e.target.value)}
            placeholder="z.B. Ausführung nur bei trockenem Wetter. Gerüst vom Kunden gestellt."
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
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Download size={18} />
            {downloading ? 'PDF wird erstellt…' : 'PDF herunterladen'}
          </button>
        </div>
        <p className="text-xs text-center text-zinc-400 mt-2">
          Die KI verschickt das Angebot nie selbst — du hast immer die Kontrolle
        </p>
      </div>
    </div>
  )
}
