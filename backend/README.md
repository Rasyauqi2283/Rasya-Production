# Rasya Production — Backend

Backend gabungan **Go** (API utama) dan **JavaScript** (script & layer pendukung).

---

## Arsitektur

| Bagian   | Bahasa     | Peran |
|----------|------------|--------|
| **Go**   | `backend/go` | REST API: health, home, CORS. Siap ditambah route (kontak, auth, dll). |
| **JavaScript** | `backend/js` | Scripts (health-check, env-check). Ke depan: workers, serverless, atau integrasi dengan Next.js API routes. |

---

## Menjalankan API (Go)

### Prasyarat

- Go 1.21+

### Langkah

```bash
cd rasya-production/backend/go
go mod tidy
go run ./cmd/api
```

API berjalan di **http://localhost:8080** (atau gunakan env `PORT`).

### Endpoint

| Method | Path    | Keterangan |
|--------|---------|------------|
| GET    | `/`     | Welcome + info |
| GET    | `/health` | Health check (JSON) |
| POST   | `/api/donate` | Submit donasi (JSON: amount, comment, name, email). Respon berisi instruksi transfer. |
| POST   | `/api/donate/create-transaction` | Buat transaksi Midtrans Snap (GoPay); kembalikan snap_token. |
| POST   | `/api/donate/webhook` | Webhook notifikasi Midtrans (donasi tercatat setelah bayar). |
| GET    | `/api/reviews` | Daftar ulasan (donasi &lt; threshold dengan komentar) |
| GET    | `/api/services` | Daftar layanan |
| GET    | `/api/porto` | Daftar portofolio |
| POST   | `/api/auth/admin` | Login admin (Google OAuth, kembalikan JWT) |

### Environment

| Variabel | Default     | Keterangan |
|----------|-------------|------------|
| `PORT`   | `8080`      | Port server |
| `ENV`    | `development` | environment |
| `BANK_NAME` | -        | Nama bank (untuk halaman donasi) |
| `BANK_NUMBER` | -      | Nomor rekening |
| `BANK_ACCOUNT` | -     | Nama pemilik rekening |
| `DONATE_HIGHLIGHT_IDR` | `50000` | Donasi ≥ nilai ini masuk "prioritas inbox" |

---

## Layer JavaScript

```bash
cd rasya-production/backend/js
npm install
npm run health      # cek Go API (butuh API jalan di :8080)
npm run env:check   # cek env
```

- **Health check:** memanggil `GET {API_URL}/health` (default `http://localhost:8080`).
- **Env check:** menampilkan env yang dipakai (tanpa nilai rahasia).

Ke depan, folder `js` bisa dipakai untuk:

- Cron/worker (Node)
- Serverless functions (Vercel/Cloudflare)
- Shared validation atau config yang dipakai frontend + Go

---

## Deploy (Railway / raspro.co.id)

- **Go API:** build dengan `go build -o api ./cmd/api`, set `PORT` di Railway.
- **Frontend:** deploy Next.js (Vercel/Railway) dan set `NEXT_PUBLIC_API_URL` ke URL backend (mis. `https://rasyaproduction.up.railway.app` atau subdomain raspro.co.id).
