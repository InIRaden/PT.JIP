# Database Setup (Vercel + Neon)

Project ini menggunakan Neon Postgres (kompatibel dan direkomendasikan untuk Vercel)...

## 1. Buat database Neon dari Vercel
1. Buka project di Vercel Dashboard.
2. Masuk ke tab Storage.
3. Tambahkan Neon (Postgres).
4. Setelah selesai, copy connection string `DATABASE_URL`.

## 2. Set environment variable
Tambahkan environment variable berikut di Vercel:
- `DATABASE_URL`

Untuk local development, buat file `.env` dari `.env.example` lalu isi `DATABASE_URL`.

## 3. Jalankan schema SQL di Neon
1. Buka Neon Console.
2. Pilih database Anda.
3. Buka menu SQL Editor.
4. Copy seluruh isi [database/schema.sql](database/schema.sql), lalu Run.

Script ini akan:
- Membuat tabel `site_content` jika belum ada.
- Membuat index `updated_at`.
- Mengisi baris `id='main'` dengan konten kosong (tanpa dummy).

## 4. Deploy
Deploy ke Vercel seperti biasa.

## 5. Alur aplikasi
- Website publik membaca konten dari endpoint `/api/content`.
- Login admin dan panel admin tetap dipakai seperti sebelumnya.
- Saat admin klik Simpan/Reset, data otomatis tersimpan ke database.
- Jika API/database tidak tersedia, aplikasi fallback ke localStorage agar tetap bisa dipakai.

## 6. Verifikasi koneksi
Setelah deploy atau menjalankan local server:
1. Buka website, lalu login admin.
2. Ubah 1 field apa saja, klik Simpan.
3. Kembali ke Neon SQL Editor lalu jalankan:

```sql
SELECT id, updated_at
FROM site_content
WHERE id = 'main';
```

Jika `updated_at` berubah, aplikasi sudah terkoneksi ke Neon dengan benar.
