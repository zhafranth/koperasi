## Tujuan
- Menghapus dependensi email di tabel users, menggantinya dengan username (UNIQUE, NOT NULL).
- Menambahkan field opsional photo_url (TEXT, NULL) di tabel users.
- Menyesuaikan kode agar autentikasi UI menggunakan username, dan profil menyimpan/mengambil photo_url.

## Perubahan Database (Migration)
1. Buat migration baru yang melakukan:
   - DROP COLUMN email (jika masih ada).
   - ADD COLUMN username VARCHAR(50) UNIQUE NOT NULL.
   - Jika kolom photo sudah ada: RENAME COLUMN photo TO photo_url; jika belum, ADD COLUMN photo_url TEXT NULL.
   - DROP INDEX idx_users_email (jika ada).
   - CREATE INDEX idx_users_username ON users(username).
2. Pastikan RLS/Policies tetap berdasar id (auth.uid) sehingga tidak perlu mengubah kebijakan akses.

## Perubahan Kode
1. AuthContext
   - Ubah interface UserProfile: gunakan username, photo_url; hapus email.
   - Pengambilan profil hanya berdasarkan id = auth.uid (hapus fallback by email).
2. Login Page
   - Ubah form agar login memakai username.
   - Registrasi: signUp tetap memakai "email sintetis" dari username (username@VITE_USERNAME_EMAIL_DOMAIN) agar kompatibel dengan Supabase Auth.
   - Setelah signUp, insert ke tabel users: id (auth.user.id), username, full_name, photo_url (opsional), role = 'anggota'.
   - Validasi: cek ketersediaan username sebelum signUp untuk pesan error yang jelas.
3. Navbar
   - Tampilkan profile.username (fallback ke full_name) alih-alih user.email.
4. Audit kode lain
   - Hapus semua penggunaan email dari profil user.
   - Pastikan komponen lain (mis. PaymentForm) tetap aman (menggunakan full_name).

## Migrasi Data Eksisting (Opsional)
- Jika terdapat data lama dengan email, tentukan strategi konversi username:
  - Contoh: username = bagian sebelum '@' dari email lama.
  - Atau tetapkan mapping manual melalui skrip migrasi tambahan.

## Konfigurasi Lingkungan
- Tambahkan VITE_USERNAME_EMAIL_DOMAIN di .env (contoh: koperasi.local).
- Jika verifikasi email Supabase diaktifkan, pertimbangkan:
  - Menonaktifkan confirm email untuk alur ini, atau
  - Menggunakan domain yang valid untuk menerima email verifikasi.

## Validasi
- Jalankan migrasi (supabase db push atau eksekusi SQL migration).
- Uji alur:
  - Registrasi user baru dengan username + photo_url.
  - Login dengan username.
  - Pastikan navbar menampilkan username.
  - Periksa profile di AuthContext terbaca dengan benar (id, username, full_name, photo_url).
- Pastikan tidak ada error lint/diagnostics di editor dan aplikasi berjalan di dev server.

## Catatan Keamanan & Konsistensi
- username UNIQUE untuk mencegah duplikasi.
- Batasi panjang/karakter username pada level UI dan (opsional) pada DB via constraint CHECK.
- Jangan menyimpan rahasia; photo_url berupa URL publik atau dari Supabase Storage.
