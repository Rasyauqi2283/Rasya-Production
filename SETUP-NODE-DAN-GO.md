# Pasang Node.js dan Go di Windows — Per Langkah

Panduan ini untuk **Windows 10/11**. Pilih salah satu: **A (Winget)** atau **B (Manual)**.

---

## Opsi A: Pakai Winget (paling cepat)

Winget sudah terpasang di PC Anda. Buka **PowerShell atau Terminal** sebagai **pengguna biasa** (bukan Run as Administrator).

### 1. Pasang Node.js LTS

Jalankan:

```powershell
winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
```

- Jika diminta, terima license/agreement.
- Tunggu sampai selesai. Jika sudah pernah terpasang, winget akan memberi tahu.

### 2. Pasang Go

Jalankan:

```powershell
winget install GoLang.Go --accept-package-agreements --accept-source-agreements
```

- Tunggu sampai selesai.

### 3. Restart terminal

Tutup semua jendela PowerShell/CMD/Terminal, lalu buka lagi. Ini supaya PATH (Node dan Go) terbaca.

### 4. Cek instalasi

Di terminal baru:

```powershell
node --version
npm --version
go version
```

- `node --version` → contoh: `v20.x.x` atau `v22.x.x`
- `npm --version` → contoh: `10.x.x`
- `go version` → contoh: `go version go1.22.x windows/amd64`

Jika ketiga perintah menampilkan versi, instalasi berhasil.

---

## Opsi B: Manual (download dari situs resmi)

### 1. Node.js

1. Buka: **https://nodejs.org**
2. Download **LTS** (tombol hijau, mis. "24.x.x LTS").
3. Jalankan file **.msi** yang didownload.
4. Next → terima license → Next. Biarkan opsi default (termasuk "Add to PATH") dicentang.
5. Install → Finish.
6. **Tutup lalu buka lagi** terminal.

Cek:

```powershell
node --version
npm --version
```

### 2. Go

1. Buka: **https://go.dev/dl**
2. Download installer Windows (mis. **go1.22.x.windows-amd64.msi**).
3. Jalankan file **.msi**.
4. Next → terima license → Next. Biarkan path default (`C:\Program Files\Go`).
5. Install → Finish.
6. **Tutup lalu buka lagi** terminal.

Cek:

```powershell
go version
```

---

## Setelah keduanya terpasang

1. **Frontend (Next.js):**
   ```powershell
   cd "c:\Users\USER\Downloads\Rasya\rasya-production\frontend"
   npm install
   npm run dev
   ```
   Buka browser: http://localhost:3000

2. **Backend (Go API):**
   ```powershell
   cd "c:\Users\USER\Downloads\Rasya\rasya-production\backend\go"
   go mod tidy
   go run ./cmd/api
   ```
   API: http://localhost:8080 dan http://localhost:8080/health

---

## Troubleshooting

- **"node" / "go" tidak dikenali**  
  Tutup semua terminal, buka lagi. Jika masih belum bisa, restart PC sekali.

- **Winget gagal atau tidak ada**  
  Pakai **Opsi B** (download manual dari nodejs.org dan go.dev).

- **Permission / Administrator**  
  Untuk winget, biasanya tidak perlu Run as Administrator. Jika diminta UAC, boleh klik Yes.
