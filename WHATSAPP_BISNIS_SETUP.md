# WhatsApp Bisnis — pesan bot / auto-reply (Greeting message)

Agar pengunjung yang klik "Hubungi via WhatsApp Bisnis" dari website langsung mendapat **balasan otomatis** (seperti bot layanan), aktifkan **Greeting message** di WhatsApp Business App.

## Langkah (WhatsApp Business App di HP)

1. Buka **WhatsApp Business** (bukan WhatsApp biasa).
2. **Settings** (ikon gerigi) → **Business tools** → **Away message** atau **Greeting message**.
3. **Greeting message**: nyalakan dan isi teks, misalnya:
   - *"Halo! Terima kasih sudah menghubungi Rasya Production. Untuk layanan: desain, konten, dan digital—silahkan sebutkan kebutuhan Anda. Saya akan membalas segera."*
4. Greeting message biasanya dikirim otomatis saat **pesan pertama** dari pengunjung (setelah mereka kirim pesan dari link website).

## Di website

- Link kontak pakai **wa.me** dengan parameter `?text=...` sehingga pesan sapaan sudah terisi.
- Nomor WhatsApp Bisnis diatur lewat env: **`NEXT_PUBLIC_WHATSAPP_NUMBER`** (format: `628xxxxxxxxxx`).
- File: `frontend/.env.example` dan `frontend/.env.local`. Isi nomor asli lalu rebuild/restart dev.

## Opsi lanjutan (bot penuh)

Untuk auto-reply dari server (tanpa buka HP): pakai **WhatsApp Business API** (Meta) lewat provider (Twilio, 360dialog, dll.). Perlu verifikasi bisnis dan biaya. Untuk kebanyakan kasus, Greeting message di atas sudah cukup.
