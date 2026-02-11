package pdf

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/jung-kurt/gofpdf/v2"
)

// AgreementData holds all fill-in fields for the perjanjian pemberian jasa PDF.
type AgreementData struct {
	// Header
	NomorPerjanjian string `json:"nomor_perjanjian"` // e.g. "001 / RP-PJ / I / 2025"
	Tanggal         string `json:"tanggal"`         // e.g. "5 Februari 2025"
	Hari            string `json:"hari"`            // e.g. "Rabu"
	HariNum         string `json:"hari_num"`         // e.g. "5"
	Bulan           string `json:"bulan"`            // e.g. "Februari"
	Tahun           string `json:"tahun"`            // e.g. "2025"
	Tempat          string `json:"tempat"`           // e.g. "Jakarta"

	// Pihak Pertama (Penyedia Jasa)
	P1Nama     string `json:"p1_nama"`
	P1Alamat   string `json:"p1_alamat"`
	P1Email    string `json:"p1_email"`
	P1Telepon  string `json:"p1_telepon"`

	// Pihak Kedua (Klien)
	P2Nama     string `json:"p2_nama"`
	P2Jabatan  string `json:"p2_jabatan"`
	P2Alamat   string `json:"p2_alamat"`
	P2Email    string `json:"p2_email"`
	P2Telepon  string `json:"p2_telepon"`

	// Nilai & pembayaran
	NilaiProyekAngka  string `json:"nilai_proyek_angka"`  // e.g. "5.000.000"
	NilaiProyekTerbilang string `json:"nilai_proyek_terbilang"` // e.g. "Lima juta rupiah"
	DPPercent         string `json:"dp_percent"`
	DPAmount          string `json:"dp_amount"`
	Termin2Percent    string `json:"termin2_percent"`
	Termin2Amount     string `json:"termin2_amount"`
	Termin2Waktu      string `json:"termin2_waktu"`
	PelunasanPercent  string `json:"pelunasan_percent"`
	PelunasanAmount   string `json:"pelunasan_amount"`
	BankName          string `json:"bank_name"`
	BankNumber        string `json:"bank_number"`
	BankAccount       string `json:"bank_account"`
	KeterlambatanHari string `json:"keterlambatan_hari"` // e.g. "14 (empat belas)"

	// Revisi & tenggat
	RevisiPutaran   string `json:"revisi_putaran"`   // e.g. "2 (dua)"
	RevisiHari      string `json:"revisi_hari"`     // e.g. "7 (tujuh)"
	KonfirmasiHari  string `json:"konfirmasi_hari"`  // e.g. "5"
	SerahTerimaHari string `json:"serah_terima_hari"` // e.g. "7 (tujuh)"
	TanggungJawabHari string `json:"tanggung_jawab_hari"` // e.g. "14 (empat belas)"
	PemutusanHari   string `json:"pemutusan_hari"`   // e.g. "14 (empat belas)"
}

func clean(s string) string {
	s = strings.ReplaceAll(s, "\u2014", "-") // em dash
	s = strings.ReplaceAll(s, "\u2013", "-") // en dash
	s = strings.ReplaceAll(s, "\u201c", "\"")
	s = strings.ReplaceAll(s, "\u201d", "\"")
	return s
}

