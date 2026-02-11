# Upload rasya-production ke GitHub

Ikuti langkah ini **di folder `rasya-production`** (bukan folder Rasya). Pastikan Git sudah terpasang dan Anda sudah login GitHub.

## 1. Buat repo baru di GitHub

1. Buka **https://github.com/new**
2. **Repository name:** `rasya-production`
3. Pilih **Public**
4. **Jangan** centang "Add a README" (karena di folder sudah ada)
5. Klik **Create repository**

## 2. Di komputer — jalankan di terminal (Git Bash / CMD)

Buka terminal, lalu:

```bash
cd "c:\Users\USER\Downloads\Rasya\rasya-production"

git init
git config user.email "farrassyauqi22803@gmail.com"
git config user.name "Rasyauqi2283"

git add .
git status
git commit -m "Initial commit: Rasya Production website"

git branch -M main
git remote add origin https://github.com/Rasyauqi2283/rasya-production.git
git push -u origin main
```

Saat `git push`, jika diminta login, gunakan akun GitHub **Rasyauqi2283** (bisa pakai Personal Access Token jika pakai HTTPS).

## 3. Selesai

Repo akan tampil di: **https://github.com/Rasyauqi2283/rasya-production**

---

**Catatan:** File `.env` dan `uploads/` tidak ikut ter-commit (sudah ada di `.gitignore`). Setelah clone di tempat lain, salin `.env.example` jadi `.env` dan isi nilai rahasia.
