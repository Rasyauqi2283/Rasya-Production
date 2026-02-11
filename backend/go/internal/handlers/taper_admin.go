package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
)

// TaperAdminGenerateOTPRequest is the body for POST /api/admin/taper/otp.
type TaperAdminGenerateOTPRequest struct {
	Label string `json:"label"` // optional, e.g. nomor perjanjian
}

// TaperAdminGenerateOTPResponse returns OTP and URL for client.
type TaperAdminGenerateOTPResponse struct {
	OK        bool   `json:"ok"`
	OTP       string `json:"otp,omitempty"`
	ExpiresAt string `json:"expires_at,omitempty"` // ISO8601
	URL       string `json:"url,omitempty"`       // full URL to taper page
	Message   string `json:"message,omitempty"`
}

// TaperAdminGenerateOTP handles POST /api/admin/taper/otp — admin creates OTP for client signing.
func TaperAdminGenerateOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req TaperAdminGenerateOTPRequest
	_ = json.NewDecoder(r.Body).Decode(&req)
	if TaperStore == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(TaperAdminGenerateOTPResponse{OK: false, Message: "Service tidak tersedia"})
		return
	}
	code, expiresAt := TaperStore.CreateOTP(strings.TrimSpace(req.Label))
	// Base URL for taper page: from request or env
	baseURL := "https://your-domain.com"
	if r.URL != nil && r.URL.Scheme != "" && r.Host != "" {
		baseURL = r.URL.Scheme + "://" + r.Host
	}
	if r.TLS != nil && r.TLS.ServerName != "" {
		baseURL = "https://" + r.Host
	}
	if r.Header.Get("X-Forwarded-Proto") == "https" && r.Header.Get("X-Forwarded-Host") != "" {
		baseURL = "https://" + r.Header.Get("X-Forwarded-Host")
	}
	taperURL := strings.TrimSuffix(baseURL, "/") + "/taper"
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(TaperAdminGenerateOTPResponse{
		OK:        true,
		OTP:       code,
		ExpiresAt: expiresAt.Format("2006-01-02T15:04:05Z07:00"),
		URL:       taperURL,
	})
}

// TaperAdminListSignedResponse is the response for GET /api/admin/taper/signed.
type TaperAdminListSignedResponse struct {
	OK    bool              `json:"ok"`
	Docs  []SignedDocPublic `json:"docs"`
}

// SignedDocPublic is signed doc info for admin list (same id/filename as client download).
type SignedDocPublic struct {
	ID        string `json:"id"`
	OTPCode   string `json:"otp_code"`
	Label     string `json:"label"`
	Filename  string `json:"filename"`
	CreatedAt string `json:"created_at"`
	DownloadURL string `json:"download_url,omitempty"`
}

// TaperAdminListSigned handles GET /api/admin/taper/signed — list signed documents.
func TaperAdminListSigned(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if TaperStore == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(TaperAdminListSignedResponse{OK: true, Docs: []SignedDocPublic{}})
		return
	}
	list := TaperStore.ListSignedDocs()
	baseURL := ""
	if r.URL != nil && r.Host != "" {
		baseURL = "https://" + r.Host
		if r.TLS != nil {
			baseURL = "https://" + r.Host
		}
		if r.Header.Get("X-Forwarded-Host") != "" {
			proto := "https"
			if r.Header.Get("X-Forwarded-Proto") != "" {
				proto = r.Header.Get("X-Forwarded-Proto")
			}
			baseURL = proto + "://" + r.Header.Get("X-Forwarded-Host")
		}
	}
	docs := make([]SignedDocPublic, 0, len(list))
	for _, d := range list {
		doc := SignedDocPublic{
			ID:        d.ID,
			OTPCode:   d.OTPCode,
			Label:     d.Label,
			Filename:  d.Filename,
			CreatedAt: d.CreatedAt.Format("2006-01-02 15:04:05"),
		}
		if baseURL != "" && d.StoredPath != "" {
			doc.DownloadURL = strings.TrimSuffix(baseURL, "/") + "/uploads/" + d.StoredPath
		}
		docs = append(docs, doc)
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(TaperAdminListSignedResponse{OK: true, Docs: docs})
}
