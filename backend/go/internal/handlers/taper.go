package handlers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/pdfcpu/pdfcpu/pkg/api"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"

	"backend/internal/config"
	"backend/internal/store"
)

// TaperStore and TaperCfg are set from main.
var TaperStore *store.TaperStore
var TaperCfg *config.Config

const taperTokenExpiryMinutes = 20

type signaturePlacement struct {
	XRatio float64
	YRatio float64
	Scale  float64
}

// TaperVerifyRequest is the body for POST /api/taper/verify.
type TaperVerifyRequest struct {
	OTP string `json:"otp"`
}

// TaperVerifyResponse is returned after successful OTP verification.
type TaperVerifyResponse struct {
	OK    bool   `json:"ok"`
	Token string `json:"token,omitempty"`
	Msg   string `json:"message,omitempty"`
}

// TaperVerify handles POST /api/taper/verify — client submits OTP, gets signing token.
func TaperVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req TaperVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.OTP == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(TaperVerifyResponse{OK: false, Msg: "OTP wajib diisi"})
		return
	}
	req.OTP = strings.TrimSpace(req.OTP)
	if TaperStore == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(TaperVerifyResponse{OK: false, Msg: "Service tidak tersedia"})
		return
	}
	ok, label := TaperStore.VerifyOTP(req.OTP)
	_ = label
	if !ok {
		log.Printf("[taper] verify failed: OTP len=%d (invalid or expired)", len(req.OTP))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(TaperVerifyResponse{OK: false, Msg: "OTP tidak valid atau sudah kedaluwarsa"})
		return
	}
	secret := ""
	if TaperCfg != nil {
		secret = TaperCfg.JWTSecret
	}
	if secret == "" {
		secret = "taper-default-secret-change-in-production"
	}
	token, err := signTaperToken(req.OTP, secret)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(TaperVerifyResponse{OK: false, Msg: "Gagal membuat token"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(TaperVerifyResponse{OK: true, Token: token})
}

// signTaperToken creates a simple JWT-like token: base64(header).base64(claims).signature.
func signTaperToken(otpCode, secret string) (string, error) {
	exp := time.Now().UTC().Add(taperTokenExpiryMinutes * time.Minute).Unix()
	header := `{"alg":"HS256","typ":"JWT"}`
	claims := fmt.Sprintf(`{"code":"%s","exp":%d}`, otpCode, exp)
	enc := base64.RawURLEncoding
	h := enc.EncodeToString([]byte(header)) + "." + enc.EncodeToString([]byte(claims))
	sig := hmacSHA256(h, secret)
	return h + "." + enc.EncodeToString(sig), nil
}

func verifyTaperToken(token, secret string) (otpCode string, ok bool) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return "", false
	}
	enc := base64.RawURLEncoding
	gotSig, err := enc.DecodeString(parts[2])
	if err != nil {
		return "", false
	}
	wantSig := hmacSHA256(parts[0]+"."+parts[1], secret)
	if !hmacEqual(gotSig, wantSig) {
		return "", false
	}
	payload, err := enc.DecodeString(parts[1])
	if err != nil {
		return "", false
	}
	var c struct {
		Code string `json:"code"`
		Exp  int64  `json:"exp"`
	}
	if json.Unmarshal(payload, &c) != nil {
		return "", false
	}
	if c.Exp < time.Now().Unix() {
		return "", false
	}
	return c.Code, true
}

