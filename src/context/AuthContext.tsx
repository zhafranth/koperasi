import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import type { AuthProfile } from "@/services/auth";

type UserRole = "anggota" | "pengurus";

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  photo_url?: string | null;
  email?: string | null;
}

interface AuthContextType {
  user: { id: string; phone?: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; phone?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session || null;
      if (session?.user && mounted) {
        await fetchProfileById(session.user.id);
      } else if (mounted) {
        setLoading(false);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLoading(true);
        fetchProfileById(session.user.id);
      } else {
        setProfile(null);
        setUser(null);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
      sub.subscription?.unsubscribe();
    };
  }, []);

  async function fetchProfileById(id: string) {
    try {
      const { data } = await supabase
        .from("users")
        .select(
          "id, username, full_name, role, is_active, photo_url, phone, email",
        )
        .eq("id", id)
        .single();

      let row = (data as AuthProfile | null) ?? null;
      if (!row) {
        const { data: authUser } = await supabase.auth.getUser();
        const email = authUser?.user?.email || "";
        if (email) {
          const { data: byEmail } = await supabase
            .from("users")
            .select(
              "id, username, full_name, role, is_active, photo_url, phone, email",
            )
            .eq("email", email)
            .maybeSingle();
          row = (byEmail as AuthProfile | null) ?? null;
        }
      }

      if (row) {
        const p = row as AuthProfile;
        setProfile({
          id: p.id,
          username: (row as AuthProfile & { username?: string }).username ?? "",
          full_name: p.full_name,
          role: p.role,
          is_active: p.is_active,
          photo_url: p.photo_url ?? null,
          email: p.email ?? null,
        });
        setUser({ id: p.id, phone: p.phone });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === "pengurus",
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
