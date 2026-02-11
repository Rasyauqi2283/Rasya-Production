package store

import (
	"sync"
	"time"
)

// Donation represents a single donation (and optional contact/review).
type Donation struct {
	ID          string    `json:"id"`
	OrderID     string    `json:"order_id,omitempty"` // Midtrans order_id (untuk idempotency webhook)
	Amount      int       `json:"amount"`             // IDR
	Comment     string    `json:"comment"`
	Name        string    `json:"name"`
	Email       string    `json:"email"`
	Highlighted bool      `json:"highlighted"`
	CreatedAt   time.Time `json:"created_at"`
}

// Store holds donations in memory (replace with DB later if needed).
type Store struct {
	mu    sync.RWMutex
	items []Donation
}

// New returns a new in-memory store.
func New() *Store {
	return &Store{items: make([]Donation, 0)}
}

// Add saves a donation and returns it with ID.
func (s *Store) Add(d Donation) Donation {
	s.mu.Lock()
	defer s.mu.Unlock()
	d.ID = generateID()
	d.CreatedAt = time.Now().UTC()
	s.items = append(s.items, d)
	return d
}

// FindByOrderID returns a donation with the given order_id if any (untuk idempotency webhook).
func (s *Store) FindByOrderID(orderID string) (Donation, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, d := range s.items {
		if d.OrderID == orderID {
			return d, true
		}
	}
	return Donation{}, false
}

// ListHighlighted returns donations that are highlighted (e.g. for email priority).
func (s *Store) ListHighlighted() []Donation {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []Donation
	for i := len(s.items) - 1; i >= 0; i-- {
		if s.items[i].Highlighted {
			out = append(out, s.items[i])
		}
	}
	return out
}

// ListAll returns all donations (for admin only).
func (s *Store) ListAll() []Donation {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]Donation, len(s.items))
	copy(out, s.items)
	// newest first
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return out
}

// ListReviews returns donations below threshold (for public ulasan), with comment.
func (s *Store) ListReviews() []Donation {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []Donation
	for i := len(s.items) - 1; i >= 0; i-- {
		d := s.items[i]
		if !d.Highlighted && d.Comment != "" {
			out = append(out, d)
		}
	}
	return out
}

// generateID returns a short unique id (time-based for simplicity).
func generateID() string {
	return time.Now().UTC().Format("20060102150405") + randomSuffix(4)
}

func randomSuffix(n int) string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	ns := time.Now().UnixNano()
	for i := range b {
		b[i] = chars[int(ns>>(i*4))%len(chars)]
	}
	return string(b)
}
