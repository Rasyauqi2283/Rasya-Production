package store

import (
	"strings"
	"sync"
	"time"
)

// PortoItem is one portfolio entry (project selesai kontrak).
type PortoItem struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Tag         string    `json:"tag"`
	Description string    `json:"description"`
	ImageURL    string    `json:"image_url"`   // relative path or full URL
	LinkURL     string    `json:"link_url"`    // URL website/laman (klik card = buka link)
	Layanan     []string  `json:"layanan"`     // layanan jasa (multiple)
	CreatedAt   time.Time `json:"created_at"`
}

// PortoStore holds portfolio items in memory.
type PortoStore struct {
	mu    sync.RWMutex
	items []PortoItem
}

// NewPortoStore returns a new porto store.
func NewPortoStore() *PortoStore {
	return &PortoStore{items: make([]PortoItem, 0)}
}

// Add appends a porto item. layanan can be nil. linkURL is optional (website/laman).
func (p *PortoStore) Add(title, tag, desc, imageURL, linkURL string, layanan []string) PortoItem {
	p.mu.Lock()
	defer p.mu.Unlock()
	if layanan == nil {
		layanan = []string{}
	}
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

// List returns all porto items (newest first).
func (p *PortoStore) List() []PortoItem {
	p.mu.RLock()
	defer p.mu.RUnlock()
	out := make([]PortoItem, len(p.items))
	copy(out, p.items)
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return out
}

// Delete removes a porto item by ID.
func (p *PortoStore) Delete(id string) bool {
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
