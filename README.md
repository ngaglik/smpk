# SMPK — Mockup Formulir Sertifikat Medis Penyebab Kematian

Aplikasi web (Vite + Vue 3 + TypeScript) untuk pengisian formulir **SMPK** dan integrasi ke **SATUSEHAT** (sandbox/staging): OAuth2, registrasi Encounter, pengiriman Bundle FHIR, penyimpanan log, dan cetak **SKK** dari template DOCX.

---

## 1. Prasyarat

- **Node.js 18+** (disarankan 20)
- **npm 9+**
- Akses ke endpoint SATUSEHAT staging: `https://api-satusehat-stg.dto.kemkes.go.id`

## 2. Instalasi

```bash
cd smpk
npm install
```

## 3. Konfigurasi environment

Salin template lalu isi nilainya:

```bash
cp .env.example .env.local
```

Isi `.env.local`:

```dotenv
VITE_SATUSEHAT_ENV=sandbox

VITE_SATUSEHAT_AUTH_URL=https://api-satusehat-stg.dto.kemkes.go.id/oauth2/v1
VITE_SATUSEHAT_BASE_URL=https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1
VITE_SATUSEHAT_CONSENT_URL=https://api-satusehat-stg.dto.kemkes.go.id/consent/v1
VITE_SATUSEHAT_BASE_URL_KPTL=https://api-satusehat-stg.dto.kemkes.go.id/kptl-api-v1

VITE_SATUSEHAT_CLIENT_ID=<client-id>
VITE_SATUSEHAT_ORG_ID=<organization-uuid>
VITE_SATUSEHAT_ORG_ID_NUMERIC=<kode-fasyankes-9-atau-10-digit>
VITE_SATUSEHAT_LOCATION_ID=<location-uuid>
VITE_SATUSEHAT_TOKEN=

# RAHASIA — tanpa prefix VITE_, hanya dipakai server dev/preview
SATUSEHAT_CLIENT_SECRET=<client-secret>
```

Keterangan:

| Variabel | Fungsi |
|---|---|
| `VITE_SATUSEHAT_CLIENT_ID` | Client ID OAuth2 |
| `SATUSEHAT_CLIENT_SECRET` | Client secret (tidak pernah masuk bundle browser) |
| `VITE_SATUSEHAT_ORG_ID` | UUID organisasi SATUSEHAT (untuk `Organization/{id}`) |
| `VITE_SATUSEHAT_ORG_ID_NUMERIC` | Kode numerik fasyankes untuk generator NIK jenazah tanpa identitas (9/10 digit; 9 digit dihitung checksum-nya) |
| `VITE_SATUSEHAT_LOCATION_ID` | Default Location UUID untuk registrasi Encounter |
| `VITE_SATUSEHAT_TOKEN` | Opsional, biasanya diisi hasil pertukaran token |

> `.env.local` diabaikan Git (lihat `.gitignore`). Jangan pernah commit client secret.

## 4. Menjalankan aplikasi

```bash
npm run dev
```

Buka URL yang ditampilkan Vite (default `http://localhost:5173`).

Build & preview:

```bash
npm run build
npm run preview
```

> **Penting:** endpoint bantu (`/api/satusehat/token`, `/api/satusehat/fhir`, `/api/satusehat/logs`) disediakan oleh middleware Vite saat `dev`/`preview`. Saat hasil build statis di-deploy tanpa backend, fitur OAuth2, registrasi Encounter, kirim FHIR, dan simpan log tidak akan berfungsi — perlu backend/proxy yang menyimpan `SATUSEHAT_CLIENT_SECRET`.

## 5. Alur pemakaian

1. Pilih salah satu **Skenario demo** (sakit, infeksi, kecelakaan, perempuan hamil, janin/bayi, dalam perjalanan) atau isi form manual.
2. Lengkapi **Kunjungan Terakhir**: waktu masuk, DPJP, **RegId**, dan Location ID (dari env).
3. (Opsional) Klik **OAuth2 → Hubungkan** untuk login manual. Jika tidak, login otomatis dilakukan saat mengirim/registrasi.
4. Klik **Registrasi Encounter** untuk membuat `Condition` + `Encounter` di SATUSEHAT. Encounter ID akan tampil sebagai label dan otomatis dipakai saat mengirim.
5. Klik **Kirim ke SATUSEHAT** untuk mengirim Bundle transaksi SMPK (Observation + Composition).
6. Klik **Simpan** untuk menulis request & response terakhir sebagai JSON ke folder `logs/`.
7. Klik **Print SKK** untuk mengunduh `template_skk.docx` yang sudah terisi data form (`SKK-<no_rm>.docx`).

