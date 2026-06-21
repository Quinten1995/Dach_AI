import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Plus, FileText, Settings } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { to: '/',        icon: Home,     label: 'Übersicht', exact: true },
  { to: '/neu',     icon: Plus,     label: 'Neu',       primary: true },
  { to: '/archiv',  icon: FileText, label: 'Archiv' },
]

export default function AppShell() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      {/* Haupt-Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 pb-safe z-50">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
          {navItems.map(({ to, icon: Icon, label, primary, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors',
                  primary
                    ? 'relative'
                    : isActive
                    ? 'text-brand-500'
                    : 'text-zinc-400'
                )
              }
            >
              {({ isActive }) =>
                primary ? (
                  // Plus-Button – prominent in der Mitte
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <div className="w-14 h-14 bg-brand-500 rounded-full flex items-center justify-center shadow-lg active:bg-brand-700 transition-colors">
                      <Icon size={26} className="text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                ) : (
                  <>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                    <span className="text-xs font-medium">{label}</span>
                  </>
                )
              }
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
