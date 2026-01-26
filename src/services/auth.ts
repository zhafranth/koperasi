import { supabase } from "@/utils/supabase";

export type UserRole = "anggota" | "pengurus";

export interface AuthProfile {
  id: string;
  email?: string | null;
  phone: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  photo_url?: string | null;
  password_hash?: string;
}

export async function loginWithEmailPassword(email: string, password: string) {
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  if (!signInData || !signInData.user) throw new Error("Login gagal");

  const userId = signInData.user.id;
  let { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (profileError || !profile) {
    const { data: byEmail } = await supabase
      .from("users")
      .select("*")
      .eq("email", signInData.user.email || "")
      .maybeSingle();
    profile = byEmail || null;
    profileError = null;
  }
  if (!profile)
    throw new Error(
      "Profil tidak ditemukan. Hubungi pengurus untuk melengkapi data.",
    );

  const p = profile as AuthProfile;
  if (!p.is_active) {
    await supabase.auth.signOut();
    throw new Error("Akun nonaktif. Hubungi pengurus.");
  }

  return p;
}

export async function registerWithEmailProfile(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const user = data.user || null;
  if (!user) {
    return { needsConfirmation: true };
  }

  const insertPayload: Record<string, unknown> = {
    id: user.id,
    email,
    phone: phone || null,
    full_name: fullName,
    role: "anggota",
    is_active: true,
  };

  const { data: profile, error: upsertError } = await supabase
    .from("users")
    .upsert(insertPayload, { onConflict: "id" })
    .select()
    .single();
  if (upsertError) throw upsertError;
  return profile as AuthProfile;
}

export async function registerWithPhonePassword(
  phone: string,
  password_hash: string,
  fullName?: string,
  photoUrl?: string,
) {
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser || !authUser.user) {
    throw new Error("Harus terautentikasi terlebih dahulu untuk registrasi");
  }

  const { data: existing, error: existError } = await supabase
    .from("users")
    .select("id")
    .eq("phone", phone)
    .limit(1);
  if (existError) throw existError;
  if (existing && existing.length > 0) {
    throw new Error("Nomor telepon sudah terdaftar");
  }

  const insertPayload: Record<string, unknown> = {
    id: authUser.user.id,
    phone,
    password_hash,
    full_name: fullName || phone,
    role: "anggota",
    is_active: true,
  };

  if (photoUrl) {
    insertPayload["photo_url"] = photoUrl;
  }

  const { data, error } = await supabase
    .from("users")
    .insert(insertPayload)
    .select()
    .single();
  if (error) throw error;
  return data as AuthProfile;
}
