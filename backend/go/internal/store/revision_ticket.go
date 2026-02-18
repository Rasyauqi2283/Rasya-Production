package store

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RevisionTicket is one revision coupon for an order (max 2 per order).
type RevisionTicket struct {
	ID        string     `json:"id"`
	OrderID   string     `json:"order_id"`
	Code      string     `json:"code"`
	Sequence  int        `json:"sequence"`
	Status    string     `json:"status"` // "unused" | "used"
	UsedAt    *time.Time `json:"used_at,omitempty"`
	Note      string     `json:"note"`
	CreatedAt time.Time  `json:"created_at"`
}

// RevisionTicketStore holds revision tickets in memory or PostgreSQL.
type RevisionTicketStore struct {
	mu    sync.RWMutex
	items []RevisionTicket
	pool  *pgxpool.Pool
}

// NewRevisionTicketStore returns a new in-memory store.
func NewRevisionTicketStore() *RevisionTicketStore {
	return &RevisionTicketStore{items: make([]RevisionTicket, 0)}
}

// NewRevisionTicketStoreFromDB returns a store backed by PostgreSQL.
func NewRevisionTicketStoreFromDB(pool *pgxpool.Pool) *RevisionTicketStore {
	return &RevisionTicketStore{pool: pool}
}

func generateTicketCode() string {
	b := make([]byte, 6)
	rand.Read(b)
	return "RV-" + hex.EncodeToString(b)[:10]
}

// CreateForOrder creates n revision tickets for an order (typically 2).
func (s *RevisionTicketStore) CreateForOrder(orderID string, n int) []RevisionTicket {
	if s.pool != nil {
		return s.createForOrderDB(orderID, n)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]RevisionTicket, 0, n)
	seen := make(map[string]bool)
	for i := 1; i <= n; i++ {
		code := generateTicketCode()
		for seen[code] {
			code = generateTicketCode()
		}
		seen[code] = true
		t := RevisionTicket{
			ID:        generateID(),
			OrderID:   orderID,
			Code:      code,
			Sequence:  i,
			Status:    "unused",
			CreatedAt: time.Now().UTC(),
		}
		s.items = append(s.items, t)
		out = append(out, t)
	}
	return out
}

func (s *RevisionTicketStore) createForOrderDB(orderID string, n int) []RevisionTicket {
	ctx := context.Background()
	out := make([]RevisionTicket, 0, n)
	seen := make(map[string]bool)
	for i := 1; i <= n; i++ {
		code := generateTicketCode()
		for seen[code] {
			code = generateTicketCode()
		}
		seen[code] = true
		t := RevisionTicket{
			ID:        generateID(),
			OrderID:   orderID,
			Code:      code,
			Sequence:  i,
			Status:    "unused",
			CreatedAt: time.Now().UTC(),
		}
		_, err := s.pool.Exec(ctx, `INSERT INTO revision_tickets (id, order_id, code, sequence, status, created_at)
			VALUES ($1,$2,$3,$4,'unused',$5)`,
			t.ID, t.OrderID, t.Code, t.Sequence, t.CreatedAt)
		if err != nil {
			return out
		}
		out = append(out, t)
	}
	return out
}

// ByOrderID returns all tickets for an order (sequence order).
func (s *RevisionTicketStore) ByOrderID(orderID string) []RevisionTicket {
	if s.pool != nil {
		return s.byOrderIDDB(orderID)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []RevisionTicket
	for _, t := range s.items {
		if t.OrderID == orderID {
			out = append(out, t)
		}
	}
	return out
}

func (s *RevisionTicketStore) byOrderIDDB(orderID string) []RevisionTicket {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `SELECT id, order_id, code, sequence, status, used_at, note, created_at
		FROM revision_tickets WHERE order_id = $1 ORDER BY sequence`, orderID)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []RevisionTicket
	for rows.Next() {
		var t RevisionTicket
		var usedAt *time.Time
		if err := rows.Scan(&t.ID, &t.OrderID, &t.Code, &t.Sequence, &t.Status, &usedAt, &t.Note, &t.CreatedAt); err != nil {
			return out
		}
		t.UsedAt = usedAt
		out = append(out, t)
	}
	return out
}

// Redeem marks a ticket as used by code. Returns (ticket, true) if valid and was unused.
func (s *RevisionTicketStore) Redeem(code string) (RevisionTicket, bool) {
	code = trimUpper(code)
	if code == "" {
		return RevisionTicket{}, false
	}
	if s.pool != nil {
		return s.redeemDB(code)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.items {
		if s.items[i].Code == code && s.items[i].Status == "unused" {
			now := time.Now().UTC()
			s.items[i].Status = "used"
			s.items[i].UsedAt = &now
			return s.items[i], true
		}
	}
	return RevisionTicket{}, false
}

func trimUpper(s string) string {
	b := make([]byte, 0, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'a' && c <= 'z' {
			c -= 'a' - 'A'
		}
		if c != ' ' && c != '\t' {
			b = append(b, c)
		}
	}
	return string(b)
}

func (s *RevisionTicketStore) redeemDB(code string) (RevisionTicket, bool) {
	ctx := context.Background()
	codeNorm := trimUpper(code)
	var t RevisionTicket
	var usedAt *time.Time
	err := s.pool.QueryRow(ctx, `SELECT id, order_id, code, sequence, status, used_at, note, created_at
		FROM revision_tickets WHERE UPPER(REPLACE(TRIM(code),' ','')) = $1`, codeNorm).Scan(
		&t.ID, &t.OrderID, &t.Code, &t.Sequence, &t.Status, &usedAt, &t.Note, &t.CreatedAt)
	if err != nil {
		return RevisionTicket{}, false
	}
	if t.Status != "unused" {
		return t, false
	}
	now := time.Now().UTC()
	_, err = s.pool.Exec(ctx, `UPDATE revision_tickets SET status = 'used', used_at = $2 WHERE id = $1`, t.ID, now)
	if err != nil {
		return RevisionTicket{}, false
	}
	t.Status = "used"
	t.UsedAt = &now
	return t, true
}

// GetByCode returns ticket by code (for admin/preview).
func (s *RevisionTicketStore) GetByCode(code string) (RevisionTicket, bool) {
	code = trimUpper(code)
	if code == "" {
		return RevisionTicket{}, false
	}
	if s.pool != nil {
		return s.getByCodeDB(code)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, t := range s.items {
		if trimUpper(t.Code) == code {
			return t, true
		}
	}
	return RevisionTicket{}, false
}

func (s *RevisionTicketStore) getByCodeDB(code string) (RevisionTicket, bool) {
	ctx := context.Background()
	codeNorm := trimUpper(code)
	var t RevisionTicket
	var usedAt *time.Time
	err := s.pool.QueryRow(ctx, `SELECT id, order_id, code, sequence, status, used_at, note, created_at
		FROM revision_tickets WHERE UPPER(REPLACE(TRIM(code),' ','')) = $1`, codeNorm).Scan(
		&t.ID, &t.OrderID, &t.Code, &t.Sequence, &t.Status, &usedAt, &t.Note, &t.CreatedAt)
	if err != nil {
		return RevisionTicket{}, false
	}
	t.UsedAt = usedAt
	return t, true
}
