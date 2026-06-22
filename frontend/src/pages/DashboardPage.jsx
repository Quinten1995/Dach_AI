import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, Clock, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../utils/supabase'

const STATUS_CONFIG = {
  entwurf:     { label: 'Entwurf',          color: 'bg-amber-100 text-amber-700',  icon: Clock },
  bearbeitet:  { label: 'Bearbeitet',        color: 'bg-blue-100 text-blue-700',    icon: Clock },
  freigegeben: { label: 'Freigabe bereit',   color: 'bg-green-100 text-green-700',  icon: CheckCircle },
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [projekte, setProjekte] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function ladeProjekte() {
      const { data, error } = await supabase
        .from('projekte')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error) setProjekte(data || [])
      setLoading(false)
    }

    ladeProjekte()
  }, [user])

  return (
    <div className="px-4 pt-12 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Meine Projekte</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {loading ? '…' : `${projekte.length} Besichtigungen`}
          </p>
        </div>
        <button
          onClick={signOut}
          className="text-xs text-zinc-400 py-1 px-2 rounded-lg active:bg-zinc-100"
        >
          Abmelden
        </button>
      </div>

      {/* Quick-Action */}
      <button
        onClick={() => navigate('/neu')}
        className="w-full bg-brand-500 text-white rounded-2xl p-5 flex items-center gap-4 mb-6
                   active:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
      >
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Plus size={24} strokeWidth={2.5} />
        </div>
        <div className="text-left">
          <div className="font-semibold text-lg">Neue Besichtigung</div>
          <div className="text-brand-100 text-sm">Fotos + Sprachnotiz aufnehmen</div>
        </div>
      </button>

      {/* Projektliste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projekte.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Noch keine Projekte</p>
          <p className="text-sm mt-1">Erste Besichtigung starten</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projekte.map((project) => {
            const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.entwurf
            const StatusIcon = status.icon
            const betrag = project.protokoll?.positionen
              ?.flatMap(k => k.pos || [])
              ?.reduce((sum, p) => sum + (p.menge * p.ep || 0), 0) || 0

            return (
              <button
                key={project.id}
                onClick={() => navigate(`/projekt/${project.id}`)}
                className="card w-full text-left active:bg-zinc-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 truncate">{project.kunde}</p>
                    <p className="text-sm text-zinc-500 truncate mt-0.5">{project.adresse}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {betrag > 0 && (
                      <p className="font-semibold text-zinc-900">
                        {betrag.toLocaleString('de-DE')} €
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {new Date(project.created_at).toLocaleDateString('de-DE', {
                        day: '2-digit', month: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`badge ${status.color} gap-1`}>
                    <StatusIcon size={11} />
                    {status.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
