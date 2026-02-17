-- Ganti teks "(harga awal)" di price_awal menjadi kosong,
-- sehingga tampil di UI sebagai "Mulai dari &lt;nilai&gt;" (ditangani frontend).
-- Jalankan: psql -U &lt;user&gt; -d raspro -f update-price-awal-to-mulai-dari.sql

UPDATE services
SET price_awal = TRIM(REPLACE(price_awal, ' (harga awal)', ''))
WHERE price_awal LIKE '%(harga awal)%';
