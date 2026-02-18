package handlers

import (
	"encoding/json"
	"net/http"

	"backend/internal/store"
)

var AnalitikStore *store.AnalitikStore

// AnalitikList handles GET /api/analitik (public). Returns items by category (only non-closed) for overlay.
func AnalitikList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if AnalitikStore == nil {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "items": map[string][]store.AnalitikItem{}})
		return
	}
	byCat := AnalitikStore.List()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "items": byCat})
}

// AnalitikListAdmin handles GET /api/admin/analitik. Returns all items for Kelola Dashboard Analitik.
func AnalitikListAdmin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if AnalitikStore == nil {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "items": []store.AnalitikItem{}})
		return
	}
	list := AnalitikStore.ListAll()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "items": list})
}

// AnalitikAddRequest for POST /api/admin/analitik.
type AnalitikAddRequest struct {
	Category string `json:"category"`
	Name     string `json:"name"`
	Desc     string `json:"desc"`
}

// AnalitikAdd handles POST /api/admin/analitik.
func AnalitikAdd(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req AnalitikAddRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"ok":false,"message":"invalid JSON"}`, http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "name required"})
		return
	}
	cat := store.NormalizeAnalitikCategory(req.Category)
	if AnalitikStore == nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	it, ok := AnalitikStore.Add(cat, req.Name, req.Desc)
	w.Header().Set("Content-Type", "application/json")
	if ok {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "item": it})
	} else {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "add failed"})
	}
}

// AnalitikUpdateRequest for PUT /api/admin/analitik.
type AnalitikUpdateRequest struct {
	ID       string `json:"id"`
	Category string `json:"category"`
	Name     string `json:"name"`
	Desc     string `json:"desc"`
}

// AnalitikUpdate handles PUT /api/admin/analitik.
func AnalitikUpdate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req AnalitikUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"ok":false,"message":"invalid JSON"}`, http.StatusBadRequest)
		return
	}
	if req.ID == "" || req.Name == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "id and name required"})
		return
	}
	cat := store.NormalizeAnalitikCategory(req.Category)
	if AnalitikStore == nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	ok := AnalitikStore.Update(req.ID, cat, req.Name, req.Desc)
	w.Header().Set("Content-Type", "application/json")
	if ok {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true})
	} else {
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "not found"})
	}
}

// AnalitikSetClosedRequest for POST /api/admin/analitik/close.
type AnalitikSetClosedRequest struct {
	ID     string `json:"id"`
	Closed bool   `json:"closed"`
}

// AnalitikSetClosed handles POST /api/admin/analitik/close.
func AnalitikSetClosed(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req AnalitikSetClosedRequest
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
	if AnalitikStore == nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	ok := AnalitikStore.SetClosed(req.ID, req.Closed)
	w.Header().Set("Content-Type", "application/json")
	if ok {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "closed": req.Closed})
	} else {
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "not found"})
	}
}

// AnalitikDelete handles DELETE /api/admin/analitik?id=...
func AnalitikDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := r.URL.Query().Get("id")
	if id == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	if AnalitikStore == nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	ok := AnalitikStore.Delete(id)
	w.Header().Set("Content-Type", "application/json")
	if ok {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true})
	} else {
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "not found"})
	}
}
