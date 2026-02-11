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
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
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
	_, label := TaperStore.VerifyOTP(otpCode)

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

	pdfBytes, _ := io.ReadAll(pdfFile)
	sigBytes, _ := io.ReadAll(sigFile)
	processedSig, err := processSignatureImage(sigBytes)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"ok": "false", "message": "Gambar tanda tangan tidak valid"})
		return
	}

	signedPDF, err := overlaySignatureOnPDF(pdfBytes, processedSig)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"ok": "false", "message": "Gagal menempatkan tanda tangan pada PDF"})
		return
	}

	// Save to disk and register in store
	uploadDir := "uploads"
	if TaperCfg != nil && TaperCfg.UploadDir != "" {
		uploadDir = TaperCfg.UploadDir
	}
	signedDir := filepath.Join(uploadDir, "signed")
	_ = os.MkdirAll(signedDir, 0755)
	baseName := "perjanjian-ditandatangani"
	if pdfHeader != nil && pdfHeader.Filename != "" {
		baseName = strings.TrimSuffix(filepath.Base(pdfHeader.Filename), filepath.Ext(pdfHeader.Filename)) + "-ditandatangani"
	}
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

// overlaySignatureOnPDF uses pdfcpu to add signature image as watermark on last page.
func overlaySignatureOnPDF(pdfBytes []byte, signaturePNG []byte) ([]byte, error) {
	// Use pdfcpu to add image watermark on last page
	// We need temp files: pdf, signature image, then AddWatermarks and read output
	dir := os.TempDir()
	pdfPath := filepath.Join(dir, "taper-in-"+fmt.Sprintf("%d", time.Now().UnixNano())+".pdf")
	sigPath := filepath.Join(dir, "taper-sig-"+fmt.Sprintf("%d", time.Now().UnixNano())+".png")
	outPath := filepath.Join(dir, "taper-out-"+fmt.Sprintf("%d", time.Now().UnixNano())+".pdf")
	defer os.Remove(pdfPath)
	defer os.Remove(sigPath)
	defer os.Remove(outPath)

	if err := os.WriteFile(pdfPath, pdfBytes, 0644); err != nil {
		return nil, err
	}
	if err := os.WriteFile(sigPath, signaturePNG, 0644); err != nil {
		return nil, err
	}

	// pdfcpu api: AddWatermarksFile(inFile, outFile, selectedPages, onTop, imageFile, desc, conf)
	// selectedPages "-1" = last page; desc e.g. "pos:br, sc:0.2" = bottom right, scale 0.2
	if err := addImageWatermarkLastPage(pdfPath, outPath, sigPath); err != nil {
		return nil, err
	}
	return os.ReadFile(outPath)
}

// addImageWatermarkLastPage adds image watermark to last page using pdfcpu (page "l" = last).
func addImageWatermarkLastPage(inFile, outFile, imageFile string) error {
	return addImageWatermarkPDFCPU(inFile, outFile, imageFile, []string{"l"})
}

func addImageWatermarkPDFCPU(inFile, outFile, imageFile string, selectedPages []string) error {
	conf := model.NewDefaultConfiguration()
	// pos:br = bottom right, sc:0.2 = scale 20%, onTop = true so signature is visible (stamp)
	return api.AddImageWatermarksFile(inFile, outFile, selectedPages, true, imageFile, "pos:br, sc:0.2", conf)
}
