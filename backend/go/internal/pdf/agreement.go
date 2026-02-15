package pdf

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/jung-kurt/gofpdf/v2"
)

// AgreementData holds all fill-in fields for both Standar and Profesional agreements.
type AgreementData struct {
	// Tier: "standar" or "profesional" (default: "standar")
	Tier string `json:"tier"`

	// Header
	NomorPerjanjian string `json:"nomor_perjanjian"`
	Tanggal        string `json:"tanggal"`
	Hari           string `json:"hari"`
	HariNum        string `json:"hari_num"`
	Bulan          string `json:"bulan"`
	Tahun          string `json:"tahun"`
	Tempat         string `json:"tempat"`

	// Pihak Pertama (Penyedia Jasa)
	P1Nama    string `json:"p1_nama"`
	P1Alamat  string `json:"p1_alamat"`
	P1Email   string `json:"p1_email"`
	P1Telepon string `json:"p1_telepon"`

	// Pihak Kedua (Klien)
	P2Nama    string `json:"p2_nama"`
	P2Jabatan string `json:"p2_jabatan"`
	P2Alamat  string `json:"p2_alamat"`
	P2Email   string `json:"p2_email"`
	P2Telepon string `json:"p2_telepon"`

	// Nilai & pembayaran
	NilaiProyekAngka     string `json:"nilai_proyek_angka"`
	NilaiProyekTerbilang string `json:"nilai_proyek_terbilang"`
	DPPercent            string `json:"dp_percent"`
	DPAmount             string `json:"dp_amount"`
	Termin2Percent       string `json:"termin2_percent"`
	Termin2Amount        string `json:"termin2_amount"`
	Termin2Waktu         string `json:"termin2_waktu"`
	PelunasanPercent     string `json:"pelunasan_percent"`
	PelunasanAmount      string `json:"pelunasan_amount"`
	BankName             string `json:"bank_name"`
	BankNumber           string `json:"bank_number"`
	BankAccount          string `json:"bank_account"`
	KeterlambatanHari    string `json:"keterlambatan_hari"`

	// Revisi & tenggat
	RevisiPutaran     string `json:"revisi_putaran"`
	RevisiHari        string `json:"revisi_hari"`
	KonfirmasiHari    string `json:"konfirmasi_hari"`
	SerahTerimaHari   string `json:"serah_terima_hari"`
	TanggungJawabHari string `json:"tanggung_jawab_hari"`
	PemutusanHari     string `json:"pemutusan_hari"`

	// -- Fields khusus Profesional --

	// SLA
	SLAResponseTime string `json:"sla_response_time"` // e.g. "1x24 jam kerja"
	SLAUptime       string `json:"sla_uptime"`        // e.g. "99.5%" (opsional, jika ada hosting)

	// Milestone
	MilestoneDetail string `json:"milestone_detail"` // teks deskripsi milestone

	// Non-Compete (opsional)
	NonCompeteBulan string `json:"non_compete_bulan"` // e.g. "6 (enam)"; kosong = tidak ada non-compete

	// Data Protection — contact person
	DataProtectionPIC string `json:"data_protection_pic"` // PIC perlindungan data jika ada

	// Escalation
	EscalationPIC1 string `json:"escalation_pic1"` // PIC eskalasi tingkat 1
	EscalationPIC2 string `json:"escalation_pic2"` // PIC eskalasi tingkat 2
}

func clean(s string) string {
	s = strings.ReplaceAll(s, "\u2014", "-")
	s = strings.ReplaceAll(s, "\u2013", "-")
	s = strings.ReplaceAll(s, "\u201c", "\"")
	s = strings.ReplaceAll(s, "\u201d", "\"")
	return s
}

// GenerateAgreementPDF routes to Full or Lite based on Tier.
func GenerateAgreementPDF(data *AgreementData) ([]byte, error) {
	if data == nil {
		data = &AgreementData{}
	}
	if strings.ToLower(data.Tier) == "profesional" {
		return GenerateAgreementFull(data)
	}
	return GenerateAgreementLite(data)
}

// pdfHelpers bundles common write/draw functions used by both generators.
type pdfHelpers struct {
	pdf            *gofpdf.Fpdf
	write          func(s string)
	writeBold      func(s string)
	writeLabelVal  func(label, value string)
}

func newPDFDoc() (*gofpdf.Fpdf, pdfHelpers) {
	p := gofpdf.New("P", "mm", "A4", "")
	p.SetMargins(20, 18, 20)
	p.SetAutoPageBreak(true, 15)
	p.AddPage()
	p.SetFont("Helvetica", "", 10)

	write := func(s string) {
		p.MultiCell(0, 6, clean(s), "", "L", false)
	}
	writeBold := func(s string) {
		p.SetFont("Helvetica", "B", 10)
		p.MultiCell(0, 6, clean(s), "", "L", false)
		p.SetFont("Helvetica", "", 10)
	}
	const labelWidth = 58.0
	writeLabelVal := func(label, value string) {
		p.CellFormat(labelWidth, 6, label, "", 0, "R", false, 0, "")
		p.MultiCell(0, 6, " : "+clean(value), "", "L", false)
	}

	return p, pdfHelpers{pdf: p, write: write, writeBold: writeBold, writeLabelVal: writeLabelVal}
}

