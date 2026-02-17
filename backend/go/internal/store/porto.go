package store

import (
	"context"
	"encoding/json"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PortoItem is one portfolio entry (project selesai kontrak).
type PortoItem struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Tag         string    `json:"tag"`
	Description string    `json:"description"`
	ImageURL    string    `json:"image_url"` // relative path or full URL
	LinkURL     string    `json:"link_url"`  // URL website/laman (klik card = buka link)
	Layanan     []string  `json:"layanan"`   // layanan jasa (multiple)
	CreatedAt   time.Time `json:"created_at"`
}

// PortoStore holds portfolio items in memory or PostgreSQL (when pool is set).
type PortoStore struct {
	mu    sync.RWMutex
	items []PortoItem
	pool  *pgxpool.Pool
}

// NewPortoStore returns a new in-memory porto store.
func NewPortoStore() *PortoStore {
	return &PortoStore{items: make([]PortoItem, 0)}
}

// NewPortoStoreFromDB returns a porto store backed by PostgreSQL.
func NewPortoStoreFromDB(pool *pgxpool.Pool) *PortoStore {
	return &PortoStore{pool: pool}
}

// Add appends a porto item. layanan can be nil. linkURL is optional (website/laman).
func (p *PortoStore) Add(title, tag, desc, imageURL, linkURL string, layanan []string) PortoItem {
	if layanan == nil {
		layanan = []string{}
	}
	if p.pool != nil {
		return p.addDB(title, tag, desc, imageURL, strings.TrimSpace(linkURL), layanan)
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	item := PortoItem{
		ID:          generateID(),
		Title:       title,
		Tag:         tag,
		Description: desc,
		ImageURL:    imageURL,
		LinkURL:     strings.TrimSpace(linkURL),
		Layanan:     layanan,
		CreatedAt:   time.Now().UTC(),
	}
	p.items = append(p.items, item)
	return item
}

func (p *PortoStore) addDB(title, tag, desc, imageURL, linkURL string, layanan []string) PortoItem {
	item := PortoItem{
		ID:          generateID(),
		Title:       title,
		Tag:         tag,
		Description: desc,
		ImageURL:    imageURL,
		LinkURL:     linkURL,
		Layanan:     layanan,
		CreatedAt:   time.Now().UTC(),
	}
	jb, _ := json.Marshal(item.Layanan)
	ctx := context.Background()
	_, err := p.pool.Exec(ctx, `INSERT INTO porto (id, title, tag, description, image_url, link_url, layanan, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		item.ID, item.Title, item.Tag, item.Description, item.ImageURL, item.LinkURL, jb, item.CreatedAt)
	if err != nil {
		return PortoItem{}
	}
	return item
}

// List returns all porto items (newest first).
func (p *PortoStore) List() []PortoItem {
	if p.pool != nil {
		return p.listDB()
	}
	p.mu.RLock()
	defer p.mu.RUnlock()
	out := make([]PortoItem, len(p.items))
	copy(out, p.items)
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return out
}

func (p *PortoStore) listDB() []PortoItem {
	ctx := context.Background()
	rows, err := p.pool.Query(ctx, `SELECT id, title, tag, description, image_url, link_url, layanan, created_at FROM porto ORDER BY created_at DESC`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []PortoItem
	for rows.Next() {
		var item PortoItem
		var layananJSON []byte
		if err := rows.Scan(&item.ID, &item.Title, &item.Tag, &item.Description, &item.ImageURL, &item.LinkURL, &layananJSON, &item.CreatedAt); err != nil {
			return out
		}
		_ = json.Unmarshal(layananJSON, &item.Layanan)
		if item.Layanan == nil {
			item.Layanan = []string{}
		}
		out = append(out, item)
	}
	return out
}

// SeedIfEmpty inserts 4 default portfolio items when the store is empty (for demo/trust).
func (p *PortoStore) SeedIfEmpty() {
	if p.pool != nil {
		p.seedIfEmptyDB()
		return
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	if len(p.items) > 0 {
		return
	}
	seeds := []struct {
		title, tag, desc, imageURL, linkURL string
		layanan                             []string
	}{
		{
			"Website Company Profile — F&B",
			"Web & Digital",
			"Website one-page company profile untuk brand F&B: hero, tentang, menu unggulan, galeri, dan kontak. Desain bersih dan responsif. Stack: Frontend React/Next.js; backend opsional (API form kontak); database PostgreSQL/Supabase bila ada form; launch Vercel atau Netlify.",
			"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=450&fit=crop",
			"",
			[]string{"Web & Digital", "UI Designer"},
		},
		{
			"Branding & Social Asset Pack",
			"Design",
			"Paket branding untuk startup: logo, palet warna, template feed Instagram dan story. Konsisten di semua touchpoint dan siap dipakai tim marketing.",
			"https://images.unsplash.com/photo-1561070791-2526d31fe5b6?w=800&h=450&fit=crop",
			"",
			[]string{"Design", "Illustrator"},
		},
		{
			"Landing Page Kampanye Produk",
			"Web & Digital",
			"Landing page kampanye: headline, benefit, CTA, form lead. Fokus konversi. Stack: Frontend React/Next.js; backend API form + integrasi CRM; database PostgreSQL/Supabase untuk simpan lead; launch Vercel/Netlify, siap integrasi CRM.",
			"https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
			"",
			[]string{"Web & Digital", "Landing Page Designer"},
		},
		{
			"Video Promo & Motion Teaser",
			"Konten & Kreatif",
			"Video promo 60 detik dan motion teaser untuk peluncuran layanan. Editing, color grading, dan motion graphic sesuai brief brand.",
			"https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=450&fit=crop",
			"",
			[]string{"Video Editor", "Motion Designer"},
		},
	}
	for _, s := range seeds {
		item := PortoItem{
			ID:          generateID(),
			Title:       s.title,
			Tag:         s.tag,
			Description: s.desc,
			ImageURL:    s.imageURL,
			LinkURL:     s.linkURL,
			Layanan:     s.layanan,
			CreatedAt:   time.Now().UTC(),
		}
		p.items = append(p.items, item)
	}
}

func (p *PortoStore) seedIfEmptyDB() {
	ctx := context.Background()
	var n int
	if err := p.pool.QueryRow(ctx, `SELECT COUNT(*) FROM porto`).Scan(&n); err != nil || n > 0 {
		return
	}
	seeds := []struct {
		title, tag, desc, imageURL, linkURL string
		layanan                             []string
	}{
		{
			"Website Company Profile — F&B",
			"Web & Digital",
			"Website one-page company profile untuk brand F&B: hero, tentang, menu unggulan, galeri, dan kontak. Desain bersih dan responsif. Stack: Frontend React/Next.js; backend opsional (API form kontak); database PostgreSQL/Supabase bila ada form; launch Vercel atau Netlify.",
			"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=450&fit=crop",
			"",
			[]string{"Web & Digital", "UI Designer"},
		},
		{
			"Branding & Social Asset Pack",
			"Design",
			"Paket branding untuk startup: logo, palet warna, template feed Instagram dan story. Konsisten di semua touchpoint dan siap dipakai tim marketing.",
			"https://images.unsplash.com/photo-1561070791-2526d31fe5b6?w=800&h=450&fit=crop",
			"",
			[]string{"Design", "Illustrator"},
		},
		{
			"Landing Page Kampanye Produk",
			"Web & Digital",
			"Landing page kampanye: headline, benefit, CTA, form lead. Fokus konversi. Stack: Frontend React/Next.js; backend API form + integrasi CRM; database PostgreSQL/Supabase untuk simpan lead; launch Vercel/Netlify, siap integrasi CRM.",
			"https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
			"",
			[]string{"Web & Digital", "Landing Page Designer"},
		},
		{
			"Video Promo & Motion Teaser",
			"Konten & Kreatif",
			"Video promo 60 detik dan motion teaser untuk peluncuran layanan. Editing, color grading, dan motion graphic sesuai brief brand.",
			"https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=450&fit=crop",
			"",
			[]string{"Video Editor", "Motion Designer"},
		},
	}
	for _, s := range seeds {
		item := PortoItem{
			ID:          generateID(),
			Title:       s.title,
			Tag:         s.tag,
			Description: s.desc,
			ImageURL:    s.imageURL,
			LinkURL:     s.linkURL,
			Layanan:     s.layanan,
			CreatedAt:   time.Now().UTC(),
		}
		jb, _ := json.Marshal(item.Layanan)
		_, _ = p.pool.Exec(ctx, `INSERT INTO porto (id, title, tag, description, image_url, link_url, layanan, created_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
			item.ID, item.Title, item.Tag, item.Description, item.ImageURL, item.LinkURL, jb, item.CreatedAt)
	}
}

// Delete removes a porto item by ID.
func (p *PortoStore) Delete(id string) bool {
	if p.pool != nil {
		ctx := context.Background()
		ct, err := p.pool.Exec(ctx, `DELETE FROM porto WHERE id = $1`, id)
		if err != nil {
			return false
		}
		return ct.RowsAffected() > 0
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	for i, item := range p.items {
		if item.ID == id {
			p.items = append(p.items[:i], p.items[i+1:]...)
			return true
		}
	}
	return false
}
