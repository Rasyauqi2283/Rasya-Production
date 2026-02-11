package store

import (
	"sync"
	"time"
)

// OrderItem is one order layanan (sedang dikerjakan / antrian).
type OrderItem struct {
	ID                   string    `json:"id"`
	Layanan              string    `json:"layanan"`               // nama layanan (e.g. UI Designer)
	DeskripsiPekerjaan   string    `json:"deskripsi_pekerjaan"`   // apa yang akan dikerjakan
	Deadline             string    `json:"deadline"`               // deadline (YYYY-MM-DD atau teks)
	MulaiTanggal         string    `json:"mulai_tanggal"`           // mulai tanggal
	KesepakatanBriefUang string    `json:"kesepakatan_brief_uang"` // kesepakatan uang (brief)
	KapanUangMasuk       string    `json:"kapan_uang_masuk"`       // kapan uang masuk
	CreatedAt            time.Time `json:"created_at"`
}

// OrderStore holds order layanan in memory.
type OrderStore struct {
	mu    sync.RWMutex
	items []OrderItem
}

// NewOrderStore returns a new order store.
func NewOrderStore() *OrderStore {
	return &OrderStore{items: make([]OrderItem, 0)}
}

// Add appends an order.
func (o *OrderStore) Add(layanan, deskripsi, deadline, mulai, kesepakatan, uangMasuk string) OrderItem {
	o.mu.Lock()
	defer o.mu.Unlock()
	item := OrderItem{
		ID:                   generateID(),
		Layanan:              layanan,
		DeskripsiPekerjaan:   deskripsi,
		Deadline:             deadline,
		MulaiTanggal:         mulai,
		KesepakatanBriefUang: kesepakatan,
		KapanUangMasuk:      uangMasuk,
		CreatedAt:            time.Now().UTC(),
	}
	o.items = append(o.items, item)
	return item
}

// List returns all orders (newest first).
func (o *OrderStore) List() []OrderItem {
	o.mu.RLock()
	defer o.mu.RUnlock()
	out := make([]OrderItem, len(o.items))
	copy(out, o.items)
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return out
}

// Delete removes an order by ID.
func (o *OrderStore) Delete(id string) bool {
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