func writeTitle(p *gofpdf.Fpdf, title, subtitle, nomor string) {
	p.SetFont("Helvetica", "B", 13)
	p.CellFormat(0, 8, title, "", 1, "C", false, 0, "")
	titleW := p.GetStringWidth(title)
	pageW := 210.0
	centerX := pageW / 2
	pad := 10.0
	p.Line(centerX-titleW/2-pad, p.GetY()+2, centerX+titleW/2+pad, p.GetY()+2)
	p.SetY(p.GetY() + 5)
	if subtitle != "" {
		p.SetFont("Helvetica", "I", 9)
		p.CellFormat(0, 5, subtitle, "", 1, "C", false, 0, "")
	}
	p.SetFont("Helvetica", "B", 10)
	p.CellFormat(0, 6, "No: "+clean(nomor), "", 1, "C", false, 0, "")
	p.SetFont("Helvetica", "", 10)
	p.Ln(2)
}

func writeParties(h pdfHelpers, data *AgreementData) {
	h.write(fmt.Sprintf("Pada hari ini, %s, tanggal %s bulan %s tahun %s, bertempat di %s, telah dibuat perjanjian pemberian jasa (selanjutnya \"Perjanjian\") oleh dan antara:",
		data.Hari, data.HariNum, data.Bulan, data.Tahun, data.Tempat))
	h.pdf.Ln(6)

	h.writeBold("PIHAK PERTAMA (PENYEDIA JASA)")
	h.writeLabelVal("Nama", data.P1Nama)
	h.writeLabelVal("Bertindak sebagai", "Rasya Production")
	h.writeLabelVal("Alamat", data.P1Alamat)
	h.writeLabelVal("E-mail", data.P1Email)
	h.writeLabelVal("No. Telepon / WhatsApp", data.P1Telepon)
	h.write("Selanjutnya disebut \"Pihak Pertama\" atau \"Penyedia Jasa\".")
	h.pdf.Ln(4)

	h.writeBold("PIHAK KEDUA (KLIEN)")
	h.writeLabelVal("Nama / Nama Perusahaan", data.P2Nama)
	h.writeLabelVal("Jabatan (jika ada)", data.P2Jabatan)
	h.writeLabelVal("Alamat", data.P2Alamat)
	h.writeLabelVal("E-mail", data.P2Email)
	h.writeLabelVal("No. Telepon / WhatsApp", data.P2Telepon)
	h.write("Selanjutnya disebut \"Pihak Kedua\" atau \"Klien\".")
	h.pdf.Ln(4)
	h.write("Pihak Pertama dan Pihak Kedua secara bersama disebut \"Para Pihak\".")
	h.pdf.Ln(6)
}

func writePaymentTable(p *gofpdf.Fpdf, data *AgreementData) {
	p.SetFont("Helvetica", "B", 9)
	p.CellFormat(15, 7, "Tahap", "1", 0, "C", false, 0, "")
	p.CellFormat(55, 7, "Keterangan", "1", 0, "L", false, 0, "")
	p.CellFormat(35, 7, "Jumlah", "1", 0, "L", false, 0, "")
	p.CellFormat(50, 7, "Waktu", "1", 1, "L", false, 0, "")
	p.SetFont("Helvetica", "", 9)
	p.CellFormat(15, 7, "I", "1", 0, "C", false, 0, "")
	p.CellFormat(55, 7, "Uang muka (DP)", "1", 0, "L", false, 0, "")
	p.CellFormat(35, 7, data.DPPercent+" / Rp "+data.DPAmount, "1", 0, "L", false, 0, "")
	p.CellFormat(50, 7, "Sebelum pekerjaan dimulai", "1", 1, "L", false, 0, "")
	p.CellFormat(15, 7, "II", "1", 0, "C", false, 0, "")
	p.CellFormat(55, 7, "Termin progress", "1", 0, "L", false, 0, "")
	p.CellFormat(35, 7, data.Termin2Percent+" / Rp "+data.Termin2Amount, "1", 0, "L", false, 0, "")
	p.CellFormat(50, 7, data.Termin2Waktu, "1", 1, "L", false, 0, "")
	p.CellFormat(15, 7, "III", "1", 0, "C", false, 0, "")
	p.CellFormat(55, 7, "Pelunasan", "1", 0, "L", false, 0, "")
	p.CellFormat(35, 7, data.PelunasanPercent+" / Rp "+data.PelunasanAmount, "1", 0, "L", false, 0, "")
	p.CellFormat(50, 7, "Saat serah terima / sesuai kesepakatan", "1", 1, "L", false, 0, "")
	p.SetFont("Helvetica", "", 10)
	p.Ln(2)
}

