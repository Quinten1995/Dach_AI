import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Bereits eingeloggt
  if (user) return <Navigate to="/" replace />

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      setError('Fehler beim Senden. Bitte prüfe die E-Mail-Adresse.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 pt-safe pb-safe">
      {/* Logo / Branding */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          {/* Dach-Icon */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 18L16 6L28 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 18V26H24V18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">DachProfi AI</h1>
        <p className="text-zinc-400 text-sm mt-1">5 Fotos. 60 Sekunden. Angebot fertig.</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="text-white font-semibold text-lg mb-2">Link verschickt!</h2>
            <p className="text-zinc-400 text-sm">
              Prüfe dein Postfach und klicke auf den Login-Link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label text-zinc-300">E-Mail-Adresse</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dachprofi@beispiel.de"
                required
                className="input bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500
                           focus:ring-brand-500"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary"
            >
              {loading ? 'Senden…' : 'Magic Link senden'}
            </button>
          </form>
        )}
      </div>

      <p className="text-zinc-600 text-xs mt-6 text-center">
        Kein Passwort nötig · DSGVO-konform · Server in der EU
      </p>
    </div>
  )
}
