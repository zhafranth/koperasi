import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, LogOut, Users, ChevronLeft, ChevronRight } from "lucide-react"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { isAdmin, signOut } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const widthClass = collapsed ? "w-16" : "w-64"
  const labelClass = collapsed ? "opacity-0 pointer-events-none -translate-x-2" : "opacity-100 translate-x-0"

  return (
    <aside
      className={`fixed inset-y-0 left-0 ${widthClass} bg-card text-card-foreground border-r border-border shadow-sm transition-[width] duration-300 ease-in-out flex flex-col`}
    >
      <div className="flex items-center justify-between h-16 px-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-primary">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
            KD
          </span>
          <span className={`text-lg transition-all duration-300 ease-in-out ${labelClass}`}>
            Koperasi Digital
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggle}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {isAdmin && (
          <>
            <Link to="/dashboard">
              <Button
                variant={isActive("/dashboard") ? "default" : "ghost"}
                size="sm"
                className={`w-full justify-start gap-3 transition-colors ${collapsed ? "px-2" : "px-3"}`}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span className={`transition-all duration-300 ease-in-out ${labelClass}`}>Dashboard</span>
              </Button>
            </Link>
            <Link to="/user">
              <Button
                variant={isActive("/user") ? "default" : "ghost"}
                size="sm"
                className={`w-full justify-start gap-3 transition-colors ${collapsed ? "px-2" : "px-3"}`}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span className={`transition-all duration-300 ease-in-out ${labelClass}`}>User</span>
              </Button>
            </Link>
          </>
        )}
      </nav>

      <div className="px-2 py-3 border-t border-border">
        <Button
          variant="outline"
          size={collapsed ? "icon" : "sm"}
          className={`w-full justify-start gap-3 ${collapsed ? "px-2" : "px-3"}`}
          onClick={signOut}
          title="Logout"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={`transition-all duration-300 ease-in-out ${labelClass}`}>Logout</span>
        </Button>
      </div>
    </aside>
  )
}