### Skenario janin/bayi

Saat skenario **Kematian janin/bayi** aktif, tombol **Generator NIK** muncul setelah isian Nomor identitas. Format NIK yang dihasilkan:

```
0-<Org ID 10 digit>-<YY>-<nomor urut 3 digit>
contoh: 0-1000255899-26-005
```

Jika `VITE_SATUSEHAT_ORG_ID_NUMERIC` berisi 9 digit, checksum dihitung otomatis.

## 6. Struktur proyek

```
smpk/
├─ src/
│  ├─ App.vue                     # Halaman utama & seluruh form
│  ├─ components/                 # Komponen UI berbasis kelas ttdk.css
│  ├─ composables/
│  │  ├─ useSmpkForm.ts           # State form, default, reset
│  │  ├─ useSmpkCalculations.ts   # Nilai turunan (usia, bayi, eks, autopsi)
│  │  └─ useSatusehatAuth.ts      # OAuth2 + auto-refresh token
│  ├─ config/satusehat.ts         # Konfigurasi dari env
│  ├─ services/
│  │  ├─ smpkBundle.ts            # Pembentuk Bundle transaksi SMPK
│  │  ├─ satusehatFhir.ts         # Kirim FHIR + parsing error
│  │  ├─ satusehatEncounter.ts    # Registrasi Encounter (idempotent)
│  │  ├─ skkTemplate.ts           # Pengisian XML template SKK
│  │  └─ skkDocument.ts           # Generate DOCX
│  ├─ utils/tanpaNik.ts           # NIK jenazah tanpa identitas
│  ├─ types/                      # Tipe & deklarasi
│  └─ assets/
│     ├─ css/ttdk.css             # SATUSEHAT Design System
│     └─ templates/template_skk.docx
├─ vite.config.ts                 # Plugin proxy OAuth2/FHIR/log
├─ .env.example
└─ package.json
```

## 7. Endpoint bantu (dev/preview)

| Endpoint | Metode | Fungsi |
|---|---|---|
| `/api/satusehat/token` | POST | Menukar client credentials menjadi access token |
| `/api/satusehat/fhir/*` | GET/POST | Proxy ke `VITE_SATUSEHAT_BASE_URL` (GET untuk pencarian, POST untuk create) |
| `/api/satusehat/logs` | POST | Menulis `logs/smpk-<timestamp>-<no_rm>.json` |

Folder `logs/` dibuat otomatis dan diabaikan Git.

## 8. Troubleshooting

- **`401 Invalid Access Token`** — kredensial salah/kedaluwarsa; cek `.env.local`, lalu klik **OAuth2 → Hubungkan** ulang.
- **`Encounter resource not found`** — Encounter belum terdaftar. Isi Location ID, lalu klik **Registrasi Encounter**.
- **`Found duplicate: Condition`** — registrasi idempotent mencari Encounter berdasarkan RegId/No. RM. Jika tetap muncul, gunakan **RegId** yang berbeda untuk kunjungan baru.
- **`Organization ID belum diatur`** — isi `VITE_SATUSEHAT_ORG_ID`.
- **Generator NIK gagal** — isi `VITE_SATUSEHAT_ORG_ID_NUMERIC` dengan kode fasyankes 9/10 digit yang benar.
- **Print SKK kosong/bergeser** — pemetaan memakai urutan node teks `template_skk.docx`. Jika template diganti, sesuaikan indeks di `src/services/skkTemplate.ts`.
- **Fitur API tidak jalan setelah build** — jalankan `npm run dev`/`npm run preview`, atau sediakan backend proxy untuk produksi.

## 9. Keamanan

- `SATUSEHAT_CLIENT_SECRET` hanya dibaca server (tanpa prefix `VITE_`), sehingga tidak ikut ke bundle browser.
- Access token disimpan di memori (bukan `localStorage`) dan di-refresh otomatis 1 menit sebelum kedaluwarsa; refresh juga dipicu saat tab kembali aktif.
- `logs/` dan `.env.local` diabaikan Git.
