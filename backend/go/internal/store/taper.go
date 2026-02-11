package store

import (
	"context"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const OTPExpiryMinutes = 20

// OTPEntry is a one-time code for client to access the taper (signing) page.
type OTPEntry struct {
	Code      string    `json:"code"`
	Label     string    `json:"label"` // optional, e.g. nomor perjanjian
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

// SignedDoc is a document signed by client (PDF + signature overlay).
type SignedDoc struct {
	ID         string    `json:"id"`
	OTPCode    string    `json:"otp_code"`   // OTP used to get access (for linking in admin)
	Label      string    `json:"label"`      // same as OTP label if set
	Filename   string    `json:"filename"`   // e.g. perjanjian-pemberian-jasa.pdf
	StoredPath string    `json:"stored_path"` // path under uploads/signed/ or similar
	CreatedAt  time.Time `json:"created_at"`
}

// TaperStore holds OTPs and signed documents (in-memory or PostgreSQL when pool is set).
type TaperStore struct {
	mu     sync.RWMutex
	otps   map[string]*OTPEntry
	signed []SignedDoc
	pool   *pgxpool.Pool
}

// NewTaperStore returns a new in-memory taper store.
func NewTaperStore() *TaperStore {
	return &TaperStore{
		otps:   make(map[string]*OTPEntry),
		signed: make([]SignedDoc, 0),
	}
}

// NewTaperStoreFromDB returns a taper store backed by PostgreSQL.
func NewTaperStoreFromDB(pool *pgxpool.Pool) *TaperStore {
	return &TaperStore{pool: pool}
}

// CreateOTP generates a new OTP (e.g. 6-digit) with 20-minute expiry. Returns code.
func (s *TaperStore) CreateOTP(label string) (code string, expiresAt time.Time) {
	if s.pool != nil {
		return s.createOTPDB(label)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for {
		code = randomOTP(6)
		if _, exists := s.otps[code]; !exists {
			break
		}
	}
	expiresAt = time.Now().UTC().Add(OTPExpiryMinutes * time.Minute)
	s.otps[code] = &OTPEntry{
		Code:      code,
		Label:     label,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now().UTC(),
	}
	return code, expiresAt
}

func (s *TaperStore) createOTPDB(label string) (code string, expiresAt time.Time) {
	ctx := context.Background()
	expiresAt = time.Now().UTC().Add(OTPExpiryMinutes * time.Minute)
	for i := 0; i < 20; i++ {
		code = randomOTP(6)
		_, err := s.pool.Exec(ctx, `INSERT INTO taper_otps (code, label, expires_at, created_at) VALUES ($1,$2,$3,NOW())`, code, label, expiresAt)
		if err == nil {
			return code, expiresAt
		}
		// duplicate code, retry
	}
	return "", time.Time{}
}

// VerifyOTP returns true if code is valid and not expired.
func (s *TaperStore) VerifyOTP(code string) (ok bool, label string) {
	if s.pool != nil {
		return s.verifyOTPDB(code)
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	e, ok := s.otps[code]
	if !ok || e.ExpiresAt.Before(time.Now().UTC()) {
		return false, ""
	}
	return true, e.Label
}

func (s *TaperStore) verifyOTPDB(code string) (ok bool, label string) {
	ctx := context.Background()
	var lbl string
	var exp time.Time
	err := s.pool.QueryRow(ctx, `SELECT label, expires_at FROM taper_otps WHERE code = $1`, code).Scan(&lbl, &exp)
	if err != nil {
		return false, ""
	}
	if exp.Before(time.Now().UTC()) {
		return false, ""
	}
	return true, lbl
}

func randomOTP(n int) string {
	const digits = "0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = digits[time.Now().UnixNano()%10]
	}
	return string(b)
}

// AddSignedDoc saves a signed document and returns it with ID.
func (s *TaperStore) AddSignedDoc(otpCode, label, filename, storedPath string) SignedDoc {
	if s.pool != nil {
		return s.addSignedDocDB(otpCode, label, filename, storedPath)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	d := SignedDoc{
		ID:         time.Now().UTC().Format("20060102150405") + randomSuffix(4),
		OTPCode:    otpCode,
		Label:      label,
		Filename:   filename,
		StoredPath: storedPath,
		CreatedAt:  time.Now().UTC(),
	}
	s.signed = append(s.signed, d)
	return d
}

func (s *TaperStore) addSignedDocDB(otpCode, label, filename, storedPath string) SignedDoc {
	d := SignedDoc{
		ID:         time.Now().UTC().Format("20060102150405") + randomSuffix(4),
		OTPCode:    otpCode,
		Label:      label,
		Filename:   filename,
		StoredPath: storedPath,
		CreatedAt:  time.Now().UTC(),
	}
	ctx := context.Background()
	_, err := s.pool.Exec(ctx, `INSERT INTO taper_signed_docs (id, otp_code, label, filename, stored_path, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
		d.ID, d.OTPCode, d.Label, d.Filename, d.StoredPath, d.CreatedAt)
	if err != nil {
		return SignedDoc{}
	}
	return d
}

// ListSignedDocs returns all signed docs (newest first).
func (s *TaperStore) ListSignedDocs() []SignedDoc {
	if s.pool != nil {
		return s.listSignedDocsDB()
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]SignedDoc, len(s.signed))
	copy(out, s.signed)
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return out
}

func (s *TaperStore) listSignedDocsDB() []SignedDoc {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `SELECT id, otp_code, label, filename, stored_path, created_at FROM taper_signed_docs ORDER BY created_at DESC`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []SignedDoc
	for rows.Next() {
		var d SignedDoc
		if err := rows.Scan(&d.ID, &d.OTPCode, &d.Label, &d.Filename, &d.StoredPath, &d.CreatedAt); err != nil {
			return out
		}
		out = append(out, d)
	}
	return out
}
