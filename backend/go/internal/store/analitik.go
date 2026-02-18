package store

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// AnalitikCategory matches overlay: web_digital, design, konten_kreatif, lain_lain
const (
	AnalitikCatWebDigital   = "web_digital"
	AnalitikCatDesign       = "design"
	AnalitikCatKontenKreatif = "konten_kreatif"
	AnalitikCatLainLain     = "lain_lain"
)

var AnalitikCategories = []string{AnalitikCatWebDigital, AnalitikCatDesign, AnalitikCatKontenKreatif, AnalitikCatLainLain}

// AnalitikItem is one item in Dashboard Analitik (nama + penjelasan, no rating).
type AnalitikItem struct {
	ID        string    `json:"id"`
	Category  string    `json:"category"`
	Name      string    `json:"name"`
	Desc      string    `json:"desc"`
	Order     int       `json:"order"`
	Closed    bool      `json:"closed"`
	CreatedAt time.Time `json:"created_at"`
}

// AnalitikStore holds analitik items in memory or PostgreSQL.
type AnalitikStore struct {
	mu   sync.RWMutex
	list []AnalitikItem
	pool *pgxpool.Pool
}

func NewAnalitikStore() *AnalitikStore {
	return &AnalitikStore{list: []AnalitikItem{}}
}

func NewAnalitikStoreFromDB(pool *pgxpool.Pool) *AnalitikStore {
	return &AnalitikStore{pool: pool, list: []AnalitikItem{}}
}

// List returns only non-closed items, grouped by category (for public overlay).
func (s *AnalitikStore) List() map[string][]AnalitikItem {
	if s.pool != nil {
		return s.listByCategoryDB(false)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make(map[string][]AnalitikItem)
	for _, it := range s.list {
		if it.Closed {
			continue
		}
		out[it.Category] = append(out[it.Category], it)
	}
	return out
}

// ListAll returns all items for admin (including closed).
func (s *AnalitikStore) ListAll() []AnalitikItem {
	if s.pool != nil {
		return s.listAllDB()
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]AnalitikItem, len(s.list))
	copy(out, s.list)
	return out
}

func (s *AnalitikStore) listAllDB() []AnalitikItem {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `SELECT id, category, name, "desc", "order", closed, created_at FROM analitik_items ORDER BY "order", created_at`)
	if err != nil {
		log.Printf("[analitik] list all: %v", err)
		return nil
	}
	defer rows.Close()
	var out []AnalitikItem
	for rows.Next() {
		var it AnalitikItem
		if err := rows.Scan(&it.ID, &it.Category, &it.Name, &it.Desc, &it.Order, &it.Closed, &it.CreatedAt); err != nil {
			continue
		}
		out = append(out, it)
	}
	return out
}

func (s *AnalitikStore) listByCategoryDB(includeClosed bool) map[string][]AnalitikItem {
	ctx := context.Background()
	q := `SELECT id, category, name, "desc", "order", closed, created_at FROM analitik_items ORDER BY "order", created_at`
	if !includeClosed {
		q = `SELECT id, category, name, "desc", "order", closed, created_at FROM analitik_items WHERE closed = false ORDER BY "order", created_at`
	}
	rows, err := s.pool.Query(ctx, q)
	if err != nil {
		log.Printf("[analitik] list: %v", err)
		return nil
	}
	defer rows.Close()
	out := make(map[string][]AnalitikItem)
	for rows.Next() {
		var it AnalitikItem
		if err := rows.Scan(&it.ID, &it.Category, &it.Name, &it.Desc, &it.Order, &it.Closed, &it.CreatedAt); err != nil {
			continue
		}
		out[it.Category] = append(out[it.Category], it)
	}
	return out
}

func (s *AnalitikStore) nextOrderDB() int {
	ctx := context.Background()
	var n int
	_ = s.pool.QueryRow(ctx, `SELECT COALESCE(MAX("order"),0)+1 FROM analitik_items`).Scan(&n)
	return n
}

// Add inserts a new item.
func (s *AnalitikStore) Add(category, name, desc string) (AnalitikItem, bool) {
	if category == "" {
		category = AnalitikCatLainLain
	}
	id := generateID()
	it := AnalitikItem{
		ID:        id,
		Category:  category,
		Name:      name,
		Desc:      desc,
		Order:     0,
		Closed:    false,
		CreatedAt: time.Now().UTC(),
	}
	if s.pool != nil {
		it.Order = s.nextOrderDB()
		_, err := s.pool.Exec(context.Background(),
			`INSERT INTO analitik_items (id, category, name, "desc", "order", closed, created_at) VALUES ($1,$2,$3,$4,$5,false,NOW())`,
			it.ID, it.Category, it.Name, it.Desc, it.Order)
		if err != nil {
			log.Printf("[analitik] add: %v", err)
			return AnalitikItem{}, false
		}
		return it, true
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, x := range s.list {
		if x.Order >= it.Order {
			it.Order = x.Order + 1
		}
	}
	s.list = append(s.list, it)
	return it, true
}

// Update updates name and desc (and optionally category).
func (s *AnalitikStore) Update(id, category, name, desc string) bool {
	if s.pool != nil {
		ctx := context.Background()
		ct, err := s.pool.Exec(ctx,
			`UPDATE analitik_items SET category = $2, name = $3, "desc" = $4 WHERE id = $1`,
			id, category, name, desc)
		if err != nil {
			log.Printf("[analitik] update: %v", err)
			return false
		}
		return ct.RowsAffected() > 0
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.list {
		if s.list[i].ID == id {
			s.list[i].Category = category
			s.list[i].Name = name
			s.list[i].Desc = desc
			return true
		}
	}
	return false
}

// SetClosed sets closed flag.
func (s *AnalitikStore) SetClosed(id string, closed bool) bool {
	if s.pool != nil {
		ctx := context.Background()
		ct, err := s.pool.Exec(ctx, `UPDATE analitik_items SET closed = $2 WHERE id = $1`, id, closed)
		if err != nil {
			log.Printf("[analitik] setClosed: %v", err)
			return false
		}
		return ct.RowsAffected() > 0
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.list {
		if s.list[i].ID == id {
			s.list[i].Closed = closed
			return true
		}
	}
	return false
}

// Delete removes an item.
func (s *AnalitikStore) Delete(id string) bool {
	if s.pool != nil {
		ctx := context.Background()
		ct, err := s.pool.Exec(ctx, `DELETE FROM analitik_items WHERE id = $1`, id)
		if err != nil {
			log.Printf("[analitik] delete: %v", err)
			return false
		}
		return ct.RowsAffected() > 0
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.list {
		if s.list[i].ID == id {
			s.list = append(s.list[:i], s.list[i+1:]...)
			return true
		}
	}
	return false
}

// normalizeCategory maps tag-like names to store category.
func NormalizeAnalitikCategory(c string) string {
	switch c {
	case "Web & Digital", "web_digital":
		return AnalitikCatWebDigital
	case "Design", "design":
		return AnalitikCatDesign
	case "Konten & Kreatif", "konten_kreatif":
		return AnalitikCatKontenKreatif
	default:
		return AnalitikCatLainLain
	}
}