func hmacEqual(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// TaperSign handles POST /api/taper/sign — multipart: pdf, signature; returns signed PDF.
func TaperSign(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	auth := r.Header.Get("Authorization")
	token := ""
	if strings.HasPrefix(auth, "Bearer ") {
		token = strings.TrimSpace(auth[7:])
	}
	secret := ""
	if TaperCfg != nil {
		secret = TaperCfg.JWTSecret
	}
	if secret == "" {
		secret = "taper-default-secret-change-in-production"
	}
	otpCode, ok := verifyTaperToken(token, secret)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"ok": "false", "message": "Token tidak valid atau kedaluwarsa"})
		return
	}
	var label string
	if TaperStore != nil {
		_, label = TaperStore.VerifyOTP(otpCode)
	}

	// Parse multipart: pdf, signature (field names from client: pdf, signature)
	const maxMem = 32 << 20 // 32 MB
	if err := r.ParseMultipartForm(maxMem); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	var pdfFile multipart.File
	var pdfHeader *multipart.FileHeader
	var sigFile multipart.File
	for name, headers := range r.MultipartForm.File {
		if len(headers) == 0 {
			continue
		}
		h := headers[0]
		fn := strings.ToLower(h.Filename)
		if name == "pdf" || name == "document" || strings.HasSuffix(fn, ".pdf") {
			pdfFile, _ = h.Open()
			pdfHeader = h
		} else if name == "signature" || name == "sign" || strings.HasSuffix(fn, ".png") || strings.HasSuffix(fn, ".jpg") || strings.HasSuffix(fn, ".jpeg") {
			sigFile, _ = h.Open()
		}
	}
	if pdfFile == nil {
		for _, headers := range r.MultipartForm.File {
			if len(headers) > 0 && strings.HasSuffix(strings.ToLower(headers[0].Filename), ".pdf") {
				pdfFile, _ = headers[0].Open()
				pdfHeader = headers[0]
				break
			}
		}
	}
	if sigFile == nil {
		for _, headers := range r.MultipartForm.File {
			if len(headers) > 0 {
				fn := strings.ToLower(headers[0].Filename)
				if strings.HasSuffix(fn, ".png") || strings.HasSuffix(fn, ".jpg") || strings.HasSuffix(fn, ".jpeg") {
					sigFile, _ = headers[0].Open()
					break
				}
			}
		}
	}
	if pdfFile == nil || sigFile == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"ok": "false", "message": "Butuh file PDF dan gambar tanda tangan"})
		return
	}
	defer pdfFile.Close()
	defer sigFile.Close()

	previewOnly := parseBool(r.FormValue("preview_only"))
	placement := parseSignaturePlacement(
		r.FormValue("x_ratio"),
		r.FormValue("y_ratio"),
		r.FormValue("scale_ratio"),
	)

	pdfBytes, _ := io.ReadAll(pdfFile)
	sigBytes, _ := io.ReadAll(sigFile)
	processedSig, err := processSignatureImage(sigBytes)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"ok": "false", "message": "Gambar tanda tangan tidak valid"})
		return
	}

	signedPDF, err := overlaySignatureOnPDF(pdfBytes, processedSig, placement)
	if err != nil {
		log.Printf("[taper] sign overlay error: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"ok": "false", "message": "Gagal menempatkan tanda tangan pada PDF. Pastikan file PDF tidak terkunci dan format tanda tangan PNG/JPG valid."})
		return
	}

	baseName := "perjanjian-ditandatangani"
	if pdfHeader != nil && pdfHeader.Filename != "" {
		baseName = strings.TrimSuffix(filepath.Base(pdfHeader.Filename), filepath.Ext(pdfHeader.Filename)) + "-ditandatangani"
	}

	// Preview mode: return rendered PDF only, without saving into admin archive.
	if previewOnly {
		w.Header().Set("Content-Type", "application/pdf")
		w.Header().Set("Content-Disposition", "inline; filename=\"preview-"+baseName+".pdf\"")
		w.WriteHeader(http.StatusOK)
		w.Write(signedPDF)
		return
	}

	// Save to disk and register in store
	uploadDir := "uploads"
	if TaperCfg != nil && TaperCfg.UploadDir != "" {
		uploadDir = TaperCfg.UploadDir
	}
	signedDir := filepath.Join(uploadDir, "signed")
	_ = os.MkdirAll(signedDir, 0755)
	id := time.Now().UTC().Format("20060102150405")
	storedName := id + "-" + baseName + ".pdf"
	storedPath := filepath.Join(signedDir, storedName)
	if err := os.WriteFile(storedPath, signedPDF, 0644); err != nil {
		// still return PDF to client
	}
	if TaperStore != nil {
		TaperStore.AddSignedDoc(otpCode, label, storedName, "signed/"+storedName)
	}

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=\""+baseName+".pdf\"")
	w.WriteHeader(http.StatusOK)
	w.Write(signedPDF)
}

func parseBool(v string) bool {
	v = strings.TrimSpace(strings.ToLower(v))
	return v == "1" || v == "true" || v == "yes" || v == "y"
}

