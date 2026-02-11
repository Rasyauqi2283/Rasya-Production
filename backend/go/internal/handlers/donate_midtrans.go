package handlers

import (
	"bytes"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"backend/internal/store"
)

const midtransSandboxURL = "https://app.sandbox.midtrans.com/snap/v1/transactions"
const midtransProductionURL = "https://app.midtrans.com/snap/v1/transactions"

// DonateCreateTransactionRequest is the body for POST /api/donate/create-transaction.
type DonateCreateTransactionRequest struct {
	Amount  int    `json:"amount"`
	Comment string `json:"comment"`
	Name    string `json:"name"`
	Email   string `json:"email"`
}

// DonateCreateTransactionResponse returns snap_token for frontend Snap modal.
type DonateCreateTransactionResponse struct {
	OK         bool   `json:"ok"`
	Message    string `json:"message,omitempty"`
	SnapToken  string `json:"snap_token,omitempty"`
	OrderID    string `json:"order_id,omitempty"`
	ClientKey  string `json:"client_key,omitempty"` // untuk frontend snap.js
}

// DonateCreateTransaction creates a Midtrans Snap transaction (GoPay dll) and returns snap_token.
func DonateCreateTransaction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req DonateCreateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"ok":false,"message":"invalid JSON"}`, http.StatusBadRequest)
		return
	}
	if req.Amount < 1000 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "amount minimal 1000"})
		return
	}
	if DonateCfg == nil || DonateCfg.MidtransServerKey == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"ok": false, "message": "GoPay/Midtrans belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di backend.",
		})
		return
	}

	orderID := fmt.Sprintf("donate-%d-%s", time.Now().Unix(), randomHex(6))
	baseURL := midtransSandboxURL
	if DonateCfg.MidtransIsProduction {
		baseURL = midtransProductionURL
	}

	// Midtrans Snap request body
	payload := map[string]interface{}{
		"transaction_details": map[string]interface{}{
			"order_id":     orderID,
			"gross_amount": req.Amount,
		},
		"customer_details": map[string]interface{}{
			"first_name": req.Name,
			"email":      req.Email,
		},
		"enabled_payments": []string{"gopay"},
		"custom_field1":    req.Name,
		"custom_field2":    req.Email,
		"custom_field3":    req.Comment,
	}
	body, _ := json.Marshal(payload)

	httpReq, err := http.NewRequest(http.MethodPost, baseURL, bytes.NewReader(body))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "failed to create request"})
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	httpReq.SetBasicAuth(DonateCfg.MidtransServerKey, "")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "request to payment gateway failed"})
		return
	}
	defer resp.Body.Close()

	var snapResp struct {
		Token string `json:"token"`
		Error string `json:"error_messages,omitempty"`
	}
	_ = json.NewDecoder(resp.Body).Decode(&snapResp)
	if snapResp.Token == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "payment gateway tidak mengembalikan token"})
		return
	}

	out := DonateCreateTransactionResponse{
		OK:        true,
		SnapToken: snapResp.Token,
		OrderID:   orderID,
		ClientKey: DonateCfg.MidtransClientKey,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(out)
}

func randomHex(n int) string {
	const hex = "0123456789abcdef"
	b := make([]byte, n)
	_, _ = rand.Read(b)
	for i := range b {
		b[i] = hex[b[i]%16]
	}
	return string(b)
}

func parseGrossAmount(v interface{}) int {
	if v == nil {
		return 0
	}
	switch x := v.(type) {
	case string:
		var n int
		_, _ = fmt.Sscanf(x, "%d", &n)
		return n
	case float64:
		return int(x)
	case int:
		return x
	case int64:
		return int(x)
	default:
		return 0
	}
}

// MidtransNotification is the webhook payload from Midtrans.
type MidtransNotification struct {
	TransactionStatus string      `json:"transaction_status"`
	OrderID           string      `json:"order_id"`
	GrossAmount       interface{} `json:"gross_amount"` // Midtrans bisa kirim string "50000.00" atau number
	CustomField1      string      `json:"custom_field1"`
	CustomField2      string      `json:"custom_field2"`
	CustomField3      string      `json:"custom_field3"`
}

// DonateWebhook handles POST /api/donate/webhook (Midtrans notification).
func DonateWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var notif MidtransNotification
	if err := json.NewDecoder(r.Body).Decode(&notif); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}
	// Idempotency: jangan tambah dua kali untuk order_id yang sama
	if DonateStore != nil {
		if _, exists := DonateStore.FindByOrderID(notif.OrderID); exists {
			w.WriteHeader(http.StatusOK)
			return
		}
	}
	// Hanya simpan saat pembayaran berhasil (settlement) atau pending (GoPay kadang pending dulu)
	status := strings.ToLower(notif.TransactionStatus)
	if status != "settlement" && status != "pending" {
		w.WriteHeader(http.StatusOK)
		return
	}
	amount := parseGrossAmount(notif.GrossAmount)
	if amount <= 0 {
		w.WriteHeader(http.StatusOK)
		return
	}
	threshold := highlightThresholdIDR
	if DonateCfg != nil && DonateCfg.DonateHighlight > 0 {
		threshold = DonateCfg.DonateHighlight
	}
	highlighted := amount >= threshold
	d := store.Donation{
		OrderID:     notif.OrderID,
		Amount:      amount,
		Comment:     notif.CustomField3,
		Name:        notif.CustomField1,
		Email:       notif.CustomField2,
		Highlighted: highlighted,
	}
	if DonateStore != nil {
		DonateStore.Add(d)
	}
	w.WriteHeader(http.StatusOK)
}
