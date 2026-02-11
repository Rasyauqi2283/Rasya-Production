# Rasya Production

**Digital HQ** — Website resmi Rasya Production.  
Domain target: `rasyaproduction.up.railway.app` atau `raspro.co.id`.

---

## Arsitektur

| Bagian    | Stack              | Keterangan                    |
|-----------|--------------------|-------------------------------|
| Frontend  | Next.js 14, React, TypeScript, Tailwind | Mockup → production-ready |
| Backend   | Go + JavaScript    | Go: API utama; JS: utilities / future services |

---

## Struktur Project

```
rasya-production/
├── frontend/          # Next.js 14 (App Router), TypeScript, Tailwind
├── backend/           # Go API + JavaScript layer
└── README.md
```

---

## Menjalankan Project

### Frontend (mockup)

```bash
cd rasya-production/frontend
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Backend

Lihat `backend/README.md` untuk instruksi Go dan JavaScript.

---

## Roadmap

- [x] **Step 1 (50%)** — Frontend mockup (landing, tentang, layanan, kontak)
- [x] **Step 2 (50%)** — Backend foundation (Go API + JS)
- [ ] Integrasi frontend ↔ backend
- [ ] Deploy (Railway / raspro.co.id)
