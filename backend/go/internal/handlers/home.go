package handlers

import (
	"encoding/json"
	"net/http"
)

// HomeResponse is the root API response.
type HomeResponse struct {
	Message string `json:"message"`
	Docs    string `json:"docs"`
}

// Home returns a simple welcome and pointer to docs.
func Home(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(HomeResponse{
		Message: "Rasya Production API",
		Docs:    "/health",
	})
}
