package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/handlers"
	mw "backend/internal/middleware"
	"backend/internal/middleware/cors"
	"backend/internal/store"
)

func main() {
	_ = godotenv.Load() // load .env dari folder backend/go jika ada
	cfg := config.Load()

	var donateStore *store.Store
	var serviceStore *store.ServiceStore
	var portoStore *store.PortoStore
	var orderStore *store.OrderStore
	var revisionTicketStore *store.RevisionTicketStore
	var analitikStore *store.AnalitikStore
	var taperStore *store.TaperStore

	if cfg.DatabaseURL != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		pool, err := db.Open(ctx, cfg.DatabaseURL)
		if err != nil {
			log.Fatalf("Database: %v", err)
		}
		defer pool.Close()
		if err := db.Migrate(ctx, pool); err != nil {
			log.Fatalf("Database migrate: %v", err)
		}
		donateStore = store.NewFromDB(pool)
		serviceStore = store.NewServiceStoreFromDB(pool)
		serviceStore.SeedIfEmpty()
		portoStore = store.NewPortoStoreFromDB(pool)
		portoStore.SeedIfEmpty()
		orderStore = store.NewOrderStoreFromDB(pool)
		revisionTicketStore = store.NewRevisionTicketStoreFromDB(pool)
		analitikStore = store.NewAnalitikStoreFromDB(pool)
		taperStore = store.NewTaperStoreFromDB(pool)
		log.Println("Raspro connected to PostgreSQL (real-time persistent)")
	} else {
		donateStore = store.New()
		serviceStore = store.NewServiceStore()
		serviceStore.SeedIfEmpty()
		portoStore = store.NewPortoStore()
		portoStore.SeedIfEmpty()
		orderStore = store.NewOrderStore()
		revisionTicketStore = store.NewRevisionTicketStore()
		analitikStore = store.NewAnalitikStore()
		taperStore = store.NewTaperStore()
	}

	handlers.DonateStore = donateStore
	handlers.DonateCfg = cfg
	handlers.ServiceStore = serviceStore
	handlers.PortoStore = portoStore
	handlers.PortoCfg = cfg
	handlers.OrderStore = orderStore
	handlers.RevisionTicketStore = revisionTicketStore
	handlers.AnalitikStore = analitikStore
	handlers.AuthCfg = cfg
	handlers.TaperStore = taperStore
	handlers.TaperCfg = cfg

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.CORS)

	r.Get("/", handlers.Home)
	r.Get("/health", handlers.Health)
	r.Post("/api/donate", handlers.DonatePost)
	r.Post("/api/donate/create-transaction", handlers.DonateCreateTransaction)
	r.Post("/api/donate/webhook", handlers.DonateWebhook)
	r.Get("/api/reviews", handlers.ReviewsList)
	r.Get("/api/services", handlers.ServicesList)
	r.Get("/api/porto", handlers.PortoList)
	r.Get("/api/analitik", handlers.AnalitikList)
	r.Get("/api/orders/antrian", handlers.OrdersAntrian)
	r.Post("/api/revisi/klaim", handlers.RevisiKlaim)
	r.Post("/api/auth/admin", handlers.AuthAdmin)
	r.Post("/api/taper/verify", handlers.TaperVerify)
	r.Post("/api/taper/sign", handlers.TaperSign)

	r.Handle("/uploads/*", http.StripPrefix("/uploads", http.FileServer(http.Dir(cfg.UploadDir))))

	r.Group(func(r chi.Router) {
		r.Use(mw.AdminKey(cfg))
		r.Get("/api/admin/donations", handlers.DonationsListAll)
		r.Get("/api/admin/services", handlers.ServicesListAdmin)
		r.Post("/api/admin/services", handlers.ServicesAdd)
		r.Put("/api/admin/services", handlers.ServicesUpdate)
		r.Post("/api/admin/services/close", handlers.ServicesSetClosed)
		r.Delete("/api/admin/services", handlers.ServicesDelete)
		r.Get("/api/admin/analitik", handlers.AnalitikListAdmin)
		r.Post("/api/admin/analitik", handlers.AnalitikAdd)
		r.Put("/api/admin/analitik", handlers.AnalitikUpdate)
		r.Post("/api/admin/analitik/close", handlers.AnalitikSetClosed)
		r.Delete("/api/admin/analitik", handlers.AnalitikDelete)
		r.Get("/api/admin/porto", handlers.PortoListAdmin)
		r.Post("/api/admin/porto", handlers.PortoAdd)
		r.Post("/api/admin/porto/close", handlers.PortoSetClosed)
		r.Delete("/api/admin/porto", handlers.PortoDelete)
		r.Get("/api/admin/orders", handlers.OrdersListAll)
		r.Post("/api/admin/orders", handlers.OrdersAdd)
		r.Patch("/api/admin/orders", handlers.OrdersComplete)
		r.Delete("/api/admin/orders", handlers.OrdersDelete)
		r.Get("/api/admin/agreement/sample", handlers.AgreementSamplePDF)
		r.Post("/api/admin/agreement/pdf", handlers.AgreementPDF)
		r.Post("/api/admin/taper/otp", handlers.TaperAdminGenerateOTP)
		r.Get("/api/admin/taper/signed", handlers.TaperAdminListSigned)
	})

	addr := ":" + cfg.Port
	log.Printf("Rasya Production API listening on %s (env=%s)", addr, cfg.Env)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatal(err)
	}
}
