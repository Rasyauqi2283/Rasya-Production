package store

import (
	"context"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// OrderItem is one order layanan (sedang dikerjakan / antrian).
type OrderItem struct {
	ID                   string    `json:"id"`
	Layanan              string    `json:"layanan"`               // nama layanan (e.g. UI Designer)
	DeskripsiPekerjaan   string    `json:"deskripsi_pekerjaan"`   // apa yang akan dikerjakan
	Deadline             string    `json:"deadline"`              // deadline (YYYY-MM-DD atau teks)
	MulaiTanggal         string    `json:"mulai_tanggal"`          // mulai tanggal
	KesepakatanBriefUang string    `json:"kesepakatan_brief_uang"` // kesepakatan uang (brief)
	KapanUangMasuk       string    `json:"kapan_uang_masuk"`       // kapan uang masuk
	CreatedAt            time.Time `json:"created_at"`
}

// OrderStore holds order layanan in memory or PostgreSQL (when pool is set).
type OrderStore struct {
	mu    sync.RWMutex
	items []OrderItem
	pool  *pgxpool.Pool
}

// NewOrderStore returns a new in-memory order store.
func NewOrderStore() *OrderStore {
	return &OrderStore{items: make([]OrderItem, 0)}
}

// NewOrderStoreFromDB returns an order store backed by PostgreSQL.
func NewOrderStoreFromDB(pool *pgxpool.Pool) *OrderStore {
	return &OrderStore{pool: pool}
}

// Add appends an order.
func (o *OrderStore) Add(layanan, deskripsi, deadline, mulai, kesepakatan, uangMasuk string) OrderItem {
	if o.pool != nil {
		return o.addDB(layanan, deskripsi, deadline, mulai, kesepakatan, uangMasuk)
	}
	o.mu.Lock()
	defer o.mu.Unlock()
	item := OrderItem{
		ID:                   generateID(),
		Layanan:              layanan,
		DeskripsiPekerjaan:   deskripsi,
		Deadline:             deadline,
		MulaiTanggal:         mulai,
		KesepakatanBriefUang: kesepakatan,
		KapanUangMasuk:       uangMasuk,
		CreatedAt:            time.Now().UTC(),
	}
	o.items = append(o.items, item)
	return item
}

func (o *OrderStore) addDB(layanan, deskripsi, deadline, mulai, kesepakatan, uangMasuk string) OrderItem {
	item := OrderItem{
		ID:                   generateID(),
		Layanan:              layanan,
		DeskripsiPekerjaan:   deskripsi,
		Deadline:             deadline,
		MulaiTanggal:         mulai,
		KesepakatanBriefUang: kesepakatan,
		KapanUangMasuk:       uangMasuk,
		CreatedAt:            time.Now().UTC(),
	}
	ctx := context.Background()
	_, err := o.pool.Exec(ctx, `INSERT INTO orders (id, layanan, deskripsi_pekerjaan, deadline, mulai_tanggal, kesepakatan_brief_uang, kapan_uang_masuk, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		item.ID, item.Layanan, item.DeskripsiPekerjaan, item.Deadline, item.MulaiTanggal, item.KesepakatanBriefUang, item.KapanUangMasuk, item.CreatedAt)
	if err != nil {
		return OrderItem{}
	}
	return item
}

// List returns all orders (newest first).
func (o *OrderStore) List() []OrderItem {
	if o.pool != nil {
		return o.listDB()
	}
	o.mu.RLock()
	defer o.mu.RUnlock()
	out := make([]OrderItem, len(o.items))
	copy(out, o.items)
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return out
}

func (o *OrderStore) listDB() []OrderItem {
	ctx := context.Background()
	rows, err := o.pool.Query(ctx, `SELECT id, layanan, deskripsi_pekerjaan, deadline, mulai_tanggal, kesepakatan_brief_uang, kapan_uang_masuk, created_at FROM orders ORDER BY created_at DESC`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []OrderItem
	for rows.Next() {
		var item OrderItem
		if err := rows.Scan(&item.ID, &item.Layanan, &item.DeskripsiPekerjaan, &item.Deadline, &item.MulaiTanggal, &item.KesepakatanBriefUang, &item.KapanUangMasuk, &item.CreatedAt); err != nil {
			return out
		}
		out = append(out, item)
	}
	return out
}

// Delete removes an order by ID.
func (o *OrderStore) Delete(id string) bool {
	if o.pool != nil {
		ctx := context.Background()
		ct, err := o.pool.Exec(ctx, `DELETE FROM orders WHERE id = $1`, id)
		if err != nil {
			return false
		}
		return ct.RowsAffected() > 0
	}
	o.mu.Lock()
	defer o.mu.Unlock()
	for i, item := range o.items {
		if item.ID == id {
			o.items = append(o.items[:i], o.items[i+1:]...)
			return true
		}
	}
	return false
}
