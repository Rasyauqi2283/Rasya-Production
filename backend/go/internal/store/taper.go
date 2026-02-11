package store

import (
	"sync"
	"time"
)

const OTPExpiryMinutes = 20

// OTPEntry is a one-time code for client to access the taper (signing) page.
type OTPEntry struct {
	Code      string    `json:"code"`
	Label     string    `json:"label"`     // optional, e.g. nomor perjanjian
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

// SignedDoc is a document signed by client (PDF + signature overlay).
type SignedDoc struct {
	ID           string    `json:"id"`
	OTPCode      string    `json:"otp_code"`   // OTP used to get access (for linking in admin)
	Label        string    `json:"label"`      // same as OTP label if set
	Filename     string    `json:"filename"`   // e.g. perjanjian-pemberian-jasa.pdf
	StoredPath   string    `json:"stored_path"` // path under uploads/signed/ or similar
	CreatedAt    time.Time `json:"created_at"`
}

// TaperStore holds OTPs and signed documents (in-memory; replace with DB if needed).
type TaperStore struct {
	mu        sync.RWMutex
	otps      map[string]*OTPEntry // code -> entry
	signed    []SignedDoc
}

// NewTaperStore returns a new taper store.
func NewTaperStore() *TaperStore {
	return &TaperStore{
		otps:   make(map[string]*OTPEntry),
		signed: make([]SignedDoc, 0),
	}
}

// CreateOTP generates a new OTP (e.g. 6-digit) with 20-minute expiry. Returns code.
func (s *TaperStore) CreateOTP(label string) (code string, expiresAt time.Time) {
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

// VerifyOTP returns true if code is valid and not expired.
func (s *TaperStore) VerifyOTP(code string) (ok bool, label string) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	e, ok := s.otps[code]
	if !ok || e.ExpiresAt.Before(time.Now().UTC()) {
		return false, ""
	}
	return true, e.Label
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

// ListSignedDocs returns all signed docs (newest first).
func (s *TaperStore) ListSignedDocs() []SignedDoc {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]SignedDoc, len(s.signed))
	copy(out, s.signed)
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return out
}
