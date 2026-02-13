package store

import (
	"context"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Service is one layanan item for the public Layanan section.
// Tag: Design | Web & Digital | Konten & Kreatif | Lain-lain
// Closed: true = layanan ditutup sementara (tidak tampil di halaman utama/order/porto), bisa dibuka lagi.
// DiscountPercent: 0 = tidak diskon; 1-100 = diskon %. PriceAfterDiscount: teks harga setelah diskon (ditampilkan di kartu).
type Service struct {
	ID                 string    `json:"id"`
	Title              string    `json:"title"`
	Tag                string    `json:"tag"`
	Desc               string    `json:"desc"`
	PriceAwal          string    `json:"price_awal"`
	DiscountPercent    int       `json:"discount_percent"`    // 0 = tidak ada diskon
	PriceAfterDiscount string    `json:"price_after_discount"` // e.g. "360 ribu" saat diskon 10%
	Order              int       `json:"order"`
	Closed             bool      `json:"closed"`
	CreatedAt          time.Time `json:"created_at"`
}

// ServiceTags are the allowed tag values (untuk filter dan grouping).
var ServiceTags = []string{"Design", "Web & Digital", "Konten & Kreatif", "Lain-lain"}

// ServiceStore holds services in memory or PostgreSQL (when pool is set).
type ServiceStore struct {
	mu        sync.RWMutex
	items     []Service
	nextOrder int
	pool      *pgxpool.Pool
}

// SeedService is title + tag + desc + price for initial seed (teks narasi seperti sebelumnya).
type SeedService struct {
	Title     string
	Tag       string
	Desc      string
	PriceAwal string
}

// seedServices: daftar jasa dengan deskripsi naratif dan harga awal (bisa diedit dari Kelola Layanan).
var seedServices = []SeedService{
	// Design
	{"UI Designer", "Design", "UI Designer adalah perancang antarmuka pengguna yang fokus pada tampilan dan interaksi digital. Apa yang bisa saya bantu? Saya bisa mengerjakan desain mockup, wireframe, design system, dan UI untuk web maupun aplikasi agar tampil rapi dan mudah digunakan.", "400 ribu (harga awal)"},
	{"Video Editor", "Design", "Video Editor mengolah footage menjadi konten siap tayang. Apa yang bisa saya bantu? Saya bisa mengerjakan cutting, color grading, subtitle, motion text, dan packaging video untuk sosial media, YouTube, atau presentasi.", "500 ribu (harga awal)"},
	{"Motion Designer", "Design", "Motion Designer membuat elemen visual bergerak (animasi) untuk video, web, atau presentasi. Apa yang bisa saya bantu? Saya bisa mengerjakan motion graphic, kinetic typography, dan animasi singkat untuk branding atau kampanye.", "600 ribu (harga awal)"},
	{"Illustrator", "Design", "Illustrator membuat ilustrasi orisinal untuk berbagai kebutuhan. Apa yang bisa saya bantu? Saya bisa mengerjakan ilustrasi karakter, ikon, infografis, dan artwork untuk konten digital atau cetak.", "500 ribu (harga awal)"},
	{"Editor / Proofreader", "Design", "Editor dan Proofreader memastikan naskah rapi, konsisten, dan bebas typo. Apa yang bisa saya bantu? Saya bisa mengerjakan penyuntingan bahasa Indonesia/Inggris, penyeragaman istilah, dan pengecekan akhir untuk dokumen, artikel, atau script.", "300 ribu (harga awal)"},
	{"UX Designer", "Design", "UX Designer fokus pada pengalaman pengguna: riset, alur pakai, dan usability. Apa yang bisa saya bantu? Saya bisa mengerjakan user flow, wireframe, usability testing, dan rekomendasi perbaikan agar produk digital nyaman dipakai.", "500 ribu (harga awal)"},
	{"Product Designer", "Design", "Product Designer merancang produk digital dari ide sampai eksekusi (UI/UX dan iterasi). Apa yang bisa saya bantu? Saya bisa mengerjakan discovery, konsep fitur, desain layar, dan koordinasi dengan development.", "600 ribu (harga awal)"},
	{"Landing Page Designer", "Design", "Landing Page Designer merancang halaman tunggal yang fokus konversi. Apa yang bisa saya bantu? Saya bisa mengerjakan layout, CTA, dan visual untuk kampanye, produk, atau event agar visitor mudah mengambil aksi.", "450 ribu (harga awal)"},
	{"Modelling", "Design", "Modelling untuk konten visual: foto produk, lookbook, atau konten branding. Apa yang bisa saya bantu? Saya bisa berperan sebagai talent untuk pemotretan atau video singkat sesuai brief dan konsep yang disepakati.", "Sesuai brief (harga awal)"},
	// Web & Digital
	{"Web & Digital", "Web & Digital", "Pembangunan website dan aplikasi web dengan stack modern. Apa yang bisa saya bantu? Saya bisa mengerjakan landing page, website company profile, dan aplikasi web dengan performa tinggi dan tampilan rapi.", "1,5 jt (harga awal)"},
	{"WordPress Developer", "Web & Digital", "WordPress Developer membangun dan mengustomisasi situs berbasis WordPress. Apa yang bisa saya bantu? Saya bisa mengerjakan setup tema, plugin, custom layout, dan integrasi konten agar situs siap dipakai klien.", "800 ribu (harga awal)"},
	{"Fullstack Developer", "Web & Digital", "Fullstack Developer mengerjakan frontend dan backend dalam satu proyek. Apa yang bisa saya bantu? Saya bisa mengerjakan database, API, dan antarmuka pengguna untuk web app dari awal sampai deploy.", "2 jt (harga awal)"},
	{"Backend Developer", "Web & Digital", "Backend Developer membangun server, API, dan logika di belakang layar. Apa yang bisa saya bantu? Saya bisa mengerjakan REST/API, database, autentikasi, dan integrasi pihak ketiga sesuai kebutuhan proyek.", "1,5 jt (harga awal)"},
	{"Frontend Developer", "Web & Digital", "Frontend Developer fokus pada tampilan dan interaksi di browser. Apa yang bisa saya bantu? Saya bisa mengerjakan markup, styling, dan logic di sisi client agar website atau aplikasi web responsif dan aksesibel.", "1,2 jt (harga awal)"},
	{"Mobile App Developer (Android)", "Web & Digital", "Pengembangan aplikasi Android dari konsep sampai publish. Apa yang bisa saya bantu? Saya bisa mengerjakan UI, logic, dan integrasi API untuk aplikasi Android yang siap dipakai atau diunggah ke Play Store.", "2,5 jt (harga awal)"},
	{"Mobile App Developer (iOS)", "Web & Digital", "Pengembangan aplikasi iOS dari konsep sampai publish. Apa yang bisa saya bantu? Saya bisa mengerjakan UI, logic, dan integrasi untuk aplikasi iPhone/iPad yang siap dipakai atau diunggah ke App Store.", "2,5 jt (harga awal)"},
	// Konten & Kreatif
	{"Content Writer", "Konten & Kreatif", "Content Writer menghasilkan tulisan untuk web, blog, dan media. Apa yang bisa saya bantu? Saya bisa mengerjakan artikel, copy landing page, script video, dan konten yang selaras dengan brand dan SEO.", "350 ribu (harga awal)"},
	{"Copywriter", "Konten & Kreatif", "Copywriter fokus pada teks yang menjual dan mengajak aksi. Apa yang bisa saya bantu? Saya bisa mengerjakan headline, CTA, deskripsi produk, dan kampanye iklan yang jelas dan persuasif.", "400 ribu (harga awal)"},
	{"Social Media Manager", "Konten & Kreatif", "Social Media Manager mengelola konten dan interaksi di platform sosial. Apa yang bisa saya bantu? Saya bisa mengerjakan perencanaan konten, copy caption, dan koordinasi posting untuk menjaga konsistensi brand.", "500 ribu (harga awal)"},
	{"Technical Writer", "Konten & Kreatif", "Technical Writer membuat dokumentasi yang mudah dipahami untuk produk atau layanan teknis. Apa yang bisa saya bantu? Saya bisa mengerjakan user guide, dokumentasi API, dan artikel how-to yang terstruktur.", "400 ribu (harga awal)"},
	{"SEO Specialist", "Konten & Kreatif", "SEO Specialist mengoptimalkan konten dan struktur agar mudah ditemukan di mesin pencari. Apa yang bisa saya bantu? Saya bisa mengerjakan riset kata kunci, optimasi on-page, dan rekomendasi konten untuk peringkat lebih baik.", "500 ribu (harga awal)"},
	{"Email Marketer", "Konten & Kreatif", "Email Marketer mengelola kampanye dan nurturance lewat email. Apa yang bisa saya bantu? Saya bisa mengerjakan copy email, segmentasi, dan strategi drip atau newsletter agar engagement terjaga.", "450 ribu (harga awal)"},
	{"Community Manager", "Konten & Kreatif", "Community Manager menjaga interaksi dan keterlibatan di komunitas brand. Apa yang bisa saya bantu? Saya bisa mengerjakan moderasi, jadwal konten, dan engagement strategy di forum atau grup.", "500 ribu (harga awal)"},
	{"Brand Strategist", "Konten & Kreatif", "Brand Strategist merancang posisi dan narasi brand. Apa yang bisa saya bantu? Saya bisa mengerjakan positioning, tone of voice, dan panduan brand agar komunikasi konsisten di semua saluran.", "600 ribu (harga awal)"},
	{"Transcriber", "Konten & Kreatif", "Transcriber mengubah audio atau video menjadi naskah tertulis. Apa yang bisa saya bantu? Saya bisa mengerjakan transkripsi wawancara, podcast, atau meeting dengan format rapi dan siap dipakai.", "300 ribu (harga awal)"},
	{"Localization Specialist", "Konten & Kreatif", "Localization Specialist mengadaptasi konten ke bahasa dan konteks lokal. Apa yang bisa saya bantu? Saya bisa mengerjakan terjemahan, adaptasi budaya, dan penyesuaian konten untuk pasar sasaran.", "400 ribu (harga awal)"},
	// Lain-lain
	{"Photographer", "Lain-lain", "Photographer menghasilkan foto untuk kebutuhan konten atau branding. Apa yang bisa saya bantu? Saya bisa mengerjakan pemotretan produk, dokumentasi event, atau konten visual untuk media sosial sesuai konsep.", "Sesuai paket (harga awal)"},
	{"Videographer", "Lain-lain", "Videographer menangkap footage untuk iklan, dokumentasi, atau konten. Apa yang bisa saya bantu? Saya bisa mengerjakan shooting, pengambilan angle, dan koordinasi dengan editor untuk hasil siap pakai.", "Sesuai paket (harga awal)"},
	{"Data Analyst", "Lain-lain", "Data Analyst mengolah dan menyajikan data untuk keputusan bisnis. Apa yang bisa saya bantu? Saya bisa mengerjakan pengumpulan data, analisis, visualisasi, dan laporan insight yang mudah dipahami.", "800 ribu (harga awal)"},
	{"Project Manager Digital", "Lain-lain", "Project Manager Digital mengoordinasi proyek digital dari planning sampai delivery. Apa yang bisa saya bantu? Saya bisa mengerjakan jadwal, task tracking, komunikasi tim, dan memastikan scope dan deadline tercapai.", "700 ribu (harga awal)"},
	{"Virtual Assistant", "Lain-lain", "Virtual Assistant membantu tugas administratif dan operasional secara daring. Apa yang bisa saya bantu? Saya bisa mengerjakan jadwal, email, riset, dan tugas rutin lainnya agar kamu fokus ke prioritas utama.", "400 ribu (harga awal)"},
}

// SeedIfEmpty populates the store with default jasa (sama dengan JasaLanes) bila masih kosong. Sekali jalan, setelah itu kelola dari admin.
// Setiap item dapat ID unik (indeks + generateID) agar checkbox dan Tutup/Buka per item tidak bentrok.
func (s *ServiceStore) SeedIfEmpty() {
	if s.pool != nil {
		s.seedIfEmptyDB()
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.items) > 0 {
		return
	}
	baseID := generateID()
	for i, seed := range seedServices {
		s.nextOrder++
		s.items = append(s.items, Service{
			ID:                 fmt.Sprintf("%s-%d", baseID, i),
			Title:              seed.Title,
			Tag:                seed.Tag,
			Desc:               seed.Desc,
			PriceAwal:          seed.PriceAwal,
			DiscountPercent:    0,
			PriceAfterDiscount: "",
			Order:              s.nextOrder,
			Closed:             false,
			CreatedAt:          time.Now().UTC(),
		})
	}
}

func (s *ServiceStore) seedIfEmptyDB() {
	ctx := context.Background()
	var n int
	if err := s.pool.QueryRow(ctx, `SELECT COUNT(*) FROM services`).Scan(&n); err != nil {
		return // tabel belum ada atau error; migrate harus jalan dulu
	}
	if n > 0 {
		return // sudah ada data, tidak seed lagi
	}
	baseID := generateID()
	for i, seed := range seedServices {
		id := fmt.Sprintf("%s-%d", baseID, i)
		ord := i + 1
		_, err := s.pool.Exec(ctx, `INSERT INTO services (id, title, tag, "desc", price_awal, discount_percent, price_after_discount, "order", closed, created_at)
			VALUES ($1,$2,$3,$4,$5,0,'',$6,false,NOW())`,
			id, seed.Title, seed.Tag, seed.Desc, seed.PriceAwal, ord)
		if err != nil {
			log.Printf("[services] seed insert failed at %d: %v", i, err)
			return
		}
	}
	log.Printf("[services] seeded %d services (table was empty)", len(seedServices))
}

// NewServiceStore returns a new in-memory service store.
func NewServiceStore() *ServiceStore {
	return &ServiceStore{items: make([]Service, 0), nextOrder: 0}
}

// NewServiceStoreFromDB returns a service store backed by PostgreSQL.
func NewServiceStoreFromDB(pool *pgxpool.Pool) *ServiceStore {
	return &ServiceStore{pool: pool}
}

// Add appends a service. tag and priceAwal can be empty (tag defaults to "Lain-lain" if not in ServiceTags).
func (s *ServiceStore) Add(title, tag, desc, priceAwal string) Service {
	tag = strings.TrimSpace(tag)
	if tag == "" {
		tag = "Lain-lain"
	}
	if s.pool != nil {
		return s.addDB(title, tag, desc, priceAwal)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.nextOrder++
	svc := Service{
		ID:                 generateID(),
		Title:              title,
		Tag:                tag,
		Desc:               desc,
		PriceAwal:          priceAwal,
		DiscountPercent:    0,
		PriceAfterDiscount: "",
		Order:              s.nextOrder,
		Closed:             false,
		CreatedAt:          time.Now().UTC(),
	}
	s.items = append(s.items, svc)
	return svc
}

func (s *ServiceStore) addDB(title, tag, desc, priceAwal string) Service {
	ctx := context.Background()
	var nextOrd int
	_ = s.pool.QueryRow(ctx, `SELECT COALESCE(MAX("order"),0)+1 FROM services`).Scan(&nextOrd)
	svc := Service{
		ID:                 generateID(),
		Title:              title,
		Tag:                tag,
		Desc:               desc,
		PriceAwal:          priceAwal,
		DiscountPercent:    0,
		PriceAfterDiscount: "",
		Order:              nextOrd,
		Closed:             false,
		CreatedAt:          time.Now().UTC(),
	}
	_, err := s.pool.Exec(ctx, `INSERT INTO services (id, title, tag, "desc", price_awal, discount_percent, price_after_discount, "order", closed, created_at)
		VALUES ($1,$2,$3,$4,$5,0,'',$6,false,$7)`,
		svc.ID, svc.Title, svc.Tag, svc.Desc, svc.PriceAwal, svc.Order, svc.CreatedAt)
	if err != nil {
		return Service{}
	}
	return svc
}

// Update updates an existing service by ID. Semua field di-overwrite dari parameter. Returns (updated, true) or (zero, false).
func (s *ServiceStore) Update(id, title, tag, desc, priceAwal string, discountPercent int, priceAfterDiscount string) (Service, bool) {
	if s.pool != nil {
		return s.updateDB(id, title, tag, desc, priceAwal, discountPercent, priceAfterDiscount)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.items {
		if s.items[i].ID == id {
			if title != "" {
				s.items[i].Title = title
			}
			if tag != "" {
				s.items[i].Tag = tag
			}
			s.items[i].Desc = desc
			s.items[i].PriceAwal = priceAwal
			if discountPercent >= 0 && discountPercent <= 100 {
				s.items[i].DiscountPercent = discountPercent
			}
			s.items[i].PriceAfterDiscount = priceAfterDiscount
			return s.items[i], true
		}
	}
	return Service{}, false
}

func (s *ServiceStore) updateDB(id, title, tag, desc, priceAwal string, discountPercent int, priceAfterDiscount string) (Service, bool) {
	ctx := context.Background()
	_, err := s.pool.Exec(ctx, `UPDATE services SET
		title = CASE WHEN $2 <> '' THEN $2 ELSE title END,
		tag = CASE WHEN $3 <> '' THEN $3 ELSE tag END,
		"desc" = $4, price_awal = $5,
		discount_percent = CASE WHEN $6 BETWEEN 0 AND 100 THEN $6 ELSE discount_percent END,
		price_after_discount = $7
		WHERE id = $1`, id, title, tag, desc, priceAwal, discountPercent, priceAfterDiscount)
	if err != nil {
		return Service{}, false
	}
	var svc Service
	err = s.pool.QueryRow(ctx, `SELECT id, title, tag, "desc", price_awal, discount_percent, price_after_discount, "order", closed, created_at FROM services WHERE id = $1`, id).Scan(
		&svc.ID, &svc.Title, &svc.Tag, &svc.Desc, &svc.PriceAwal, &svc.DiscountPercent, &svc.PriceAfterDiscount, &svc.Order, &svc.Closed, &svc.CreatedAt)
	if err != nil {
		return Service{}, false
	}
	return svc, true
}

// List returns only active (non-closed) services, ordered by Order.
func (s *ServiceStore) List() []Service {
	if s.pool != nil {
		return s.listDB(false)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []Service
	for _, svc := range s.items {
		if !svc.Closed {
			out = append(out, svc)
		}
	}
	return out
}

// ListAll returns all services (including closed) for admin.
func (s *ServiceStore) ListAll() []Service {
	if s.pool != nil {
		return s.listDB(true)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]Service, len(s.items))
	copy(out, s.items)
	return out
}

func (s *ServiceStore) listDB(all bool) []Service {
	ctx := context.Background()
	q := `SELECT id, title, tag, "desc", price_awal, discount_percent, price_after_discount, "order", closed, created_at FROM services ORDER BY "order"`
	if !all {
		q = `SELECT id, title, tag, "desc", price_awal, discount_percent, price_after_discount, "order", closed, created_at FROM services WHERE closed = false ORDER BY "order"`
	}
	rows, err := s.pool.Query(ctx, q)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []Service
	for rows.Next() {
		var svc Service
		if err := rows.Scan(&svc.ID, &svc.Title, &svc.Tag, &svc.Desc, &svc.PriceAwal, &svc.DiscountPercent, &svc.PriceAfterDiscount, &svc.Order, &svc.Closed, &svc.CreatedAt); err != nil {
			return out
		}
		out = append(out, svc)
	}
	return out
}

// SetClosed sets the closed state of a service; returns true if found.
func (s *ServiceStore) SetClosed(id string, closed bool) bool {
	if s.pool != nil {
		ctx := context.Background()
		ct, err := s.pool.Exec(ctx, `UPDATE services SET closed = $2 WHERE id = $1`, id, closed)
		if err != nil {
			return false
		}
		return ct.RowsAffected() > 0
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.items {
		if s.items[i].ID == id {
			s.items[i].Closed = closed
			return true
		}
	}
	return false
}

// Delete removes a service by ID.
func (s *ServiceStore) Delete(id string) bool {
	if s.pool != nil {
		ctx := context.Background()
		ct, err := s.pool.Exec(ctx, `DELETE FROM services WHERE id = $1`, id)
		if err != nil {
			return false
		}
		return ct.RowsAffected() > 0
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, svc := range s.items {
		if svc.ID == id {
			s.items = append(s.items[:i], s.items[i+1:]...)
			return true
		}
	}
	return false
}
