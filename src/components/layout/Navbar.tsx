import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogOut, User } from "lucide-react";

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-card text-card-foreground border border-border shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-xl text-primary"
        >
          <span>
            Koperasi <span className="font-light">Digital</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/dashboard">
                  <Button
                    variant={isActive("/dashboard") ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm text-muted-foreground hidden md:inline-block">
                  {profile?.username ?? profile?.full_name ?? ""}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={signOut}
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Link to="/login">
              <Button variant="secondary" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
