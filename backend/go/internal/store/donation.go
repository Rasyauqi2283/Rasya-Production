package store

import (
	"context"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Donation represents a single donation (and optional contact/review).
type Donation struct {
	ID          string    `json:"id"`
	OrderID     string    `json:"order_id,omitempty"` // Midtrans order_id (untuk idempotency webhook)
	Amount      int       `json:"amount"`           // IDR
	Comment     string    `json:"comment"`
	Name        string    `json:"name"`
	Email       string    `json:"email"`
	Highlighted bool      `json:"highlighted"`
	CreatedAt   time.Time `json:"created_at"`
}

// Store holds donations in memory or PostgreSQL (when pool is set).
type Store struct {
	mu    sync.RWMutex
	items []Donation
	pool  *pgxpool.Pool
}

// New returns a new in-memory store.
func New() *Store {
	return &Store{items: make([]Donation, 0)}
}

// NewFromDB returns a store backed by PostgreSQL. Migrate must have been run.
func NewFromDB(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// Add saves a donation and returns it with ID.
func (s *Store) Add(d Donation) Donation {
	if s.pool != nil {
		return s.addDB(d)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	d.ID = generateID()
	d.CreatedAt = time.Now().UTC()
	s.items = append(s.items, d)
	return d
}

func (s *Store) addDB(d Donation) Donation {
	d.ID = generateID()
	d.CreatedAt = time.Now().UTC()
	ctx := context.Background()
	_, err := s.pool.Exec(ctx, `INSERT INTO donations (id, order_id, amount, comment, name, email, highlighted, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		d.ID, nullStr(d.OrderID), d.Amount, d.Comment, d.Name, d.Email, d.Highlighted, d.CreatedAt)
	if err != nil {
		return Donation{}
	}
	return d
}

// FindByOrderID returns a donation with the given order_id if any (untuk idempotency webhook).
func (s *Store) FindByOrderID(orderID string) (Donation, bool) {
	if s.pool != nil {
		return s.findByOrderIDDB(orderID)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, d := range s.items {
		if d.OrderID == orderID {
			return d, true
		}
	}
	return Donation{}, false
}

func (s *Store) findByOrderIDDB(orderID string) (Donation, bool) {
	ctx := context.Background()
	var d Donation
	var orderIDNull *string
	err := s.pool.QueryRow(ctx, `SELECT id, order_id, amount, comment, name, email, highlighted, created_at
		FROM donations WHERE order_id = $1`, orderID).Scan(
		&d.ID, &orderIDNull, &d.Amount, &d.Comment, &d.Name, &d.Email, &d.Highlighted, &d.CreatedAt)
	if err != nil {
		return Donation{}, false
	}
	if orderIDNull != nil {
		d.OrderID = *orderIDNull
	}
	return d, true
}

// ListHighlighted returns donations that are highlighted (e.g. for email priority).
func (s *Store) ListHighlighted() []Donation {
	if s.pool != nil {
		return s.listHighlightedDB()
	}
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

func (s *Store) listHighlightedDB() []Donation {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `SELECT id, order_id, amount, comment, name, email, highlighted, created_at
		FROM donations WHERE highlighted = true ORDER BY created_at DESC`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []Donation
	for rows.Next() {
		var d Donation
		var orderIDNull *string
		if err := rows.Scan(&d.ID, &orderIDNull, &d.Amount, &d.Comment, &d.Name, &d.Email, &d.Highlighted, &d.CreatedAt); err != nil {
			return out
		}
		if orderIDNull != nil {
			d.OrderID = *orderIDNull
		}
		out = append(out, d)
	}
	return out
}

// ListAll returns all donations (for admin only).
func (s *Store) ListAll() []Donation {
	if s.pool != nil {
		return s.listAllDB()
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]Donation, len(s.items))
	copy(out, s.items)
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return out
}

func (s *Store) listAllDB() []Donation {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `SELECT id, order_id, amount, comment, name, email, highlighted, created_at
		FROM donations ORDER BY created_at DESC`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []Donation
	for rows.Next() {
		var d Donation
		var orderIDNull *string
		if err := rows.Scan(&d.ID, &orderIDNull, &d.Amount, &d.Comment, &d.Name, &d.Email, &d.Highlighted, &d.CreatedAt); err != nil {
			return out
		}
		if orderIDNull != nil {
			d.OrderID = *orderIDNull
		}
		out = append(out, d)
	}
	return out
}

// ListReviews returns donations below threshold (for public ulasan), with comment.
func (s *Store) ListReviews() []Donation {
	if s.pool != nil {
		return s.listReviewsDB()
	}
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

func (s *Store) listReviewsDB() []Donation {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `SELECT id, order_id, amount, comment, name, email, highlighted, created_at
		FROM donations WHERE highlighted = false AND comment != '' ORDER BY created_at DESC`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []Donation
	for rows.Next() {
		var d Donation
		var orderIDNull *string
		if err := rows.Scan(&d.ID, &orderIDNull, &d.Amount, &d.Comment, &d.Name, &d.Email, &d.Highlighted, &d.CreatedAt); err != nil {
			return out
		}
		if orderIDNull != nil {
			d.OrderID = *orderIDNull
		}
		out = append(out, d)
	}
	return out
}

func nullStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
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