// GenerateAgreementPDF returns PDF bytes for the perjanjian document.
func GenerateAgreementPDF(data *AgreementData) ([]byte, error) {
	if data == nil {
		data = &AgreementData{}
	}
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(20, 18, 20)
	pdf.SetAutoPageBreak(true, 15)
	pdf.AddPage()
	pdf.SetFont("Helvetica", "", 10)

	write := func(s string) {
		pdf.MultiCell(0, 6, clean(s), "", "L", false)
	}
	writeBold := func(s string) {
		pdf.SetFont("Helvetica", "B", 10)
		pdf.MultiCell(0, 6, clean(s), "", "L", false)
		pdf.SetFont("Helvetica", "", 10)
	}
	// Title
	pdf.SetFont("Helvetica", "B", 12)
	pdf.CellFormat(0, 8, "PERJANJIAN PEMBERIAN JASA", "", 1, "C", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	pdf.Ln(2)
	write("Rasya Production - Layanan Kreatif & Digital")
	pdf.Ln(6)
	write(fmt.Sprintf("Nomor: %s", data.NomorPerjanjian))
	write(fmt.Sprintf("Tanggal: %s", data.Tanggal))
	pdf.Ln(6)

	write(fmt.Sprintf("Pada hari ini, %s, tanggal %s bulan %s tahun %s, bertempat di %s, telah dibuat perjanjian pemberian jasa (selanjutnya \"Perjanjian\") oleh dan antara:",
		data.Hari, data.HariNum, data.Bulan, data.Tahun, data.Tempat))
	pdf.Ln(6)

	writeBold("PIHAK PERTAMA (PENYEDIA JASA)")
	write(fmt.Sprintf("Nama                    : %s", data.P1Nama))
	write("Bertindak sebagai        : Rasya Production")
	write(fmt.Sprintf("Alamat                  : %s", data.P1Alamat))
	write(fmt.Sprintf("E-mail                  : %s", data.P1Email))
	write(fmt.Sprintf("No. Telepon / WhatsApp   : %s", data.P1Telepon))
	write("Selanjutnya disebut \"Pihak Pertama\" atau \"Penyedia Jasa\".")
	pdf.Ln(4)

	writeBold("PIHAK KEDUA (KLIEN)")
	write(fmt.Sprintf("Nama / Nama Perusahaan  : %s", data.P2Nama))
	write(fmt.Sprintf("Jabatan (jika ada)      : %s", data.P2Jabatan))
	write(fmt.Sprintf("Alamat                  : %s", data.P2Alamat))
	write(fmt.Sprintf("E-mail                  : %s", data.P2Email))
	write(fmt.Sprintf("No. Telepon / WhatsApp  : %s", data.P2Telepon))
	write("Selanjutnya disebut \"Pihak Kedua\" atau \"Klien\".")
	pdf.Ln(4)
	write("Pihak Pertama dan Pihak Kedua secara bersama disebut \"Para Pihak\".")
	pdf.Ln(6)

	writeBold("PASAL 1 - MAKSUD DAN RUANG LINGKUP")
	write("1.1. Pihak Pertama menyediakan jasa dalam bidang kreatif, desain, konten, dan/atau solusi digital (termasuk namun tidak terbatas pada: desain grafis, pengembangan website/aplikasi, konten kreatif, dan layanan terkait) sesuai dengan Surat Pesanan / Order atau kesepakatan tertulis yang menjadi lampiran Perjanjian ini.")
	write("1.2. Ruang lingkup pekerjaan, spesifikasi teknis, jumlah revisi yang disepakati, dan tenggat waktu disesuaikan dengan Lampiran Scope of Work atau Surat Pesanan yang telah disetujui kedua belah pihak. Perubahan ruang lingkup wajib disepakati secara tertulis (e-mail sah sebagai bukti apabila kedua pihak mengakui).")
	write("1.3. Pihak Pertama tidak berkewajiban mengerjakan pekerjaan di luar ruang lingkup yang telah disepakati, kecuali ada addendum atau surat kesepakatan tambahan.")
	pdf.Ln(4)

	writeBold("PASAL 2 - NILAI DAN PEMBAYARAN")
	write(fmt.Sprintf("2.1. Nilai proyek sebesar Rp %s (%s) sesuai rincian dalam Surat Pesanan / Lampiran.",
		data.NilaiProyekAngka, data.NilaiProyekTerbilang))
	write("2.2. Pembayaran dilakukan sesuai skema yang disepakati, misalnya:")
	pdf.Ln(2)
	// Table header
	pdf.SetFont("Helvetica", "B", 9)
	pdf.CellFormat(15, 7, "Tahap", "1", 0, "C", false, 0, "")
	pdf.CellFormat(55, 7, "Keterangan", "1", 0, "L", false, 0, "")
	pdf.CellFormat(35, 7, "Jumlah", "1", 0, "L", false, 0, "")
	pdf.CellFormat(50, 7, "Waktu", "1", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 9)
	pdf.CellFormat(15, 7, "I", "1", 0, "C", false, 0, "")
	pdf.CellFormat(55, 7, "Uang muka (DP)", "1", 0, "L", false, 0, "")
	pdf.CellFormat(35, 7, data.DPPercent+" / Rp "+data.DPAmount, "1", 0, "L", false, 0, "")
	pdf.CellFormat(50, 7, "Sebelum pekerjaan dimulai", "1", 1, "L", false, 0, "")
	pdf.CellFormat(15, 7, "II", "1", 0, "C", false, 0, "")
	pdf.CellFormat(55, 7, "Termin progress", "1", 0, "L", false, 0, "")
	pdf.CellFormat(35, 7, data.Termin2Percent+" / Rp "+data.Termin2Amount, "1", 0, "L", false, 0, "")
	pdf.CellFormat(50, 7, data.Termin2Waktu, "1", 1, "L", false, 0, "")
	pdf.CellFormat(15, 7, "III", "1", 0, "C", false, 0, "")
	pdf.CellFormat(55, 7, "Pelunasan", "1", 0, "L", false, 0, "")
	pdf.CellFormat(35, 7, data.PelunasanPercent+" / Rp "+data.PelunasanAmount, "1", 0, "L", false, 0, "")
	pdf.CellFormat(50, 7, "Saat serah terima / sesuai kesepakatan", "1", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	pdf.Ln(2)
	write("2.3. Pembayaran dilakukan melalui transfer bank ke rekening Pihak Pertama:")
	write(fmt.Sprintf("   Bank: %s | Nomor Rekening: %s | Atas Nama: %s", data.BankName, data.BankNumber, data.BankAccount))
	write("2.4. Pekerjaan baru dimulai setelah Pihak Pertama menerima pembayaran tahap pertama (DP) sesuai Pasal 2.2. Keterlambatan pembayaran tahap berikutnya dapat mengakibatkan penundaan penyerahan hasil kerja tanpa dianggap kelalaian Pihak Pertama.")
	write(fmt.Sprintf("2.5. Keterlambatan pembayaran melebihi %s hari dari jadwal yang disepakati tanpa pemberitahuan yang dapat diterima, memberikan hak kepada Pihak Pertama untuk menjeda pekerjaan hingga pembayaran diterima, tanpa kewajiban ganti rugi kepada Pihak Kedua.", data.KeterlambatanHari))
	pdf.Ln(4)

	writeBold("PASAL 3 - REVISI DAN PERUBAHAN")
	write(fmt.Sprintf("3.1. Pihak Pertama menyediakan %s putaran revisi yang wajar (minor) sesuai ruang lingkup yang disepakati. Revisi dimaksud tidak termasuk perubahan mendasar konsep atau penambahan fitur baru di luar scope awal.", data.RevisiPutaran))
	write(fmt.Sprintf("3.2. Permintaan revisi disampaikan secara tertulis (e-mail/chat resmi) dalam waktu %s hari setelah penyerahan draft/hasil kerja. Revisi di luar batas putaran atau di luar batas waktu dapat dikenakan biaya tambahan berdasarkan kesepakatan tertulis.", data.RevisiHari))
	write("3.3. Perubahan besar (perluasan scope, tambahan fitur, perubahan fundamental) hanya berlaku setelah disetujui tertulis dan apabila ada penyesuaian nilai dan/atau jadwal.")
	pdf.Ln(4)

	writeBold("PASAL 4 - HAK KEKAYAAN INTELEKTUAL DAN PENGGUNAAN")
	write("4.1. Seluruh kode sumber (source code), arsitektur sistem, metode, dan aset yang telah ada sebelumnya milik Pihak Pertama tetap menjadi milik Pihak Pertama. Pihak Kedua memperoleh hak pakai atas hasil kerja (deliverables) yang diserahkan untuk keperluan proyek yang disepakati.")
	write("4.2. Setelah pelunasan pembayaran penuh, hak penggunaan atas materi final yang diserahkan (desain, konten, website/aplikasi sesuai scope) diberikan kepada Pihak Kedua untuk keperluan yang telah disepakati, kecuali ditentukan lain secara tertulis.")
	write("4.3. Pihak Pertama berhak menampilkan proyek dalam portofolio, situs web, dan materi promosi Rasya Production, kecuali Pihak Kedua menyatakan keberatan tertulis sebelum penandatanganan Perjanjian.")
	pdf.Ln(4)

	writeBold("PASAL 5 - KEWAJIBAN KLIEN")
	write("5.1. Pihak Kedua wajib menyediakan bahan, data, aset (logo, teks, gambar, akses) yang diperlukan untuk pelaksanaan pekerjaan tepat waktu. Keterlambatan penyediaan bahan dapat mengakibatkan pergeseran jadwal tanpa dianggap kelalaian Pihak Pertama.")
	write(fmt.Sprintf("5.2. Pihak Kedua wajib menanggapi konfirmasi, draft, dan permintaan klarifikasi dari Pihak Pertama dalam waktu wajar (%s hari kerja) agar proyek dapat diselesaikan sesuai jadwal.", data.KonfirmasiHari))
	pdf.Ln(4)

	writeBold("PASAL 6 - SERAH TERIMA DAN PENERIMAAN")
	write(fmt.Sprintf("6.1. Pihak Pertama menyerahkan hasil kerja sesuai jadwal yang disepakati. Pihak Kedua wajib memberikan konfirmasi penerimaan atau daftar koreksi (revisi) dalam waktu %s hari kerja setelah penyerahan.", data.SerahTerimaHari))
	write("6.2. Apabila dalam jangka waktu tersebut Pihak Kedua tidak memberikan tanggapan tertulis, hasil kerja dianggap diterima dan kewajiban Pihak Pertama atas penyerahan dianggap selesai, kecuali terdapat cacat material yang dilaporkan kemudian dan dapat dibuktikan.")
	pdf.Ln(4)

	writeBold("PASAL 7 - PEMBATASAN TANGGUNG JAWAB")
	write(fmt.Sprintf("7.1. Tanggung jawab Pihak Pertama terbatas pada perbaikan atas cacat material pada hasil kerja yang diserahkan, sepanjang dilaporkan dalam waktu %s hari kerja setelah serah terima dan tidak disebabkan oleh perubahan atau penggunaan di luar spesifikasi oleh Pihak Kedua.", data.TanggungJawabHari))
	write("7.2. Pihak Pertama tidak bertanggung jawab atas: (a) kerugian tidak langsung, kehilangan keuntungan, atau kerugian konsekuensial; (b) kerugian akibat keterlambatan bahan dari Pihak Kedua, force majeure, atau tindakan pihak ketiga; (c) penggunaan hasil kerja untuk keperluan yang melanggar hukum atau di luar yang disepakati.")
	write("7.3. Tanggung jawab Pihak Pertama secara kumulatif dibatasi maksimal sebesar nilai proyek yang telah dibayarkan oleh Pihak Kedua untuk proyek yang bersangkutan.")
	pdf.Ln(4)

	writeBold("PASAL 8 - KERAHASIAAN")
	write("8.1. Para Pihak menjaga kerahasiaan informasi bisnis dan data yang diperoleh sehubungan dengan proyek ini. Informasi yang secara wajar telah bersifat publik atau wajib diungkapkan berdasarkan hukum dikecualikan.")
	pdf.Ln(4)

	writeBold("PASAL 9 - PEMUTUSAN PERJANJIAN")
	write(fmt.Sprintf("9.1. Perjanjian dapat diakhiri lebih awal atas kesepakatan tertulis Para Pihak, atau apabila salah satu pihak melanggar kewajiban material dan tidak memperbaiki dalam waktu %s hari setelah teguran tertulis.", data.PemutusanHari))
	write("9.2. Apabila pemutusan dilakukan atas inisiatif Pihak Kedua (Klien membatalkan proyek): pembayaran yang telah disetor tidak dapat diminta kembali; Pihak Pertama wajib menyerahkan hasil kerja yang telah selesai hingga saat pemutusan sesuai bagian yang telah dibayar.")
	write("9.3. Apabila pemutusan dilakukan karena kelalaian Pihak Pertama yang material: Pihak Kedua berhak meminta pengembalian proporsional atas pembayaran yang belum diimbangi dengan hasil kerja, atau perbaikan dalam waktu yang disepakati.")
	pdf.Ln(4)

	writeBold("PASAL 10 - LAIN-LAIN")
	write("10.1. Hal yang belum diatur akan disepakati secara tertulis dan menjadi bagian Perjanjian ini.")
	write("10.2. Perjanjian ini tunduk pada hukum Negara Republik Indonesia. Perselisihan diselesaikan terlebih dahulu secara musyawarah; apabila tidak tercapai kesepakatan, diselesaikan melalui Pengadilan yang berwenang.")
	write("10.3. Perjanjian ini dibuat dalam 2 (dua) rangkap bermeterai cukup, masing-masing memiliki kekuatan hukum yang sama.")
	pdf.Ln(6)

	writeBold("TANDA TANGAN PARA PIHAK")
	write("Dengan ini Para Pihak menyatakan telah membaca, memahami, dan menyetujui seluruh isi Perjanjian ini.")
	pdf.Ln(6)
	pdf.CellFormat(80, 6, "PIHAK PERTAMA (Penyedia Jasa)", "0", 0, "C", false, 0, "")
	pdf.CellFormat(75, 6, "PIHAK KEDUA (Klien)", "0", 1, "C", false, 0, "")
	pdf.Ln(8)
	pdf.CellFormat(80, 6, "Rasya Production", "0", 0, "C", false, 0, "")
	pdf.CellFormat(75, 6, "", "0", 1, "C", false, 0, "")
	pdf.Ln(12)
	pdf.CellFormat(80, 6, "_________________________", "0", 0, "C", false, 0, "")
	pdf.CellFormat(75, 6, "_________________________", "0", 1, "C", false, 0, "")
	pdf.CellFormat(80, 5, "(...................................)", "0", 0, "C", false, 0, "")
	pdf.CellFormat(75, 5, "(...................................)", "0", 1, "C", false, 0, "")
	pdf.CellFormat(80, 5, "Tanggal: .......................", "0", 0, "C", false, 0, "")
	pdf.CellFormat(75, 5, "Tanggal: .......................", "0", 1, "C", false, 0, "")
	pdf.Ln(6)
	write("Lampiran (wajib dilampirkan saat penandatanganan): Lampiran A - Surat Pesanan / Order; Lampiran B - Scope of Work (SOW) jika ada.")
	pdf.Ln(4)
	write("Dokumen ini adalah kerangka perjanjian standar Rasya Production. Untuk proyek dengan nilai atau risiko khusus, disarankan konsultasi dengan konsultan hukum.")

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
