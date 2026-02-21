# Scripts

## preview-config

Cek sinkronisasi daftar layanan preview dengan `lib/serviceI18n.ts`.

```bash
npm run preview-config
```

- Membaca slug dari `SERVICE_TITLE_TO_SLUG` (serviceI18n).
- Membandingkan dengan `SERVICE_PREVIEW_META` di `lib/layananPreviewConfig.ts`.
- Jika ada layanan baru di serviceI18n yang belum punya entry di config, script akan mencetak baris yang bisa Anda salin ke `SERVICE_PREVIEW_META`.
- Exit code 1 jika ada slug yang belum ada di config (supaya bisa dipakai di CI).

**Saat menambah layanan baru:** tambah di `serviceI18n.ts` → jalankan `npm run preview-config` → salin baris yang dicetak ke `layananPreviewConfig.ts` (SERVICE_PREVIEW_META).
