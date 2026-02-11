package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"

	"backend/internal/config"
)

// AuthAdminRequest is the body for POST /api/auth/admin.
type AuthAdminRequest struct {
	IDToken string `json:"id_token"`
}

// AuthAdminResponse is the response for POST /api/auth/admin.
type AuthAdminResponse struct {
	Token string `json:"token"`
}

// googleTokenInfo is the response from https://oauth2.googleapis.com/tokeninfo?id_token=...
type googleTokenInfo struct {
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
}

type adminTokenClaims struct {
	Email string `json:"email"`
	Exp   int64  `json:"exp"`
	Iat   int64  `json:"iat"`
}

// AuthAdmin handles POST /api/auth/admin: verify Google ID token, check allowed email, return JWT.
func AuthAdmin(w http.ResponseWriter, r *http.Request) {
	if AuthCfg == nil || AuthCfg.AdminAllowedEmail == "" {
		http.Error(w, "admin login not configured (set ADMIN_ALLOWED_EMAIL)", http.StatusServiceUnavailable)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body AuthAdminRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.IDToken == "" {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	// Verify ID token with Google
	resp, err := http.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + url.QueryEscape(body.IDToken))
	if err != nil {
		http.Error(w, "failed to verify token", http.StatusBadRequest)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return
	}

	var info googleTokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		http.Error(w, "invalid token response", http.StatusBadRequest)
		return
	}
	email := strings.TrimSpace(strings.ToLower(info.Email))
	if email == "" {
		http.Error(w, "email not found", http.StatusUnauthorized)
		return
	}
	if strings.ToLower(info.EmailVerified) != "true" {
		http.Error(w, "email not verified", http.StatusUnauthorized)
		return
	}

	// Check if email is allowed
	allowed := parseAllowedEmails(AuthCfg.AdminAllowedEmail)
	if !allowed[email] {
		http.Error(w, "unauthorized", http.StatusForbidden)
		return
	}

	// Issue JWT
	if AuthCfg.JWTSecret == "" {
		http.Error(w, "auth not configured", http.StatusInternalServerError)
		return
	}
	now := time.Now().Unix()
	claims := adminTokenClaims{
		Email: email,
		Exp:   now + int64(24*time.Hour/time.Second),
		Iat:   now,
	}
	tokenString, err := signAdminToken(claims, AuthCfg.JWTSecret)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(AuthAdminResponse{Token: tokenString})
}

func parseAllowedEmails(s string) map[string]bool {
	out := make(map[string]bool)
	for _, e := range strings.Split(s, ",") {
		e = strings.TrimSpace(strings.ToLower(e))
		if e != "" {
			out[e] = true
		}
	}
	return out
}

// AuthCfg is set by main for auth handler and middleware.
var AuthCfg *config.Config

func signAdminToken(claims adminTokenClaims, secret string) (string, error) {
	headerJSON := []byte(`{"alg":"HS256","typ":"JWT"}`)
	payloadJSON, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	enc := base64.RawURLEncoding
	header := enc.EncodeToString(headerJSON)
	payload := enc.EncodeToString(payloadJSON)
	unsigned := header + "." + payload
	sig := hmacSHA256(unsigned, secret)
	return unsigned + "." + enc.EncodeToString(sig), nil
}

func verifyAdminToken(token, secret string) (adminTokenClaims, error) {
	var claims adminTokenClaims
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return claims, errors.New("invalid token format")
	}
	enc := base64.RawURLEncoding
	unsigned := parts[0] + "." + parts[1]
	gotSig, err := enc.DecodeString(parts[2])
	if err != nil {
		return claims, errors.New("invalid token signature")
	}
	wantSig := hmacSHA256(unsigned, secret)
	if !hmac.Equal(gotSig, wantSig) {
		return claims, errors.New("invalid token signature")
	}
	payload, err := enc.DecodeString(parts[1])
	if err != nil {
		return claims, errors.New("invalid token payload")
	}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return claims, errors.New("invalid token payload")
	}
	if claims.Exp <= time.Now().Unix() {
		return claims, errors.New("token expired")
	}
	return claims, nil
}

func hmacSHA256(data, secret string) []byte {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(data))
	return mac.Sum(nil)
}
