package handlers

import (
	"encoding/json"
	"net/http"

	"backend/internal/store"
)

// ReviewsResponse is the JSON for GET /api/reviews.
type ReviewsResponse struct {
	OK      bool            `json:"ok"`
	Reviews []store.Donation `json:"reviews"`
}

// ReviewsList handles GET /api/reviews (donations < threshold with comment, for public ulasan).
func ReviewsList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	list := DonateStore.ListReviews()
	if list == nil {
		list = []store.Donation{}
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(ReviewsResponse{OK: true, Reviews: list})
}
