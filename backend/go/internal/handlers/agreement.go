package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"unicode"

	"backend/internal/pdf"
	"time"
)

// buildAgreementFilename returns a unique filename: nama pihak kedua (klien) + nomor perjanjian.
// Example: raisa_002-RP-PJ-I-2026.pdf (slash in nomor replaced with dash for filesystem).
func buildAgreementFilename(p2Nama, nomorPerjanjian string) string {
	safeName := strings.Map(func(r rune) rune {
		if r == ' ' || r == '\t' {
			return '_'
		}
		if r >= 'a' && r <= 'z' || r >= '0' && r <= '9' || r == '-' || r == '_' {
			return r
		}
		if r >= 'A' && r <= 'Z' {
			return unicode.ToLower(r)
		}
		return -1
	}, strings.TrimSpace(p2Nama))
	safeName = strings.Trim(safeName, "_")
	// Nomor: ganti / dengan - (contoh: 002/RP-PJ/I/2026 -> 002-RP-PJ-I-2026)
	safeNomor := strings.Map(func(r rune) rune {
		if r == '/' {
			return '-'
		}
		if r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' || r == '-' || r == '_' {
			return r
		}
		return -1
	}, strings.TrimSpace(nomorPerjanjian))
	safeNomor = strings.Trim(safeNomor, "-_")

	if safeName != "" && safeNomor != "" {
		return safeName + "_" + safeNomor + ".pdf"
	}
	if safeNomor != "" {
		return safeNomor + ".pdf"
	}
	if safeName != "" {
		return safeName + "_perjanjian.pdf"
	}
	return "perjanjian-jasa-standar.pdf"
}

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
	if data.Tier == "" {
		data.Tier = "standar"
	}

	// GenerateAgreementPDF routes to Full or Lite based on tier
	pdfBytes, err := pdf.GenerateAgreementPDF(&data)
	if err != nil {
		http.Error(w, `{"ok":false,"message":"failed to generate PDF"}`, http.StatusInternalServerError)
		return
	}

	// Filename unik: nama pihak kedua (klien) + nomor perjanjian (contoh: raisa_002-RP-PJ-I-2026.pdf)
	filename := buildAgreementFilename(data.P2Nama, data.NomorPerjanjian)
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=\""+filename+"\"")
	w.Header().Set("Content-Length", strconv.Itoa(len(pdfBytes)))
	w.WriteHeader(http.StatusOK)
	w.Write(pdfBytes)
}

// AgreementSamplePDF handles GET /api/admin/agreement/sample?tier=standar|profesional
func AgreementSamplePDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	tier := strings.ToLower(r.URL.Query().Get("tier"))
	if tier != "profesional" {
		tier = "standar"
	}

	now := time.Now()
	data := &pdf.AgreementData{
		Tier:                 tier,
		NomorPerjanjian:      "001/RP-PJ/I/2026",
		Tanggal:              now.Format("2 January 2006"),
		Hari:                 now.Format("Monday"),
		HariNum:              now.Format("2"),
		Bulan:                now.Format("January"),
		Tahun:                now.Format("2006"),
		Tempat:               "Jakarta",
		P1Nama:               "[Nama Penyedia Jasa]",
		P1Alamat:             "[Alamat]",
		P1Email:              "[email@contoh.com]",
		P1Telepon:            "[No. Telepon / WhatsApp]",
		P2Nama:               "[Nama / Nama Perusahaan Klien]",
		P2Jabatan:            "[Jabatan jika ada]",
		P2Alamat:             "[Alamat klien]",
		P2Email:              "[email klien]",
		P2Telepon:            "[No. Telepon klien]",
		NilaiProyekAngka:     "5.000.000",
		NilaiProyekTerbilang: "Lima juta rupiah",
		DPPercent:            "30",
		DPAmount:             "1.500.000",
		Termin2Percent:       "40",
		Termin2Amount:        "2.000.000",
		Termin2Waktu:         "Saat progress 50%",
		PelunasanPercent:     "30",
		PelunasanAmount:      "1.500.000",
		BankName:             "Bank Contoh",
		BankNumber:           "1234567890",
		BankAccount:          "Rasya Production",
		KeterlambatanHari:    "14 (empat belas)",
		RevisiPutaran:        "2 (dua)",
		RevisiHari:           "7 (tujuh)",
		KonfirmasiHari:       "5",
		SerahTerimaHari:      "7 (tujuh)",
		TanggungJawabHari:    "14 (empat belas)",
		PemutusanHari:        "14 (empat belas)",
	}

	// Extra sample data for profesional tier
	if tier == "profesional" {
		data.SLAResponseTime = "1x24 jam kerja"
		data.SLAUptime = "99.5%"
		data.MilestoneDetail = "Milestone 1: Desain mockup; Milestone 2: Development; Milestone 3: Testing & deployment"
		data.NonCompeteBulan = "" // opsional, kosong di sample
		data.DataProtectionPIC = "[PIC Data Protection]"
		data.EscalationPIC1 = "[Project Manager - Tingkat Operasional]"
		data.EscalationPIC2 = "[Direktur - Tingkat Manajerial]"
	}

	pdfBytes, err := pdf.GenerateAgreementPDF(data)
	if err != nil {
		http.Error(w, `{"ok":false,"message":"failed to generate sample"}`, http.StatusInternalServerError)
		return
	}

	var label string
	if tier == "profesional" {
		label = "contoh-perjanjian-jasa-profesional.pdf"
	} else {
		label = "contoh-perjanjian-jasa-standar.pdf"
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "inline; filename=\""+label+"\"")
	w.Header().Set("Content-Length", strconv.Itoa(len(pdfBytes)))
	w.WriteHeader(http.StatusOK)
	w.Write(pdfBytes)
}
