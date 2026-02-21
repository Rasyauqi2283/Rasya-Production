#!/usr/bin/env node
/**
 * Cek sinkronisasi layanan preview dengan serviceI18n.
 * Menjalankan: node scripts/check-preview-config.mjs (dari folder frontend)
 * atau: npm run preview-config
 *
 * - Baca slug dari SERVICE_TITLE_TO_SLUG di lib/serviceI18n.ts
 * - Baca slug yang sudah ada di SERVICE_PREVIEW_META di lib/layananPreviewConfig.ts
 * - Laporkan: slug yang ada di serviceI18n tapi belum ada di config (perlu ditambah)
 * - Laporkan: slug yang ada di config tapi tidak di serviceI18n (bisa dibersihkan)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function extractSlugsFromServiceI18n() {
  const filePath = path.join(ROOT, "lib", "serviceI18n.ts");
  const content = fs.readFileSync(filePath, "utf8");
  const slugs = [];
  const re = /["']([^"']+)["']:\s*["']([a-z0-9_]+)["']/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    slugs.push(m[2]);
  }
  return [...new Set(slugs)];
}

function extractSlugsFromPreviewConfig() {
  const filePath = path.join(ROOT, "lib", "layananPreviewConfig.ts");
  const content = fs.readFileSync(filePath, "utf8");
  const slugs = [];
  const re = /^\s*([a-z][a-z0-9_]*):\s*\{\s*tag:/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    slugs.push(m[1]);
  }
  return slugs;
}

const fromI18n = extractSlugsFromServiceI18n();
const fromConfig = extractSlugsFromPreviewConfig();

const missing = fromI18n.filter((s) => !fromConfig.includes(s));
const extra = fromConfig.filter((s) => !fromI18n.includes(s));

console.log("=== Cek konfigurasi Layanan Preview ===\n");
console.log("Slug dari serviceI18n:", fromI18n.length);
console.log("Slug di layananPreviewConfig (SERVICE_PREVIEW_META):", fromConfig.length);

if (missing.length > 0) {
  console.log("\n⚠️  Slug di serviceI18n tapi BELUM di config (tambah di SERVICE_PREVIEW_META):");
  missing.forEach((slug) => {
    console.log(`  ${slug}: { tag: "Lain-lain", shortDescription: "Preview contoh hasil layanan.", previewType: "lain" },`);
  });
} else {
  console.log("\n✅ Semua slug dari serviceI18n sudah ada di config.");
}

if (extra.length > 0) {
  console.log("\n📋 Slug di config tapi tidak di serviceI18n (opsional dibersihkan):");
  extra.forEach((s) => console.log("  ", s));
}

if (missing.length === 0 && extra.length === 0) {
  console.log("\n✅ Sinkron.");
}
process.exit(missing.length > 0 ? 1 : 0);
