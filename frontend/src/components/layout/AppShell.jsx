import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Plus, User } from 'lucide-react'
import { clsx } from 'clsx'

export default function AppShell() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 pb-safe z-50">
        <div className="flex items-center justify-around h-20 max-w-md mx-auto px-4">

          {/* Dashboard */}
          <NavLink to="/" end className={({ isActive }) =>
            clsx('flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors',
              isActive ? 'text-brand-500' : 'text-zinc-400')
          }>
            {({ isActive }) => (
              <>
                <Home size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-xs font-medium">Übersicht</span>
              </>
            )}
          </NavLink>

          {/* Neues Projekt — prominenter Plus Button */}
          <div className="flex-1 flex justify-center relative">
            <button
              onClick={() => navigate('/neu')}
              className="absolute -top-7 w-14 h-14 bg-brand-500 rounded-full flex items-center justify-center shadow-lg active:bg-brand-700 transition-colors"
            >
              <Plus size={26} className="text-white" strokeWidth={2.5} />
            </button>
          </div>

          {/* Profil */}
          <NavLink to="/profil" className={({ isActive }) =>
            clsx('flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors',
              isActive ? 'text-brand-500' : 'text-zinc-400')
          }>
            {({ isActive }) => (
              <>
                <User size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-xs font-medium">Profil</span>
              </>
            )}
          </NavLink>

        </div>
      </nav>
    </div>
  )
}
