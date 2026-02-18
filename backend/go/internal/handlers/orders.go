package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"backend/internal/store"
)

var OrderStore *store.OrderStore
var RevisionTicketStore *store.RevisionTicketStore

// OrdersAntrian handles GET /api/orders/antrian (public: hanya nama layanan, tanpa price/detail).
func OrdersAntrian(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if OrderStore == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "antrian": []string{}})
		return
	}
	list := OrderStore.List()
	antrian := make([]string, 0, len(list))
	for _, item := range list {
		s := strings.TrimSpace(item.Layanan)
		if s != "" {
			antrian = append(antrian, s)
		}
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "antrian": antrian})
}

// OrderWithTickets embeds revision tickets for admin.
type OrderWithTickets struct {
	store.OrderItem
	Tickets []store.RevisionTicket `json:"tickets"`
}

// OrdersListAll handles GET /api/admin/orders (full list for admin, with revision tickets).
func OrdersListAll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if OrderStore == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "orders": []OrderWithTickets{}})
		return
	}
	list := OrderStore.List()
	out := make([]OrderWithTickets, 0, len(list))
	for _, o := range list {
		ow := OrderWithTickets{OrderItem: o}
		if RevisionTicketStore != nil {
			ow.Tickets = RevisionTicketStore.ByOrderID(o.ID)
		}
		out = append(out, ow)
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "orders": out})
}

// OrderAddRequest for POST /api/admin/orders.
type OrderAddRequest struct {
	Layanan              string `json:"layanan"`
	Pemesan              string `json:"pemesan"`
	DeskripsiPekerjaan   string `json:"deskripsi_pekerjaan"`
	Deadline             string `json:"deadline"`
	MulaiTanggal         string `json:"mulai_tanggal"`
	KesepakatanBriefUang string `json:"kesepakatan_brief_uang"`
	KapanUangMasuk       string `json:"kapan_uang_masuk"`
}

// OrdersAdd handles POST /api/admin/orders.
func OrdersAdd(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req OrderAddRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"ok":false,"message":"invalid JSON"}`, http.StatusBadRequest)
		return
	}
	layanan := strings.TrimSpace(req.Layanan)
	if layanan == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "layanan required"})
		return
	}
	if OrderStore == nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	item := OrderStore.Add(
		layanan,
		strings.TrimSpace(req.Pemesan),
		strings.TrimSpace(req.DeskripsiPekerjaan),
		strings.TrimSpace(req.Deadline),
		strings.TrimSpace(req.MulaiTanggal),
		strings.TrimSpace(req.KesepakatanBriefUang),
		strings.TrimSpace(req.KapanUangMasuk),
	)
	tickets := []store.RevisionTicket{}
	if RevisionTicketStore != nil {
		tickets = RevisionTicketStore.CreateForOrder(item.ID, 2)
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "order": item, "tickets": tickets})
}

// RevisiKlaimRequest for POST /api/revisi/klaim (public: client klaim kupon revisi).
type RevisiKlaimRequest struct {
	Code string `json:"code"`
}

// RevisiKlaim handles POST /api/revisi/klaim. Client kirim kode tiket → sekali pakai, tercatat.
func RevisiKlaim(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req RevisiKlaimRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "invalid JSON"})
		return
	}
	code := strings.TrimSpace(req.Code)
	if code == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "code required"})
		return
	}
	if RevisionTicketStore == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "service unavailable"})
		return
	}
	ticket, ok := RevisionTicketStore.Redeem(code)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":     false,
			"message": "Kode tidak valid atau sudah dipakai. Cek kembali kode tiket revisi Anda.",
		})
		return
	}
	remaining := 0
	if OrderStore != nil {
		tickets := RevisionTicketStore.ByOrderID(ticket.OrderID)
		for _, t := range tickets {
			if t.Status == "unused" {
				remaining++
			}
		}
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":            true,
		"message":       "Tiket revisi berhasil diklaim. Tim akan memproses revisi Anda.",
		"order_id":      ticket.OrderID,
		"revisi_ke":     ticket.Sequence,
		"sisa_revisi":   remaining,
	})
}

// OrdersDelete handles DELETE /api/admin/orders?id=xxx.
func OrdersDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := r.URL.Query().Get("id")
	if id == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	if OrderStore == nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	ok := OrderStore.Delete(id)
	w.Header().Set("Content-Type", "application/json")
	if ok {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true})
	} else {
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "not found"})
	}
}
