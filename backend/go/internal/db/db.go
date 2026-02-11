package db

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Open connects to PostgreSQL and returns a pool. databaseURL format:
// postgres://user:password@host:port/dbname?sslmode=disable
func Open(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return pool, nil
}

// Migrate creates tables if they don't exist. Idempotent.
func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS donations (
			id TEXT PRIMARY KEY,
			order_id TEXT UNIQUE,
			amount INT NOT NULL,
			comment TEXT NOT NULL DEFAULT '',
			name TEXT NOT NULL DEFAULT '',
			email TEXT NOT NULL DEFAULT '',
			highlighted BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS services (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			tag TEXT NOT NULL DEFAULT 'Lain-lain',
			"desc" TEXT NOT NULL DEFAULT '',
			price_awal TEXT NOT NULL DEFAULT '',
			discount_percent INT NOT NULL DEFAULT 0,
			price_after_discount TEXT NOT NULL DEFAULT '',
			"order" INT NOT NULL DEFAULT 0,
			closed BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS porto (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			tag TEXT NOT NULL DEFAULT '',
			description TEXT NOT NULL DEFAULT '',
			image_url TEXT NOT NULL DEFAULT '',
			link_url TEXT NOT NULL DEFAULT '',
			layanan JSONB NOT NULL DEFAULT '[]',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS orders (
			id TEXT PRIMARY KEY,
			layanan TEXT NOT NULL,
			deskripsi_pekerjaan TEXT NOT NULL DEFAULT '',
			deadline TEXT NOT NULL DEFAULT '',
			mulai_tanggal TEXT NOT NULL DEFAULT '',
			kesepakatan_brief_uang TEXT NOT NULL DEFAULT '',
			kapan_uang_masuk TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS taper_otps (
			code TEXT PRIMARY KEY,
			label TEXT NOT NULL DEFAULT '',
			expires_at TIMESTAMPTZ NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS taper_signed_docs (
			id TEXT PRIMARY KEY,
			otp_code TEXT NOT NULL,
			label TEXT NOT NULL DEFAULT '',
			filename TEXT NOT NULL,
			stored_path TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
	}
	for _, q := range queries {
		if _, err := pool.Exec(ctx, q); err != nil {
			return err
		}
	}
	log.Println("Database migrations applied (tables ready)")
	return nil
}