func writeSignatureBlock(p *gofpdf.Fpdf, h pdfHelpers) {
	h.writeBold("TANDA TANGAN PARA PIHAK")
	h.write("Dengan ini Para Pihak menyatakan telah membaca, memahami, dan menyetujui seluruh isi Perjanjian ini.")
	p.Ln(6)
	p.CellFormat(80, 6, "PIHAK PERTAMA (Penyedia Jasa)", "0", 0, "C", false, 0, "")
	p.CellFormat(75, 6, "PIHAK KEDUA (Klien)", "0", 1, "C", false, 0, "")
	p.Ln(8)
	p.CellFormat(80, 6, "Rasya Production", "0", 0, "C", false, 0, "")
	p.CellFormat(75, 6, "", "0", 1, "C", false, 0, "")
	p.Ln(12)
	p.CellFormat(80, 6, "_________________________", "0", 0, "C", false, 0, "")
	p.CellFormat(75, 6, "_________________________", "0", 1, "C", false, 0, "")
	p.CellFormat(80, 5, "(...................................)", "0", 0, "C", false, 0, "")
	p.CellFormat(75, 5, "(...................................)", "0", 1, "C", false, 0, "")
	p.CellFormat(80, 5, "Tanggal: .......................", "0", 0, "C", false, 0, "")
	p.CellFormat(75, 5, "Tanggal: .......................", "0", 1, "C", false, 0, "")
}

// ============================================================
// FULL — Perjanjian Jasa Profesional (Master Service Agreement)
// 17 pasal, ~10-15 halaman
// ============================================================

