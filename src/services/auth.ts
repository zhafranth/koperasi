import { supabase } from "@/utils/supabase";

export type UserRole = "anggota" | "pengurus";

export interface AuthProfile {
  id: string;
  phone: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  photo_url?: string | null;
  password_hash?: string;
}

export async function loginWithPhonePassword(phone: string, password: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("phone", phone)
    .eq("is_active", true)
    .single();

  if (error) throw error;
  if (!data) throw new Error("User tidak ditemukan");

  if ((data as AuthProfile).password_hash !== password) {
    throw new Error("Password salah");
  }

  localStorage.setItem("auth_phone", phone);
  return data as AuthProfile;
}

export async function registerWithPhonePassword(
  phone: string,
  password_hash: string,
  fullName?: string,
  photoUrl?: string,
) {
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
