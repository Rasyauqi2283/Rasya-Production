package handlers

import (
	"encoding/json"
	"net/http"

	"backend/internal/config"
	"backend/internal/store"
)

const highlightThresholdIDR = 50000

// DonateRequest is the JSON body for POST /api/donate.
type DonateRequest struct {
	Amount  int    `json:"amount"`
	Comment string `json:"comment"`
	Name    string `json:"name"`
	Email   string `json:"email"`
}

// DonateResponse is returned after successful donate.
type DonateResponse struct {
	OK          bool   `json:"ok"`
	Message     string `json:"message"`
	BankName    string `json:"bank_name,omitempty"`
	BankNumber  string `json:"bank_number,omitempty"`
	BankAccount string `json:"bank_account,omitempty"`
	Highlighted bool   `json:"highlighted"`
}

// DonateStore is the in-memory store (injected in main).
var DonateStore *store.Store

// DonateCfg is config (injected in main).
var DonateCfg *config.Config

// DonatePost handles POST /api/donate.
func DonatePost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req DonateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"ok":false,"message":"invalid JSON"}`, http.StatusBadRequest)
		return
	}
	if req.Amount < 0 {
		http.Error(w, `{"ok":false,"message":"amount must be >= 0"}`, http.StatusBadRequest)
		return
	}

	threshold := highlightThresholdIDR
	if DonateCfg != nil && DonateCfg.DonateHighlight > 0 {
		threshold = DonateCfg.DonateHighlight
	}
	highlighted := req.Amount >= threshold

	d := store.Donation{
		Amount:      req.Amount,
		Comment:     req.Comment,
		Name:        req.Name,
		Email:       req.Email,
		Highlighted: highlighted,
	}
	if DonateStore != nil {
		DonateStore.Add(d)
	}

	resp := DonateResponse{
		OK:          true,
		Message:     "Terima kasih. Silakan transfer ke rekening di bawah.",
		BankName:    "",
		BankNumber:  "",
		BankAccount: "",
		Highlighted: highlighted,
	}
	if DonateCfg != nil {
		resp.BankName = DonateCfg.BankName
		resp.BankNumber = DonateCfg.BankNumber
		resp.BankAccount = DonateCfg.BankAccount
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
