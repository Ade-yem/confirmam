import { NavLink } from 'react-router-dom'
import { LayoutDashboard, History, QrCode, Send, User } from 'lucide-react'
import { cn } from '../../utils/cn'

export function AppNav() {
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'History', icon: History },
    { to: '/receive', label: 'Receive', icon: QrCode, isFab: true },
    { to: '/send', label: 'Send Money', icon: Send },
    { to: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 shadow-soft md:top-0 md:bottom-0 md:left-0 md:right-auto md:w-24 md:h-screen md:border-t-0 md:border-r md:flex-col md:justify-start md:py-8 md:gap-8 lg:w-60 lg:items-stretch lg:px-4">
      {/* Merchant logo / brand - hidden on mobile/tablet, visible on desktop */}
      <div className="hidden lg:flex items-center gap-3 px-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-emerald flex items-center justify-center text-white font-bold text-lg shadow-sm">
          C
        </div>
        <span className="font-bold text-lg text-midnight tracking-tight">ConfirmAm</span>
      </div>

      {links.map((link) => {
        const Icon = link.icon

        // Receive Payment FAB is handled specially on mobile/tablet
        if (link.isFab) {
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center transition-all duration-200",
                  // Mobile FAB layout
                  "relative -top-5 w-14 h-14 rounded-full bg-emerald text-white shadow-cta border-4 border-surface",
                  isActive ? "bg-emerald-dark" : "hover:bg-emerald-dark",
                  // Tablet rail layout
                  "md:top-0 md:w-14 md:h-14 md:my-auto",
                  // Desktop layout
                  "lg:w-auto lg:h-12 lg:rounded-lg lg:flex-row lg:justify-start lg:px-4 lg:gap-3 lg:my-0 lg:shadow-none lg:border-0",
                  isActive
                    ? "lg:bg-emerald-50 lg:text-emerald lg:border-l-4 lg:border-emerald lg:rounded-l-none"
                    : "lg:bg-transparent lg:text-midnight-60 lg:hover:bg-gray-50 lg:hover:text-midnight"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("w-6 h-6", link.isFab ? "text-white" : "", isActive && !link.isFab ? "text-emerald" : "")} />
                  {/* Tablet stacked label */}
                  <span className="hidden md:inline lg:hidden text-[10px] font-medium mt-1 text-midnight-60">
                    {link.label}
                  </span>
                  {/* Desktop inline label */}
                  <span className={cn(
                    "hidden lg:inline text-sm font-semibold", 
                    isActive ? "text-emerald" : "text-midnight-60"
                  )}>
                    {link.label}
                  </span>
                </>
              )}
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
                "flex flex-col items-center justify-center w-16 h-12 transition-all duration-200",
                "md:w-16 md:h-14 md:rounded-xl",
                "lg:w-auto lg:h-12 lg:flex-row lg:justify-start lg:px-4 lg:gap-3 lg:rounded-lg",
                isActive
                  ? "text-emerald md:bg-emerald-50 lg:bg-emerald-50 lg:border-l-4 lg:border-emerald lg:rounded-l-none"
                  : "text-midnight-60 hover:text-midnight md:hover:bg-gray-50"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("w-5 h-5", isActive ? "text-emerald" : "text-midnight-60")} />
                {/* Mobile/Tablet label (very small) */}
                <span className={cn(
                  "text-[10px] font-medium mt-0.5 md:mt-1 lg:hidden",
                  isActive ? "text-emerald font-semibold" : "text-midnight-40"
                )}>
                  {link.label}
                </span>
                {/* Desktop label */}
                <span className={cn(
                  "hidden lg:inline text-sm font-semibold",
                  isActive ? "text-emerald" : "text-midnight-60"
                )}>
                  {link.label}
                </span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