func parseSignaturePlacement(xRaw, yRaw, sRaw string) signaturePlacement {
	p := signaturePlacement{
		XRatio: 0.72, // default near bottom-right
		YRatio: 0.82,
		Scale:  0.20,
	}
	if x, err := strconv.ParseFloat(strings.TrimSpace(xRaw), 64); err == nil {
		p.XRatio = clampFloat(x, 0.0, 1.0)
	}
	if y, err := strconv.ParseFloat(strings.TrimSpace(yRaw), 64); err == nil {
		p.YRatio = clampFloat(y, 0.0, 1.0)
	}
	if s, err := strconv.ParseFloat(strings.TrimSpace(sRaw), 64); err == nil {
		p.Scale = clampFloat(s, 0.08, 0.5)
	}
	return p
}

func clampFloat(v, min, max float64) float64 {
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}

// processSignatureImage converts to grayscale and removes light background; returns PNG bytes.
func processSignatureImage(data []byte) ([]byte, error) {
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	bounds := img.Bounds()
	out := image.NewRGBA(bounds)
	const threshold = 240
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			c := color.RGBAModel.Convert(img.At(x, y)).(color.RGBA)
			gray := (uint32(c.R) + uint32(c.G) + uint32(c.B)) / 3
			alpha := c.A
			if gray > threshold && c.R > 235 && c.G > 235 && c.B > 235 {
				alpha = 0
			}
			out.Set(x, y, color.RGBA{R: uint8(gray), G: uint8(gray), B: uint8(gray), A: alpha})
		}
	}
	var buf bytes.Buffer
	if err := png.Encode(&buf, out); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// taperWorkDir returns a writable directory for temp PDF/signature files (e.g. on Koyeb /tmp can be restricted).
func taperWorkDir() string {
	if TaperCfg != nil && TaperCfg.UploadDir != "" {
		workDir := filepath.Join(TaperCfg.UploadDir, "taper_tmp")
		if err := os.MkdirAll(workDir, 0755); err == nil {
			return workDir
		}
	}
	return os.TempDir()
}

// overlaySignatureOnPDF uses pdfcpu to add signature image as watermark on last page.
func overlaySignatureOnPDF(pdfBytes []byte, signaturePNG []byte, placement signaturePlacement) ([]byte, error) {
	dir := taperWorkDir()
	ts := time.Now().UnixNano()
	pdfPath := filepath.Join(dir, fmt.Sprintf("taper-in-%d.pdf", ts))
	sigPath := filepath.Join(dir, fmt.Sprintf("taper-sig-%d.png", ts))
	outPath := filepath.Join(dir, fmt.Sprintf("taper-out-%d.pdf", ts))
	defer os.Remove(pdfPath)
	defer os.Remove(sigPath)
	defer os.Remove(outPath)

	if err := os.WriteFile(pdfPath, pdfBytes, 0644); err != nil {
		return nil, fmt.Errorf("write pdf temp: %w", err)
	}
	if err := os.WriteFile(sigPath, signaturePNG, 0644); err != nil {
		return nil, fmt.Errorf("write sig temp: %w", err)
	}

	if err := addImageWatermarkLastPage(pdfPath, outPath, sigPath, placement); err != nil {
		return nil, fmt.Errorf("pdfcpu watermark: %w", err)
	}
	outBytes, err := os.ReadFile(outPath)
	if err != nil {
		return nil, fmt.Errorf("read output pdf: %w", err)
	}
	return outBytes, nil
}

// addImageWatermarkLastPage adds image watermark to last page using pdfcpu (page "l" = last).
func addImageWatermarkLastPage(inFile, outFile, imageFile string, placement signaturePlacement) error {
	desc := watermarkDescriptionFromPlacement(placement)
	return addImageWatermarkPDFCPU(inFile, outFile, imageFile, []string{"l"}, desc)
}

func addImageWatermarkPDFCPU(inFile, outFile, imageFile string, selectedPages []string, description string) error {
	conf := model.NewDefaultConfiguration()
	return api.AddImageWatermarksFile(inFile, outFile, selectedPages, true, imageFile, description, conf)
}

func watermarkDescriptionFromPlacement(p signaturePlacement) string {
	// Approximate A4 portrait in PDF points (works for current generated agreements).
	// Use bottom-left anchor + offset so frontend drag coordinate can control placement.
	const pageW = 595.0
	const pageH = 842.0
	xOffset := clampFloat(p.XRatio, 0.0, 1.0) * pageW
	yOffset := (1.0 - clampFloat(p.YRatio, 0.0, 1.0)) * pageH
	scale := clampFloat(p.Scale, 0.08, 0.5)
	return fmt.Sprintf("position:bl, offset:%.2f %.2f, scalefactor:%.3f rel", xOffset, yOffset, scale)
}
