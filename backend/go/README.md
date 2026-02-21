# Backend Rasya Production (Go)

API untuk donasi, layanan, portofolio, order, admin, dan fitur lain. Jalankan di lokal agar frontend (localhost:3000) bisa memakai API.

## Menjalankan di lokal

1. **Persyaratan:** Go 1.21+ terpasang, PostgreSQL (opsional; bisa pakai in-memory jika `DATABASE_URL` kosong).

2. **Masuk ke folder backend:**
   ```bash
   cd rasya-production/backend/go
   ```

3. **Env (opsional):** Buat file `.env` di folder ini jika perlu:
   ```env
   PORT=8080
   # Tanpa DATABASE_URL: data donasi/layanan/porto disimpan in-memory (hilang saat restart).
   # Dengan PostgreSQL:
   # DATABASE_URL=postgres://user:password@localhost:5432/rasya?sslmode=disable
   # JWT_SECRET=rahasia-jwt-untuk-admin
   # ADMIN_ALLOWED_EMAIL=email@anda.com
   ```

4. **Jalankan server:**
   ```bash
   go run ./cmd/api
   ```
   Server berjalan di **http://localhost:8080**.

5. **Frontend:** Di folder `rasya-production/frontend` set `NEXT_PUBLIC_API_URL=http://localhost:8080` (atau kosongkan, default sudah 8080), lalu `npm run dev`. Frontend akan memakai backend lokal.

## Production

Deploy backend (mis. ke Koyeb/Railway) dan set `NEXT_PUBLIC_API_URL` di frontend ke URL backend production. Untuk menampilkan **laman maintenance** di domain production, set di env build frontend:
```env
NEXT_PUBLIC_MAINTENANCE=true
```
Lalu build & deploy frontend. Set kembali ke `false` saat siap buka lagi.
