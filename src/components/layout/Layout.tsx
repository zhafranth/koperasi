import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/context/AuthContext";
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  const contentPadding = collapsed ? "pl-16" : "pl-64";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {user ? (
        <>
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
          <main className={`px-4 py-8 transition-[padding] duration-300 ease-in-out ${contentPadding}`}>
            <div className="max-w-6xl mx-auto">{children}</div>
          </main>
        </>
      ) : (
        <>
          <Navbar />
          <main className="container mx-auto px-4 py-8">{children}</main>
        </>
      )}
    </div>
  );
}
