package handlers

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"backend/internal/config"
	"backend/internal/store"
)

// parseLayananJSON parses form value "layanan" as JSON array of strings; returns nil if empty/invalid.
func parseLayananJSON(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	var arr []string
	if err := json.Unmarshal([]byte(raw), &arr); err != nil {
		return nil
	}
	var out []string
	for _, s := range arr {
		s = strings.TrimSpace(s)
		if s != "" {
			out = append(out, s)
		}
	}
	return out
}

// parseToolsUsedJSON parses form value "tools_used" as JSON array of {name, desc}; returns nil if empty/invalid.
func parseToolsUsedJSON(raw string) []store.PortoTool {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	var arr []store.PortoTool
	if err := json.Unmarshal([]byte(raw), &arr); err != nil {
		return nil
	}
	var out []store.PortoTool
	for _, t := range arr {
		t.Name = strings.TrimSpace(t.Name)
		if t.Name != "" {
			t.Desc = strings.TrimSpace(t.Desc)
			out = append(out, t)
		}
	}
	return out
}

var PortoStore *store.PortoStore
var PortoCfg *config.Config

// PortoList handles GET /api/porto (public).
func PortoList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if PortoStore == nil {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "porto": []store.PortoItem{}})
		return
	}
	list := PortoStore.List()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "porto": list})
}

// PortoListAdmin handles GET /api/admin/porto (includes closed items).
func PortoListAdmin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if PortoStore == nil {
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "porto": []store.PortoItem{}})
		return
	}
	list := PortoStore.ListAll()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "porto": list})
}

// PortoAdd handles POST /api/admin/porto (multipart: title, tag, description, image).
func PortoAdd(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if PortoStore == nil || PortoCfg == nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "invalid form or file too large (max 10MB)"})
		return
	}
	title := strings.TrimSpace(r.FormValue("title"))
	tag := strings.TrimSpace(r.FormValue("tag"))
	description := strings.TrimSpace(r.FormValue("description"))
	linkURL := strings.TrimSpace(r.FormValue("url"))
	layanan := parseLayananJSON(r.FormValue("layanan"))
	toolsUsed := parseToolsUsedJSON(r.FormValue("tools_used"))
	if title == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "title required"})
		return
	}
	imageURL := ""
	file, header, err := r.FormFile("image")
	if err == nil {
		defer file.Close()
		dir := filepath.Join(PortoCfg.UploadDir, "porto")
		if err := os.MkdirAll(dir, 0755); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		ext := filepath.Ext(header.Filename)
		if ext == "" {
			ext = ".jpg"
		}
		safeExt := strings.TrimPrefix(strings.ToLower(ext), ".")
		if safeExt != "jpg" && safeExt != "jpeg" && safeExt != "png" && safeExt != "gif" && safeExt != "webp" {
			safeExt = "jpg"
		}
		filename := uniqueFilename() + "." + safeExt
		path := filepath.Join(dir, filename)
		dst, err := os.Create(path)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer dst.Close()
		if _, err := io.Copy(dst, file); err != nil {
			os.Remove(path)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		imageURL = "/uploads/porto/" + filename
	}
	item := PortoStore.Add(title, tag, description, imageURL, linkURL, layanan, toolsUsed)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "porto": item})
}

func uniqueFilename() string {
	b := make([]byte, 4)
	rand.Read(b)
	return fmt.Sprintf("%d%x", time.Now().UnixNano(), b)
}

// PortoDelete handles DELETE /api/admin/porto?id=xxx.
func PortoDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := r.URL.Query().Get("id")
	if id == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	if PortoStore == nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	ok := PortoStore.Delete(id)
	w.Header().Set("Content-Type", "application/json")
	if ok {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true})
	} else {
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "not found"})
	}
}

type PortoSetClosedRequest struct {
	ID     string `json:"id"`
	Closed bool   `json:"closed"`
}

// PortoSetClosed handles POST /api/admin/porto/close.
func PortoSetClosed(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req PortoSetClosedRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"ok":false,"message":"invalid JSON"}`, http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.ID) == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "id required"})
		return
	}
	if PortoStore == nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	ok := PortoStore.SetClosed(strings.TrimSpace(req.ID), req.Closed)
	w.Header().Set("Content-Type", "application/json")
	if ok {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "closed": req.Closed})
	} else {
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "message": "not found"})
	}
}