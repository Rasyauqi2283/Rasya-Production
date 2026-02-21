# Perbaikan ChunkLoadError (Loading chunk app/layout failed)

## Langkah 1: Hapus cache build dan jalankan ulang

1. **Stop** dev server (Ctrl+C di terminal yang menjalankan `npm run dev`).
2. Hapus folder **`.next`** di dalam folder `frontend`:
   - Windows (PowerShell): `Remove-Item -Recurse -Force .next`
   - Atau hapus manual folder `.next` lewat File Explorer.
3. Jalankan lagi: `npm run dev`.
4. Buka lagi `http://localhost:3000/layanan-preview/fitur` (atau refresh dengan hard reload: Ctrl+Shift+R).

## Jika masih error

- Pastikan tidak ada antivirus yang memblok atau memindai folder `frontend` saat dev server jalan.
- Coba tutup aplikasi lain yang berat; kadang timeout terjadi karena CPU/disk sibuk.
- Next.js 14.2.35 disebut “outdated” — kalau mau, nanti bisa upgrade Next.js (lakukan di branch terpisah dan tes dulu).
