package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/internal/pdf"
)

// AgreementPDF handles POST /api/admin/agreement/pdf — body JSON AgreementData, returns PDF file.
func AgreementPDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var data pdf.AgreementData
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, `{"ok":false,"message":"invalid JSON"}`, http.StatusBadRequest)
		return
	}
	// Defaults for empty fields
	if data.Tanggal == "" {
		data.Tanggal = time.Now().Format("2 January 2006")
	}
	if data.Hari == "" {
		data.Hari = time.Now().Format("Monday")
	}
	if data.Bulan == "" {
		data.Bulan = time.Now().Format("January")
	}
	if data.Tahun == "" {
		data.Tahun = time.Now().Format("2006")
	}
	if data.HariNum == "" {
		data.HariNum = time.Now().Format("2")
	}
	if data.RevisiPutaran == "" {
		data.RevisiPutaran = "2 (dua)"
	}
	if data.RevisiHari == "" {
		data.RevisiHari = "7 (tujuh)"
	}
	if data.KonfirmasiHari == "" {
		data.KonfirmasiHari = "5"
	}
	if data.SerahTerimaHari == "" {
		data.SerahTerimaHari = "7 (tujuh)"
	}
	if data.TanggungJawabHari == "" {
		data.TanggungJawabHari = "14 (empat belas)"
	}
	if data.PemutusanHari == "" {
		data.PemutusanHari = "14 (empat belas)"
	}
	if data.KeterlambatanHari == "" {
		data.KeterlambatanHari = "14 (empat belas)"
	}

	pdfBytes, err := pdf.GenerateAgreementPDF(&data)
	if err != nil {
		http.Error(w, `{"ok":false,"message":"failed to generate PDF"}`, http.StatusInternalServerError)
		return
	}
	filename := "perjanjian-pemberian-jasa.pdf"
	if data.NomorPerjanjian != "" {
		safe := strings.Map(func(r rune) rune {
			if r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' || r == '-' || r == '_' {
				return r
			}
			return -1
		}, data.NomorPerjanjian)
		if safe != "" {
			filename = safe + ".pdf"
		}
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=\""+filename+"\"")
	w.Header().Set("Content-Length", strconv.Itoa(len(pdfBytes)))
	w.WriteHeader(http.StatusOK)
	w.Write(pdfBytes)
}
