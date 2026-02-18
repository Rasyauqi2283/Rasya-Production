package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"backend/internal/store"
)

var OrderStore *store.OrderStore

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

// OrdersListAll handles GET /api/admin/orders (full list for admin).
func OrdersListAll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if OrderStore == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "orders": []store.OrderItem{}})
		return
	}
	list := OrderStore.List()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "orders": list})
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
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "order": item})
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
