package handlers

import (
	"encoding/json"
	"net/http"
)

// HealthResponse is the JSON shape of /health.
type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
}

// Health returns service health for load balancers and monitoring.
func Health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(HealthResponse{
		Status:  "ok",
		Service: "rasya-production-api",
	})
}
