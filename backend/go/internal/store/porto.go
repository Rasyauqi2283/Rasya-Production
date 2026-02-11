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
