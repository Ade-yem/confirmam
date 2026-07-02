import { NavLink } from 'react-router-dom'
import { LayoutDashboard, History, QrCode, Send, User } from 'lucide-react'
import { cn } from '@/utils/cn'

export function AppNav() {
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'History', icon: History },
    { to: '/receive', label: 'Receive', icon: QrCode, isFab: true },
    { to: '/send', label: 'Send Money', icon: Send },
    { to: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <nav 
      role="navigation"
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 shadow-soft"
    >
      <div className="w-full max-w-md mx-auto flex items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon

          // Receive Payment FAB floating action button
          if (link.isFab) {
            return (
              <NavLink
                key={link.to}
                to={link.to}
                aria-label="Generate code to receive payment"
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center transition-all duration-200 select-none",
                    "relative -top-5 w-14 h-14 rounded-full bg-emerald text-white shadow-cta border-4 border-surface focus:outline-none focus:ring-2 focus:ring-emerald-light",
                    isActive ? "bg-emerald-dark" : "hover:bg-emerald-dark"
                  )
                }
              >
                <Icon className="w-6 h-6 text-white" />
              </NavLink>
            )
          }

          // Standard link rendering
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-16 h-12 transition-all duration-200 select-none focus:outline-none rounded-xl focus:bg-gray-50",
                  isActive ? "text-emerald" : "text-midnight-60 hover:text-midnight"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("w-5 h-5", isActive ? "text-emerald" : "text-midnight-60")} />
                  <span className={cn(
                    "text-[10px] tracking-tight mt-0.5 font-bold transition-colors",
                    isActive ? "text-emerald" : "text-midnight-40"
                  )}>
                    {link.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
