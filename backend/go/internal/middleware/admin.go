package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"backend/internal/config"
)

// AdminKey checks Authorization Bearer (JWT) or X-Admin-Key (JWT or legacy key). Only allowed if JWT valid or key matches.
func AdminKey(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenStr := ""
			if auth := r.Header.Get("Authorization"); strings.HasPrefix(auth, "Bearer ") {
				tokenStr = strings.TrimSpace(auth[7:])
			}
			if tokenStr == "" {
				tokenStr = r.Header.Get("X-Admin-Key")
			}

			if tokenStr == "" {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}

			// If it looks like a JWT (three parts), verify it
			if parts := strings.Split(tokenStr, "."); len(parts) == 3 && cfg != nil && cfg.JWTSecret != "" {
				if verifyAdminToken(tokenStr, cfg.JWTSecret) {
					next.ServeHTTP(w, r)
					return
				}
			}

			http.Error(w, "unauthorized", http.StatusUnauthorized)
		})
	}
}

type adminTokenClaims struct {
	Email string `json:"email"`
	Exp   int64  `json:"exp"`
	Iat   int64  `json:"iat"`
}

func verifyAdminToken(token, secret string) bool {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return false
	}
	enc := base64.RawURLEncoding
	unsigned := parts[0] + "." + parts[1]
	gotSig, err := enc.DecodeString(parts[2])
	if err != nil {
		return false
	}
	wantSig := hmacSHA256(unsigned, secret)
	if !hmac.Equal(gotSig, wantSig) {
		return false
	}
	payload, err := enc.DecodeString(parts[1])
	if err != nil {
		return false
	}
	var claims adminTokenClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return false
	}
	return claims.Exp > time.Now().Unix()
}

func hmacSHA256(data, secret string) []byte {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(data))
	return mac.Sum(nil)
}