func GenerateAgreementFull(data *AgreementData) ([]byte, error) {
	p, h := newPDFDoc()

	writeTitle(p, "PERJANJIAN JASA PROFESIONAL", "Master Service Agreement", data.NomorPerjanjian)
	h.write(fmt.Sprintf("Tanggal: %s", data.Tanggal))
	p.Ln(6)
	writeParties(h, data)

	// --- PASAL 1: MAKSUD DAN RUANG LINGKUP ---
	h.writeBold("PASAL 1 - MAKSUD DAN RUANG LINGKUP")
	h.write("1.1. Pihak Pertama menyediakan jasa dalam bidang kreatif, desain, konten, dan/atau solusi digital (termasuk namun tidak terbatas pada: desain grafis, pengembangan website/aplikasi, konten kreatif, dan layanan terkait) sesuai dengan Surat Pesanan / Order atau kesepakatan tertulis yang menjadi lampiran Perjanjian ini.")
	h.write("1.2. Ruang lingkup pekerjaan, spesifikasi teknis, jumlah revisi yang disepakati, dan tenggat waktu disesuaikan dengan Lampiran Scope of Work atau Surat Pesanan yang telah disetujui kedua belah pihak. Perubahan ruang lingkup wajib disepakati secara tertulis (e-mail sah sebagai bukti apabila kedua pihak mengakui).")
	h.write("1.3. Pihak Pertama tidak berkewajiban mengerjakan pekerjaan di luar ruang lingkup yang telah disepakati, kecuali ada addendum atau surat kesepakatan tambahan.")
	p.Ln(4)

	// --- PASAL 2: NILAI DAN PEMBAYARAN ---
	h.writeBold("PASAL 2 - NILAI DAN PEMBAYARAN")
	h.write(fmt.Sprintf("2.1. Nilai proyek sebesar Rp %s (%s) sesuai rincian dalam Surat Pesanan / Lampiran.", data.NilaiProyekAngka, data.NilaiProyekTerbilang))
	h.write("2.2. Pembayaran dilakukan sesuai skema yang disepakati:")
	p.Ln(2)
	writePaymentTable(p, data)
	h.write("2.3. Pembayaran dilakukan melalui transfer bank ke rekening Pihak Pertama:")
	h.write(fmt.Sprintf("   Bank: %s | Nomor Rekening: %s | Atas Nama: %s", data.BankName, data.BankNumber, data.BankAccount))
	h.write("2.4. Pekerjaan baru dimulai setelah Pihak Pertama menerima pembayaran tahap pertama (DP) sesuai Pasal 2.2. Keterlambatan pembayaran tahap berikutnya dapat mengakibatkan penundaan penyerahan hasil kerja tanpa dianggap kelalaian Pihak Pertama.")
	h.write(fmt.Sprintf("2.5. Keterlambatan pembayaran melebihi %s hari dari jadwal yang disepakati tanpa pemberitahuan yang dapat diterima, memberikan hak kepada Pihak Pertama untuk menjeda pekerjaan hingga pembayaran diterima, tanpa kewajiban ganti rugi kepada Pihak Kedua.", data.KeterlambatanHari))
	h.write("2.6. Keterlambatan pembayaran dikenakan denda sebesar 1% (satu persen) per minggu dari nilai tagihan tertunggak, maksimal 10% (sepuluh persen) dari total nilai tagihan yang tertunggak, atau opsi bunga yang disepakati secara tertulis.")
	p.Ln(4)

	// --- PASAL 3: MILESTONE DAN PENERIMAAN BERTAHAP ---
	h.writeBold("PASAL 3 - MILESTONE DAN PENERIMAAN BERTAHAP")
	h.write("3.1. Pekerjaan dapat dibagi ke dalam beberapa milestone sesuai Lampiran Scope of Work. Setiap milestone memiliki deliverable, tenggat waktu, dan kriteria penerimaan yang disepakati.")
	if data.MilestoneDetail != "" {
		h.write(fmt.Sprintf("3.2. Detail milestone: %s", data.MilestoneDetail))
	} else {
		h.write("3.2. Detail milestone akan ditetapkan dalam Lampiran Scope of Work atau Surat Pesanan terpisah.")
	}
	h.write(fmt.Sprintf("3.3. Pihak Kedua wajib memberikan persetujuan atau daftar koreksi dalam waktu %s hari kerja setelah penyerahan setiap milestone. Apabila dalam jangka waktu tersebut tidak ada tanggapan tertulis, milestone dianggap diterima.", data.SerahTerimaHari))
	h.write("3.4. Pembayaran termin berikutnya dapat dikaitkan dengan penerimaan milestone sebelumnya, sesuai skema di Pasal 2.")
	p.Ln(4)

	// --- PASAL 4: REVISI DAN PERUBAHAN ---
	h.writeBold("PASAL 4 - REVISI DAN PERUBAHAN")
	h.write(fmt.Sprintf("4.1. Pihak Pertama menyediakan %s putaran revisi yang wajar (minor) sesuai ruang lingkup yang disepakati. Revisi dimaksud tidak termasuk perubahan mendasar konsep atau penambahan fitur baru di luar scope awal.", data.RevisiPutaran))
	h.write(fmt.Sprintf("4.2. Permintaan revisi disampaikan secara tertulis (e-mail/chat resmi) dalam waktu %s hari setelah penyerahan draft/hasil kerja. Revisi di luar batas putaran atau di luar batas waktu dapat dikenakan biaya tambahan berdasarkan kesepakatan tertulis.", data.RevisiHari))
	h.write("4.3. Perubahan besar (perluasan scope, tambahan fitur, perubahan fundamental) hanya berlaku setelah disetujui tertulis dan apabila ada penyesuaian nilai dan/atau jadwal.")
	p.Ln(4)

	// --- PASAL 5: SERVICE LEVEL AGREEMENT (SLA) ---
	h.writeBold("PASAL 5 - SERVICE LEVEL AGREEMENT (SLA)")
	slaRT := data.SLAResponseTime
	if slaRT == "" {
		slaRT = "1x24 jam kerja"
	}
	h.write(fmt.Sprintf("5.1. Pihak Pertama berkomitmen merespons komunikasi terkait proyek (e-mail, chat resmi) dalam waktu %s, kecuali di luar hari/jam kerja yang disepakati.", slaRT))
	if data.SLAUptime != "" {
		h.write(fmt.Sprintf("5.2. Untuk layanan yang mencakup hosting atau pemeliharaan: Pihak Pertama menargetkan uptime sebesar %s per bulan, tidak termasuk downtime akibat pemeliharaan terjadwal atau force majeure.", data.SLAUptime))
	} else {
		h.write("5.2. Apabila pekerjaan mencakup layanan hosting atau pemeliharaan, target uptime dan ketentuan pemeliharaan akan diatur dalam Lampiran SLA terpisah.")
	}
	h.write("5.3. Pelanggaran SLA yang material dan berulang (lebih dari 3 kali dalam 1 bulan) memberikan hak kepada Pihak Kedua untuk mengajukan kompensasi berupa perpanjangan waktu pengerjaan atau pengurangan tagihan, sesuai kesepakatan tertulis.")
	p.Ln(4)

	// --- PASAL 6: HAK KEKAYAAN INTELEKTUAL DAN PENGGUNAAN ---
	h.writeBold("PASAL 6 - HAK KEKAYAAN INTELEKTUAL DAN PENGGUNAAN")
	h.write("6.1. Seluruh kode sumber (source code), arsitektur sistem, metode, dan aset yang telah ada sebelumnya (pre-existing assets) milik Pihak Pertama tetap menjadi milik Pihak Pertama.")
	h.write("6.2. Setelah pelunasan pembayaran penuh, hak penggunaan atas deliverables final diberikan kepada Pihak Kedua. Hak penggunaan tersebut bersifat non-eksklusif dan terbatas pada penggunaan internal/komersial sesuai tujuan proyek yang disepakati, dan tidak termasuk hak menjual ulang, sub-lisensi, atau memodifikasi secara signifikan tanpa persetujuan tertulis Pihak Pertama.")
	h.write("6.3. Pihak Pertama berhak menampilkan proyek dalam portofolio, situs web, dan materi promosi Rasya Production, kecuali Pihak Kedua menyatakan keberatan tertulis sebelum penandatanganan Perjanjian.")
	h.write("6.4. Hak cipta atas elemen desain, template, dan framework generik yang dikembangkan Pihak Pertama tetap menjadi milik Pihak Pertama dan dapat digunakan kembali untuk proyek lain.")
	p.Ln(4)

	// --- PASAL 7: KEWAJIBAN KLIEN ---
	h.writeBold("PASAL 7 - KEWAJIBAN KLIEN")
	h.write("7.1. Pihak Kedua wajib menyediakan bahan, data, aset (logo, teks, gambar, akses) yang diperlukan untuk pelaksanaan pekerjaan tepat waktu. Keterlambatan penyediaan bahan dapat mengakibatkan pergeseran jadwal tanpa dianggap kelalaian Pihak Pertama.")
	h.write(fmt.Sprintf("7.2. Pihak Kedua wajib menanggapi konfirmasi, draft, dan permintaan klarifikasi dari Pihak Pertama dalam waktu wajar (%s hari kerja) agar proyek dapat diselesaikan sesuai jadwal.", data.KonfirmasiHari))
	h.write("7.3. Pihak Kedua bertanggung jawab atas kebenaran dan legalitas konten, data, serta materi yang diserahkan kepada Pihak Pertama untuk digunakan dalam proyek.")
	p.Ln(4)

	// --- PASAL 8: PERLINDUNGAN DATA ---
	h.writeBold("PASAL 8 - PERLINDUNGAN DATA")
	h.write("8.1. Pihak Pertama wajib menjaga keamanan data dan informasi milik Pihak Kedua yang diterima dalam rangka pelaksanaan proyek, termasuk data pelanggan, data keuangan, dan data pribadi (jika ada).")
	h.write("8.2. Pihak Pertama tidak akan membagikan, menjual, atau menggunakan data tersebut untuk keperluan di luar proyek yang disepakati, kecuali diwajibkan oleh hukum.")
	h.write("8.3. Setelah proyek selesai dan pelunasan dilakukan, Pihak Pertama akan mengembalikan atau menghapus data milik Pihak Kedua dalam waktu 30 (tiga puluh) hari setelah permintaan tertulis, kecuali diperlukan untuk arsip portofolio sesuai Pasal 6.3.")
	if data.DataProtectionPIC != "" {
		h.write(fmt.Sprintf("8.4. Penanggung jawab perlindungan data: %s.", data.DataProtectionPIC))
	}
	p.Ln(4)

	// --- PASAL 9: KERAHASIAAN ---
	h.writeBold("PASAL 9 - KERAHASIAAN")
	h.write("9.1. Para Pihak menjaga kerahasiaan informasi bisnis, teknis, dan data yang diperoleh sehubungan dengan proyek ini. Kewajiban kerahasiaan berlaku selama proyek dan 2 (dua) tahun setelah berakhirnya Perjanjian.")
	h.write("9.2. Informasi yang secara wajar telah bersifat publik, telah dimiliki sebelumnya secara sah, atau wajib diungkapkan berdasarkan hukum dikecualikan dari kewajiban kerahasiaan.")
	h.write("9.3. Pelanggaran kerahasiaan memberikan hak kepada pihak yang dirugikan untuk menuntut ganti rugi sesuai hukum yang berlaku.")
	p.Ln(4)

	// --- PASAL 10: PEMBATASAN TANGGUNG JAWAB ---
	h.writeBold("PASAL 10 - PEMBATASAN TANGGUNG JAWAB")
	h.write(fmt.Sprintf("10.1. Tanggung jawab Pihak Pertama terbatas pada perbaikan atas cacat material pada hasil kerja yang diserahkan, sepanjang dilaporkan dalam waktu %s hari kerja setelah serah terima dan tidak disebabkan oleh perubahan atau penggunaan di luar spesifikasi oleh Pihak Kedua.", data.TanggungJawabHari))
	h.write("10.2. Pihak Pertama tidak bertanggung jawab atas: (a) kerugian tidak langsung, kehilangan keuntungan, atau kerugian konsekuensial; (b) kerugian akibat keterlambatan bahan dari Pihak Kedua, force majeure, atau tindakan pihak ketiga; (c) penggunaan hasil kerja untuk keperluan yang melanggar hukum atau di luar yang disepakati.")
	h.write("10.3. Tanggung jawab Pihak Pertama secara kumulatif dibatasi maksimal sebesar nilai proyek yang telah dibayarkan oleh Pihak Kedua untuk proyek yang bersangkutan.")
	p.Ln(4)

	// --- PASAL 11: INDEMNITY (GANTI RUGI) ---
	h.writeBold("PASAL 11 - INDEMNITY (GANTI RUGI)")
	h.write("11.1. Masing-masing Pihak setuju untuk mengganti kerugian dan membebaskan Pihak lainnya dari dan terhadap segala klaim, tuntutan, kerugian, biaya (termasuk biaya hukum yang wajar) yang timbul akibat: (a) pelanggaran kewajiban berdasarkan Perjanjian ini; (b) kelalaian atau kesalahan yang disengaja oleh Pihak yang bersangkutan.")
	h.write("11.2. Pihak Kedua mengganti kerugian Pihak Pertama atas klaim pihak ketiga yang timbul dari konten, data, atau materi yang disediakan oleh Pihak Kedua dan digunakan dalam proyek sesuai instruksi Pihak Kedua.")
	h.write("11.3. Pihak Pertama mengganti kerugian Pihak Kedua atas klaim pihak ketiga terkait pelanggaran hak kekayaan intelektual yang disebabkan oleh aset orisinal yang dibuat Pihak Pertama, sepanjang bukan berasal dari materi yang disediakan Pihak Kedua.")
	p.Ln(4)

	// --- PASAL 12: FORCE MAJEURE ---
	h.writeBold("PASAL 12 - FORCE MAJEURE")
	h.write("12.1. Yang dimaksud Force Majeure adalah keadaan di luar kendali Para Pihak seperti bencana alam, kebakaran, perang, pandemi, gangguan sistem nasional, pemadaman listrik massal, kebijakan pemerintah, dan keadaan lain yang secara wajar tidak dapat diprediksi.")
	h.write("12.2. Pihak yang mengalami Force Majeure wajib memberitahukan secara tertulis dalam waktu 7 (tujuh) hari sejak terjadinya keadaan tersebut, disertai bukti yang wajar.")
	h.write("12.3. Selama Force Majeure berlangsung, kewajiban yang terdampak ditangguhkan tanpa dianggap wanprestasi.")
	h.write("12.4. Apabila Force Majeure berlangsung lebih dari 60 (enam puluh) hari, masing-masing Pihak berhak mengakhiri Perjanjian dengan pemberitahuan tertulis; penyelesaian keuangan dilakukan secara proporsional sesuai pekerjaan yang telah diselesaikan.")
	p.Ln(4)

	// --- PASAL 13: NON-SOLICITATION ---
	h.writeBold("PASAL 13 - NON-SOLICITATION")
	h.write("13.1. Pihak Kedua tidak diperkenankan merekrut langsung karyawan, freelancer, atau mitra Pihak Pertama selama proyek berlangsung dan 12 (dua belas) bulan setelah berakhirnya proyek tanpa persetujuan tertulis Pihak Pertama.")
	h.write("13.2. Pelanggaran ketentuan ini mewajibkan Pihak Kedua membayar kompensasi sebesar 3 (tiga) kali gaji/fee bulanan terakhir personel yang bersangkutan, atau sesuai nilai yang disepakati tertulis.")
	p.Ln(4)

	// --- PASAL 14: NON-COMPETE (opsional) ---
	if data.NonCompeteBulan != "" {
		h.writeBold("PASAL 14 - NON-COMPETE")
		h.write(fmt.Sprintf("14.1. Selama proyek berlangsung dan %s bulan setelahnya, Pihak Pertama tidak akan secara langsung mengerjakan proyek untuk kompetitor langsung Pihak Kedua dalam bidang usaha yang sama, kecuali disepakati lain secara tertulis.", data.NonCompeteBulan))
		h.write("14.2. Ketentuan ini hanya berlaku apabila Pihak Kedua telah mengidentifikasi secara tertulis nama kompetitor yang dimaksud dalam Lampiran. Pasal ini tidak berlaku jika tidak ada Lampiran kompetitor.")
		p.Ln(4)
	}

	// --- PASAL 15: PEMUTUSAN PERJANJIAN ---
	pslPemutusan := "15"
	if data.NonCompeteBulan == "" {
		pslPemutusan = "14"
	}
	h.writeBold(fmt.Sprintf("PASAL %s - PEMUTUSAN PERJANJIAN", pslPemutusan))
	h.write(fmt.Sprintf("%s.1. Perjanjian dapat diakhiri lebih awal atas kesepakatan tertulis Para Pihak, atau apabila salah satu pihak melanggar kewajiban material dan tidak memperbaiki dalam waktu %s hari setelah teguran tertulis.", pslPemutusan, data.PemutusanHari))
	h.write(fmt.Sprintf("%s.2. Apabila pemutusan dilakukan atas inisiatif Pihak Kedua (Klien membatalkan proyek): pembayaran yang telah disetor tidak dapat diminta kembali; Pihak Pertama wajib menyerahkan hasil kerja yang telah selesai hingga saat pemutusan sesuai bagian yang telah dibayar.", pslPemutusan))
	h.write(fmt.Sprintf("%s.3. Apabila pemutusan dilakukan karena kelalaian Pihak Pertama yang material: Pihak Kedua berhak meminta pengembalian proporsional atas pembayaran yang belum diimbangi dengan hasil kerja, atau perbaikan dalam waktu yang disepakati.", pslPemutusan))
	h.write(fmt.Sprintf("%s.4. Kewajiban kerahasiaan (Pasal 9), perlindungan data (Pasal 8), dan hak kekayaan intelektual (Pasal 6) tetap berlaku setelah pemutusan Perjanjian.", pslPemutusan))
	p.Ln(4)

	// --- PASAL 16: PENYELESAIAN SENGKETA ---
	pslSengketa := "16"
	if data.NonCompeteBulan == "" {
		pslSengketa = "15"
	}
	h.writeBold(fmt.Sprintf("PASAL %s - PENYELESAIAN SENGKETA", pslSengketa))
	h.write(fmt.Sprintf("%s.1. Setiap perselisihan yang timbul dari atau sehubungan dengan Perjanjian ini akan diselesaikan terlebih dahulu melalui musyawarah untuk mufakat dalam waktu 30 (tiga puluh) hari.", pslSengketa))
	h.write(fmt.Sprintf("%s.2. Apabila musyawarah tidak menghasilkan kesepakatan, Para Pihak sepakat untuk menempuh mediasi melalui mediator yang disetujui bersama, dengan biaya mediasi ditanggung bersama secara proporsional.", pslSengketa))
	h.write(fmt.Sprintf("%s.3. Apabila mediasi tidak berhasil dalam waktu 30 (tiga puluh) hari, perselisihan akan diselesaikan melalui Badan Arbitrase Nasional Indonesia (BANI) atau Pengadilan Negeri yang berwenang di wilayah tempat kedudukan Pihak Pertama.", pslSengketa))
	p.Ln(4)

	// --- PASAL 17: KETENTUAN UMUM ---
	pslUmum := "17"
	if data.NonCompeteBulan == "" {
		pslUmum = "16"
	}
	h.writeBold(fmt.Sprintf("PASAL %s - KETENTUAN UMUM", pslUmum))
	h.write(fmt.Sprintf("%s.1. Hubungan Para Pihak adalah hubungan independen kontraktual dan tidak menciptakan hubungan kerja, kemitraan, atau joint venture.", pslUmum))
	h.write(fmt.Sprintf("%s.2. Apabila salah satu ketentuan dalam Perjanjian ini dinyatakan tidak sah atau tidak dapat dilaksanakan, maka ketentuan lainnya tetap berlaku secara penuh (severability).", pslUmum))
	h.write(fmt.Sprintf("%s.3. Perjanjian ini merupakan keseluruhan kesepakatan antara Para Pihak mengenai pokok permasalahan dalam Perjanjian ini dan menggantikan seluruh negosiasi, diskusi, atau perjanjian sebelumnya.", pslUmum))
	h.write(fmt.Sprintf("%s.4. Perjanjian ini dibuat dalam Bahasa Indonesia. Apabila terdapat versi terjemahan, versi Bahasa Indonesia yang berlaku dan mengikat.", pslUmum))
	h.write(fmt.Sprintf("%s.5. Setiap perubahan atau amandemen terhadap Perjanjian ini hanya berlaku apabila dibuat secara tertulis dan ditandatangani oleh kedua belah Pihak.", pslUmum))
	h.write(fmt.Sprintf("%s.6. Perjanjian ini tunduk pada hukum Negara Republik Indonesia.", pslUmum))
	h.write(fmt.Sprintf("%s.7. Perjanjian ini dibuat dalam 2 (dua) rangkap bermeterai cukup, masing-masing memiliki kekuatan hukum yang sama.", pslUmum))

	// --- ESKALASI ---
	if data.EscalationPIC1 != "" || data.EscalationPIC2 != "" {
		p.Ln(4)
		h.writeBold("LAMPIRAN: PROSEDUR ESKALASI")
		h.write("Apabila terjadi permasalahan operasional, eskalasi dilakukan bertahap:")
		if data.EscalationPIC1 != "" {
			h.write(fmt.Sprintf("  Tingkat 1 (operasional): %s", data.EscalationPIC1))
		}
		if data.EscalationPIC2 != "" {
			h.write(fmt.Sprintf("  Tingkat 2 (manajerial/direktur): %s", data.EscalationPIC2))
		}
		h.write("Apabila eskalasi tingkat 2 tidak menghasilkan resolusi dalam 14 hari kerja, mekanisme penyelesaian sengketa di atas berlaku.")
	}

	p.Ln(6)
	writeSignatureBlock(p, h)
	p.Ln(6)
	h.write("Lampiran (wajib dilampirkan saat penandatanganan): Lampiran A - Surat Pesanan / Order; Lampiran B - Scope of Work (SOW); Lampiran C - Daftar Milestone (jika ada); Lampiran D - Daftar Kompetitor (jika Pasal Non-Compete berlaku).")
	p.Ln(4)
	h.write("Dokumen ini adalah kerangka Perjanjian Jasa Profesional Rasya Production. Untuk proyek dengan nilai atau risiko khusus, disarankan konsultasi dengan konsultan hukum.")

	var buf bytes.Buffer
	if err := p.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// ============================================================
// LITE — Perjanjian Jasa Standar (Standard Service Agreement)
// 9 pasal, ~4-5 halaman
// ============================================================

func GenerateAgreementLite(data *AgreementData) ([]byte, error) {
	p, h := newPDFDoc()

	writeTitle(p, "PERJANJIAN JASA STANDAR", "Standard Service Agreement", data.NomorPerjanjian)
	h.write(fmt.Sprintf("Tanggal: %s", data.Tanggal))
	p.Ln(6)
	writeParties(h, data)

	// --- PASAL 1: RUANG LINGKUP ---
	h.writeBold("PASAL 1 - RUANG LINGKUP")
	h.write("1.1. Pihak Pertama menyediakan jasa kreatif, desain, konten, dan/atau solusi digital sesuai dengan Surat Pesanan / Order atau kesepakatan tertulis yang menjadi lampiran Perjanjian ini.")
	h.write("1.2. Ruang lingkup pekerjaan dan tenggat waktu disesuaikan dengan kesepakatan tertulis kedua belah pihak. Perubahan scope wajib disepakati secara tertulis.")
	p.Ln(4)

	// --- PASAL 2: NILAI DAN PEMBAYARAN ---
	h.writeBold("PASAL 2 - NILAI DAN PEMBAYARAN")
	h.write(fmt.Sprintf("2.1. Nilai proyek sebesar Rp %s (%s).", data.NilaiProyekAngka, data.NilaiProyekTerbilang))
	h.write("2.2. Pembayaran dilakukan sesuai skema yang disepakati:")
	p.Ln(2)
	writePaymentTable(p, data)
	h.write("2.3. Pembayaran melalui transfer bank ke rekening Pihak Pertama:")
	h.write(fmt.Sprintf("   Bank: %s | No. Rekening: %s | Atas Nama: %s", data.BankName, data.BankNumber, data.BankAccount))
	h.write("2.4. Pekerjaan dimulai setelah pembayaran DP diterima. Keterlambatan pembayaran dapat mengakibatkan penundaan pekerjaan tanpa dianggap kelalaian Pihak Pertama.")
	p.Ln(4)

	// --- PASAL 3: REVISI ---
	h.writeBold("PASAL 3 - REVISI")
	h.write(fmt.Sprintf("3.1. Pihak Pertama menyediakan %s putaran revisi minor sesuai scope. Revisi di luar putaran dapat dikenakan biaya tambahan.", data.RevisiPutaran))
	h.write(fmt.Sprintf("3.2. Permintaan revisi disampaikan secara tertulis dalam waktu %s hari setelah penyerahan draft.", data.RevisiHari))
	p.Ln(4)

	// --- PASAL 4: HAK KEKAYAAN INTELEKTUAL ---
	h.writeBold("PASAL 4 - HAK KEKAYAAN INTELEKTUAL")
	h.write("4.1. Aset pre-existing milik Pihak Pertama tetap menjadi milik Pihak Pertama. Setelah pelunasan, hak penggunaan deliverables final diberikan kepada Pihak Kedua secara non-eksklusif sesuai tujuan proyek.")
	h.write("4.2. Pihak Pertama berhak menampilkan proyek dalam portofolio, kecuali Pihak Kedua menyatakan keberatan tertulis sebelum penandatanganan.")
	p.Ln(4)

	// --- PASAL 5: PEMBATASAN TANGGUNG JAWAB ---
	h.writeBold("PASAL 5 - PEMBATASAN TANGGUNG JAWAB")
	h.write(fmt.Sprintf("5.1. Tanggung jawab Pihak Pertama terbatas pada perbaikan cacat material, sepanjang dilaporkan dalam waktu %s hari kerja setelah serah terima.", data.TanggungJawabHari))
	h.write("5.2. Pihak Pertama tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan, atau kerugian konsekuensial.")
	h.write("5.3. Total tanggung jawab Pihak Pertama dibatasi sebesar nilai proyek yang telah dibayarkan.")
	p.Ln(4)

	// --- PASAL 6: SERAH TERIMA ---
	h.writeBold("PASAL 6 - SERAH TERIMA")
	h.write(fmt.Sprintf("6.1. Pihak Kedua wajib memberikan konfirmasi penerimaan atau koreksi dalam %s hari kerja setelah penyerahan. Tanpa tanggapan tertulis, hasil kerja dianggap diterima.", data.SerahTerimaHari))
	p.Ln(4)

	// --- PASAL 7: PEMUTUSAN ---
	h.writeBold("PASAL 7 - PEMUTUSAN PERJANJIAN")
	h.write(fmt.Sprintf("7.1. Perjanjian dapat diakhiri atas kesepakatan tertulis, atau jika salah satu pihak wanprestasi dan tidak memperbaiki dalam %s hari setelah teguran tertulis.", data.PemutusanHari))
	h.write("7.2. Pembatalan oleh Pihak Kedua: pembayaran yang telah disetor tidak dikembalikan; hasil kerja yang selesai diserahkan. Pembatalan karena kelalaian Pihak Pertama: pengembalian proporsional sesuai pekerjaan yang belum diselesaikan.")
	p.Ln(4)

	// --- PASAL 8: HUKUM DAN PENYELESAIAN SENGKETA ---
	h.writeBold("PASAL 8 - HUKUM DAN PENYELESAIAN SENGKETA")
	h.write("8.1. Perjanjian ini tunduk pada hukum Negara Republik Indonesia.")
	h.write("8.2. Perselisihan diselesaikan secara musyawarah; apabila tidak tercapai, melalui Pengadilan Negeri yang berwenang.")
	p.Ln(4)

	// --- PASAL 9: KETENTUAN UMUM ---
	h.writeBold("PASAL 9 - KETENTUAN UMUM")
	h.write("9.1. Hubungan Para Pihak adalah hubungan independen kontraktual.")
	h.write("9.2. Apabila salah satu ketentuan dinyatakan tidak sah, ketentuan lainnya tetap berlaku.")
	h.write("9.3. Perjanjian ini dibuat dalam 2 (dua) rangkap bermeterai cukup, masing-masing memiliki kekuatan hukum yang sama.")

	p.Ln(6)
	writeSignatureBlock(p, h)
	p.Ln(6)
	h.write("Lampiran: Surat Pesanan / Order; Scope of Work (SOW) jika ada.")
	p.Ln(4)
	h.write("Dokumen ini adalah kerangka Perjanjian Jasa Standar Rasya Production.")

	var buf bytes.Buffer
	if err := p.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
