package config

import (
	"fmt"
	"os"
)

// Config holds application configuration from environment.
type Config struct {
	Port                 string
	Env                  string
	BankName             string
	BankNumber           string
	BankAccount          string
	DonateHighlight      int    // amount in IDR above which donation is "highlighted" (default 50000)
	MidtransServerKey    string // untuk create transaction & webhook (backend only)
	MidtransClientKey    string // untuk frontend Snap (dikirim ke client bila perlu)
	MidtransIsProduction bool   // true = production, false = sandbox
	AdminAllowedEmail    string
	JWTSecret            string
	UploadDir            string
	// PostgreSQL: jika diisi, semua data disimpan di DB (real-time persistent).
	// Format: postgres://user:password@host:port/dbname?sslmode=disable
	DatabaseURL string
}

// Load reads configuration from environment variables.
func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	env := os.Getenv("ENV")
	if env == "" {
		env = "development"
	}
	highlight := 50000
	if v := os.Getenv("DONATE_HIGHLIGHT_IDR"); v != "" {
		if n, err := parseInt(v); err == nil && n > 0 {
			highlight = n
		}
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	midtransProd := os.Getenv("MIDTRANS_IS_PRODUCTION") == "true" || os.Getenv("MIDTRANS_IS_PRODUCTION") == "1"
	return &Config{
		Port:                 port,
		Env:                  env,
		BankName:             os.Getenv("BANK_NAME"),
		BankNumber:           os.Getenv("BANK_NUMBER"),
		BankAccount:          os.Getenv("BANK_ACCOUNT"),
		DonateHighlight:      highlight,
		MidtransServerKey:    os.Getenv("MIDTRANS_SERVER_KEY"),
		MidtransClientKey:   os.Getenv("MIDTRANS_CLIENT_KEY"),
		MidtransIsProduction: midtransProd,
		AdminAllowedEmail:   os.Getenv("ADMIN_ALLOWED_EMAIL"),
		JWTSecret:           jwtSecret,
		UploadDir:           getUploadDir(),
		DatabaseURL:         os.Getenv("DATABASE_URL"),
	}
}

func getUploadDir() string {
	d := os.Getenv("UPLOAD_DIR")
	if d == "" {
		d = "uploads"
	}
	return d
}

func parseInt(s string) (int, error) {
	var n int
	_, err := fmt.Sscanf(s, "%d", &n)
	return n, err
}
