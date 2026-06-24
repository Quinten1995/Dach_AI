import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, FileText, Loader2 } from 'lucide-react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../hooks/useAuth'
import { exportPDF } from '../utils/pdf_export'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projekt, setProjekt] = useState(null)
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    async function ladeAlles() {
      const [{ data: projektData }, { data: profilData }] = await Promise.all([
        supabase.from('projekte').select('*').eq('id', id).single(),
        supabase.from('profile').select('*').eq('user_id', user.id).single(),
      ])
      if (projektData) setProjekt(projektData)
      if (profilData) setProfil(profilData)
      setLoading(false)
    }
    ladeAlles()
  }, [id, user])

  const handlePDF = async () => {
    if (!positionen.length) {
      alert('Keine Positionen vorhanden — bitte erst KI-Analyse durchführen.')
      return
    }
    setPdfLoading(true)
    await exportPDF(projekt, positionen, profil, '')
    setPdfLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-brand-500 animate-spin" />
      </div>
    )
  }

  if (!projekt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">Projekt nicht gefunden</p>
        <button onClick={() => navigate('/')} className="btn-secondary w-auto px-6">Zurück</button>
      </div>
    )
  }

  const positionen = projekt.protokoll?.positionen?.flatMap(k => k.pos || []) || []
  const netto = positionen.reduce((sum, p) => sum + (p.menge * p.ep || 0), 0)
  const mwst = netto * 0.19
  const brutto = netto + mwst

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="bg-white border-b border-zinc-100 px-4 py-4 pt-safe">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-zinc-500">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-zinc-900 truncate">{projekt.kunde}</h1>
            <p className="text-xs text-zinc-500 truncate">{projekt.adresse}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/projekt/${id}/angebot`)}
            className="btn-secondary py-2.5 text-sm flex items-center justify-center gap-2 flex-1"
          >
            <FileText size={16} />
            Angebot bearbeiten
          </button>
          <button
            onClick={handlePDF}
            disabled={pdfLoading || positionen.length === 0}
            className="btn-primary py-2.5 text-sm flex items-center justify-center gap-2 flex-1"
          >
            {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : '📄'}
            {pdfLoading ? 'PDF…' : 'PDF erstellen'}
          </button>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">

        {!projekt.protokoll && (
          <div className="card border-2 border-amber-100 bg-amber-50">
            <p className="text-sm text-amber-700 font-medium mb-1">⏳ KI-Analyse ausstehend</p>
            <p className="text-xs text-amber-600">
              Neue Besichtigung starten um Fotos + Notiz zu analysieren.
            </p>
          </div>
        )}

        <div className="card">
          <h2 className="font-semibold text-zinc-900 mb-3">Besichtigung</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Kunde</span>
              <span className="font-medium">{projekt.kunde}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Adresse</span>
              <span className="font-medium text-right max-w-[200px]">{projekt.adresse}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Datum</span>
              <span className="font-medium">
                {new Date(projekt.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Status</span>
              <span className="font-medium capitalize">{projekt.status}</span>
            </div>
          </div>
        </div>

        {projekt.protokoll?.zusammenfassung && (
          <div className="card">
            <h2 className="font-semibold text-zinc-900 mb-2">🏠 KI-Zusammenfassung</h2>
            <p className="text-sm text-zinc-600 leading-relaxed">{projekt.protokoll.zusammenfassung}</p>
          </div>
        )}

        {projekt.protokoll?.risikohinweise?.length > 0 && (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <p className="text-sm font-semibold text-red-700 mb-2">⚠️ Risikohinweise</p>
            <ul className="space-y-1">
              {projekt.protokoll.risikohinweise.map((h, i) => (
                <li key={i} className="text-xs text-red-600">• {h}</li>
              ))}
            </ul>
          </div>
        )}

        {positionen.length > 0 && (
          <div>
            <h2 className="font-semibold text-zinc-900 mb-3">Leistungsverzeichnis</h2>
            <div className="space-y-3">
              {projekt.protokoll.positionen.map((kategorie) => (
                <div key={kategorie.kategorie} className="card">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                    {kategorie.kategorie}
                  </h3>
                  <div className="space-y-3">
                    {(kategorie.pos || []).map((pos) => (
                      <div key={pos.nr} className="flex gap-3">
                        <span className="text-xs text-zinc-400 w-6 flex-shrink-0 pt-0.5">{pos.nr}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-800">{pos.bezeichnung}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {pos.menge} {pos.einheit} × {pos.ep?.toLocaleString('de-DE')} €
                          </p>
                        </div>
                        <span className="text-sm font-medium text-zinc-900 flex-shrink-0">
                          {(pos.menge * pos.ep)?.toLocaleString('de-DE')} €
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {netto > 0 && (
          <div className="card border-2 border-brand-100">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Nettobetrag</span><span>{netto.toLocaleString('de-DE')} €</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-600">
                <span>MwSt. 19%</span><span>{mwst.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</span>
              </div>
              <div className="border-t border-zinc-200 pt-2 flex justify-between font-bold text-zinc-900">
                <span>Gesamtbetrag</span>
                <span className="text-brand-600">{brutto.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</span>
              </div>
            </div>
          </div>
        )}

        {positionen.length > 0 && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <p className="text-xs text-amber-700">
              <strong>Vor der Freigabe prüfen:</strong> Mengen, Preise und Positionen sind KI-Vorschläge.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
