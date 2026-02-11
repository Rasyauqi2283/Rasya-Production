# Rasya Production

Website resmi **Rasya Production** — portfolio, layanan kreatif & digital, serta titik hubung untuk proyek dan donasi. Dibuat dan dikelola oleh Rasya selaku pemilik dan developer.

---

## Tentang project ini

Situs ini dibangun dengan **Go** sebagai backend (REST API) dan **Next.js** (React, TypeScript, Tailwind CSS) sebagai frontend. Fitur utama mencakup: daftar layanan, portofolio, donasi (transfer & GoPay/Midtrans), form order, admin panel, serta penandatanganan perjanjian (taper) dengan OTP.

---

## Menggunakan sebagai template

Apabila Anda ingin menggunakan desain dan struktur website ini sebagai **template** untuk website Anda sendiri, Anda dapat membayar **$15 USD** untuk memperoleh akses template dan panduan penggunaan. Template ini cocok untuk portfolio, layanan jasa, atau situs one-person/creative business dengan kebutuhan serupa.

Untuk pemesanan template, hubungi Rasya melalui kontak yang tertera di website atau repository ini.

---

## Arsitektur

| Bagian   | Stack |
|----------|--------|
| **Backend**  | Go (Chi router), REST API |
| **Frontend** | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |

---

## Struktur project

```
rasya-production/
├── frontend/     # Next.js, React, TypeScript, Tailwind
├── backend/     # Go API (cmd/api) + skrip pendukung
└── README.md
```

---

## Menjalankan di lingkungan lokal

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Backend

```bash
cd backend/go
go mod tidy
go run ./cmd/api
```

API berjalan di [http://localhost:8080](http://localhost:8080). Detail env dan endpoint lihat `backend/README.md`.

---

**© Rasya Production.** Template & kode tersedia untuk penggunaan berbayar sesuai penawaran di atas.
