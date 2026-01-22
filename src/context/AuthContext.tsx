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
}

interface AuthContextType {
  user: { id: string; phone: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  setAuthPhone: (phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; phone: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const phone = localStorage.getItem("auth_phone");
    if (phone) {
      fetchProfileByPhone(phone);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchProfileByPhone(phone: string) {
    try {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone)
        .single();

      if (data) {
        const p = data as AuthProfile;
        setProfile({
          id: p.id,
          username:
            (data as AuthProfile & { username?: string }).username ?? "",
          full_name: p.full_name,
          role: p.role,
          is_active: p.is_active,
          photo_url: p.photo_url ?? null,
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
    localStorage.removeItem("auth_phone");
    setProfile(null);
    setUser(null);
  };

  const setAuthPhone = async (phone: string) => {
    localStorage.setItem("auth_phone", phone);
    setLoading(true);
    await fetchProfileByPhone(phone);
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === "pengurus",
    signOut,
    setAuthPhone,
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
