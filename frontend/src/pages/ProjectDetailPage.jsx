import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, FileText, Download, Edit3 } from 'lucide-react'

// Beispiel-Ausgabe wie Claude sie generieren wird
const MOCK_PROTOCOL = {
  id: '1',
  kunde: 'Familie Maier',
  adresse: 'Hauptstr. 12, 80331 München',
  datum: '2024-01-15',
  status: 'entwurf',
  zusammenfassung: 'Steildach (Satteldach, ca. 180m²) mit Biberschwanz-Ziegeln aus den 1960er Jahren. Mehrere gebrochene Ziegel im Nordbereich sichtbar. First-Abdeckung teilweise aufgebrochen, Ortgangblech verrostet. Regenrinne rechts durchgerostet, Fallrohr fehlt. Dachfenster-Abdichtung schadhaft.',
  positionen: [
    {
      kategorie: 'Ziegel & Deckung',
      pos: [
        { nr: '1.1', bezeichnung: 'Ziegelwechsel Biberschwanz, inkl. Mörtel', einheit: 'Stk', menge: 35, ep: 18, gp: 630 },
        { nr: '1.2', bezeichnung: 'Konterlattung und Lattung ausbessern', einheit: 'm²', menge: 15, ep: 22, gp: 330 },
      ]
    },
    {
      kategorie: 'First & Ortgang',
      pos: [
        { nr: '2.1', bezeichnung: 'Firstziegel neu verlegen, Mörtel erneuern', einheit: 'm', menge: 12, ep: 45, gp: 540 },
        { nr: '2.2', bezeichnung: 'Ortgangblech Titanzink erneuern', einheit: 'm', menge: 8, ep: 38, gp: 304 },
      ]
    },
    {
      kategorie: 'Rinne & Entwässerung',
      pos: [
        { nr: '3.1', bezeichnung: 'Dachrinne Titanzink DN 125 erneuern', einheit: 'm', menge: 14, ep: 55, gp: 770 },
        { nr: '3.2', bezeichnung: 'Fallrohr Titanzink DN 80, inkl. Schellen', einheit: 'm', menge: 4, ep: 42, gp: 168 },
      ]
    },
    {
      kategorie: 'Abdichtung',
      pos: [
        { nr: '4.1', bezeichnung: 'Dachfenster-Anschluss neu abdichten (Velux)', einheit: 'Stk', menge: 1, ep: 280, gp: 280 },
      ]
    },
    {
      kategorie: 'Gerüst & Anfahrt',
      pos: [
        { nr: '5.1', bezeichnung: 'Gerüststellung und -abbau', einheit: 'pauschal', menge: 1, ep: 850, gp: 850 },
        { nr: '5.2', bezeichnung: 'Anfahrtspauschale', einheit: 'pauschal', menge: 1, ep: 80, gp: 80 },
      ]
    },
  ],
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = MOCK_PROTOCOL // später: aus Supabase laden

  const netto = project.positionen
    .flatMap((k) => k.pos)
    .reduce((sum, p) => sum + p.gp, 0)
  const mwst = netto * 0.19
  const brutto = netto + mwst

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100 px-4 py-4 pt-safe">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-zinc-500">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-zinc-900 truncate">{project.kunde}</h1>
            <p className="text-xs text-zinc-500 truncate">{project.adresse}</p>
          </div>
        </div>

        {/* Aktionen */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/projekt/${id}/angebot`)}
            className="btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <FileText size={16} />
            Angebot bearbeiten
          </button>
          <button className="btn-secondary py-2.5 text-sm flex items-center justify-center gap-2 !w-auto px-4">
            <Download size={16} />
            PDF
          </button>
        </div>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
        {/* Zusammenfassung */}
        <div className="card">
          <h2 className="font-semibold text-zinc-900 mb-2 flex items-center gap-2">
            <span className="text-base">🏠</span> KI-Zusammenfassung
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">{project.zusammenfassung}</p>
        </div>

        {/* Leistungspositionen */}
        <div>
          <h2 className="font-semibold text-zinc-900 mb-3">Leistungsverzeichnis</h2>
          <div className="space-y-3">
            {project.positionen.map((kategorie) => (
              <div key={kategorie.kategorie} className="card">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                  {kategorie.kategorie}
                </h3>
                <div className="space-y-3">
                  {kategorie.pos.map((pos) => (
                    <div key={pos.nr} className="flex gap-3">
                      <span className="text-xs text-zinc-400 w-6 flex-shrink-0 pt-0.5">{pos.nr}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-800">{pos.bezeichnung}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {pos.menge} {pos.einheit} × {pos.ep.toLocaleString('de-DE')} €
                        </p>
                      </div>
                      <span className="text-sm font-medium text-zinc-900 flex-shrink-0">
                        {pos.gp.toLocaleString('de-DE')} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summe */}
        <div className="card border-2 border-brand-100">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Nettobetrag</span>
              <span>{netto.toLocaleString('de-DE')} €</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-600">
              <span>MwSt. 19%</span>
              <span>{mwst.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</span>
            </div>
            <div className="border-t border-zinc-200 pt-2 flex justify-between font-bold text-zinc-900">
              <span>Gesamtbetrag</span>
              <span className="text-brand-600">{brutto.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</span>
            </div>
          </div>
        </div>

        {/* Hinweis */}
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <p className="text-xs text-amber-700">
            <strong>Vor der Freigabe prüfen:</strong> Mengen, Einheitspreise und Positionen sind KI-Vorschläge — bitte auf Vollständigkeit und Richtigkeit prüfen.
          </p>
        </div>
      </div>
    </div>
  )
}
