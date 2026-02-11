package handlers

import (
	"encoding/json"
	"net/http"

	"backend/internal/store"
)

var ServiceStore *store.ServiceStore

// ServicesList handles GET /api/services (public). Returns all services (open + closed); frontend menampilkan closed dengan teks "closed can't order".
func ServicesList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if ServiceStore == nil {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "services": []store.Service{}})
		return
	}
	list := ServiceStore.ListAll()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "services": list})
}

// ServicesListAdmin handles GET /api/admin/services. Returns all services (including closed) for Kelola Layanan.
func ServicesListAdmin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if ServiceStore == nil {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "services": []store.Service{}})
		return
	}
	list := ServiceStore.ListAll()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "services": list})
}

// ServiceSetClosedRequest for PATCH/POST set closed state.
type ServiceSetClosedRequest struct {
	ID     string `json:"id"`
	Closed bool   `json:"closed"`
}

// ServicesSetClosed handles POST /api/admin/services/close (toggle tutup/buka layanan).
func ServicesSetClosed(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req ServiceSetClosedRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"ok":false,"message":"invalid JSON"}`, http.StatusBadRequest)
		return
	}
	if req.ID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "id required"})
		return
	}
	if ServiceStore == nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	ok := ServiceStore.SetClosed(req.ID, req.Closed)
	w.Header().Set("Content-Type", "application/json")
	if ok {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "closed": req.Closed})
	} else {
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "not found"})
	}
}

// ServiceAddRequest for POST /api/admin/services.
type ServiceAddRequest struct {
	Title     string `json:"title"`
	Tag       string `json:"tag"` // Design | Web & Digital | Konten & Kreatif | Lain-lain
	Desc      string `json:"desc"`
	PriceAwal string `json:"price_awal"`
}

// ServicesAdd handles POST /api/admin/services.
func ServicesAdd(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req ServiceAddRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"ok":false,"message":"invalid JSON"}`, http.StatusBadRequest)
		return
	}
	if req.Title == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "title required"})
		return
	}
	if ServiceStore == nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	svc := ServiceStore.Add(req.Title, req.Tag, req.Desc, req.PriceAwal)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "service": svc})
}

// ServiceUpdateRequest for PUT /api/admin/services (edit layanan).
type ServiceUpdateRequest struct {
	ID                 string `json:"id"`
	Title              string `json:"title"`
	Tag                string `json:"tag"`
	Desc               string `json:"desc"`
	PriceAwal          string `json:"price_awal"`
	DiscountPercent    int    `json:"discount_percent"`    // 0-100, 0 = tidak diskon
	PriceAfterDiscount string `json:"price_after_discount"` // teks harga setelah diskon
}

// ServicesUpdate handles PUT /api/admin/services (edit per layanan).
func ServicesUpdate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req ServiceUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"ok":false,"message":"invalid JSON"}`, http.StatusBadRequest)
		return
	}
	if req.ID == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "id required"})
		return
	}
	if req.Title == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "title required"})
		return
	}
	if ServiceStore == nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	svc, ok := ServiceStore.Update(req.ID, req.Title, req.Tag, req.Desc, req.PriceAwal, req.DiscountPercent, req.PriceAfterDiscount)
	w.Header().Set("Content-Type", "application/json")
	if ok {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "service": svc})
	} else {
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "not found"})
	}
}

// ServicesDelete handles DELETE /api/admin/services/:id.
func ServicesDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := r.URL.Query().Get("id")
	if id == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	if ServiceStore == nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	ok := ServiceStore.Delete(id)
	w.Header().Set("Content-Type", "application/json")
	if ok {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true})
	} else {
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "not found"})
	}
}
