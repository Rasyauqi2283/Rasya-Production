package handlers

import (
	"encoding/json"
	"net/http"
)

// DonationsListAll handles GET /api/admin/donations (all donations + ulasan, for Rasya only).
func DonationsListAll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if DonateStore == nil {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "donations": []interface{}{}})
		return
	}
	list := DonateStore.ListAll()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "donations": list})
}
