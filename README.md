# Shared Expense Tracker (Splitwise for Flatmates)

A high-performance monorepo application designed specifically for flatmates and roommates. Built with **Angular 21 PWA**, **Node.js (TypeScript)**, **Turso libSQL Edge Database**, **Google Sheets live mirror**, **GPay screenshot OCR sharing**, and **Min-Cash-Flow debt simplification**.

---

## 🌟 Key Features

1. **📱 PWA Mobile Screenshot Sharing**:
   - Integrated with the **W3C Web Share Target API**.
   - Share a payment screenshot directly from **Google Pay, PhonePe, Paytm**, or Photo Gallery into the app via the native mobile Share Sheet.
   - Extracts merchant, amount, category, and 12-digit UPI UTR for 1-tap logging.
   - Also supports **Clipboard Paste (`Cmd+V`)** on iOS and Desktop.

2. **⚡ Dual-Storage Backbone (Turso + Google Sheets)**:
   - **Turso (libSQL)**: Fast edge SQLite queries (`< 15ms`).
   - **Google Sheets**: Live synchronized mirror. Non-technical flatmates can view the raw spreadsheet anytime on Google Drive!
   - Self-healing resilience: If Google Sheets API slows down or rate-limits, Turso commits first and background syncs without blocking the user.

3. **🛡️ Data Deduplication & Linked IDs**:
   - **`EXACT_UTR`**: Deterministic 100% duplicate check on the 12-digit UPI bank reference.
   - **`FUZZY_FINGERPRINT`**: Heuristic check on `payer + amount + title + timestamp window < 30 mins`.
   - Side-by-side conflict modal displays direct clickable link IDs (`#EXP-104`) and direct Google Sheet permalinks.
   - Supports clean in-place **Overwrite** (`overwritten_flag: 'YES'`) with revision audit diffs.

4. **🌴 Flatmate-Specific Superpowers**:
   - **Vacation Mode**: Excludes absent flatmates from daily food/grocery splits while keeping fixed bills (Rent, Wi-Fi) shared.
   - **Zero-Drift Splitting**: Calculates splits in integer minor units (paise/cents) to eliminate 100% of floating-point drift.
   - **Min-Cash-Flow Algorithm**: Collapses circular debts into the minimum number of peer-to-peer transfers.
   - **1-Tap UPI Settlements**: Dynamic `upi://pay` deep links and QR codes pre-filled with the exact owed amount.

5. **📊 Automated Month-End Statements & WhatsApp Digests**:
   - On-demand statement generation for Current Month, Last Month, or Custom Date Ranges.
   - 1-tap **Share on WhatsApp** generates a clean, formatted bullet-point digest for your flat's WhatsApp group.
   - Automated month-end statement cron scheduled via **GitHub Actions** (`.github/workflows/month-end-statement.yml`).

6. **📖 Swagger / OpenAPI Documentation**:
   - Full interactive Swagger UI available at `/api/docs`.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js `v18+` or `v20+` (Tested on `v26.8.1`)
- npm `v10+`

### 2. Installation
```bash
cd /Users/rajdip/Desktop/projects/shared-expense-tracker
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
- **Frontend (Angular 21 PWA)**: `http://localhost:4200`
- **Backend API**: `http://localhost:3000`
- **Interactive Swagger Docs**: `http://localhost:3000/api/docs`
- **Swagger JSON Spec**: `http://localhost:3000/api/docs.json`

### 4. Run Automated Test Suite
```bash
npm test
```
Runs the shared mathematical test suite (penny-rounding, vacation mode, debt simplification) and the full backend integration test suite.

---

## 📂 Monorepo Structure

```text
shared-expense-tracker/
├── package.json               # Root npm workspaces
├── vercel.json                # Vercel deployment configuration
├── .github/workflows/         # GitHub Actions Month-End Cron
│
├── shared/                    # @shared-expense-tracker/shared
│   ├── src/types/             # Domain TypeScript interfaces
│   ├── src/algorithms/        # Integer minor unit split & Min-Cash-Flow debt engine
│   └── src/utils/             # UPI deep link & WhatsApp formatters
│
├── backend/                   # Node.js + Express API
│   ├── src/storage/           # Turso (libSQL) & Google Sheets dual adapters
│   ├── src/validators/        # EXACT_UTR & FUZZY_FINGERPRINT deduplication
│   ├── src/ocr/               # Multimodal receipt vision extractor
│   ├── src/docs/              # OpenAPI 3.0 / Swagger specification
│   ├── src/routes/            # REST route controllers
│   └── src/server.ts          # Express server & Vercel serverless export
│
└── frontend/                  # Angular 21 Standalone PWA
    ├── src/app/core/          # ApiService (Signals) & Auth Interceptor
    ├── src/app/features/      # Dashboard, Auth, Flat Onboarding, Add Bill, Scanner, Statements
    ├── public/manifest.webmanifest # PWA Web Share Target manifest
    └── public/service-worker.js    # Screenshot interception worker
```

---

## ☁️ Vercel Deployment

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Vercel automatically detects `vercel.json` and deploys:
   - Frontend static assets to Vercel Edge CDN.
   - Backend routes `/api/*` as Serverless Functions.
4. Set Environment Variables in Vercel:
   - `JWT_SECRET`: Random secure secret.
   - `CRON_SECRET`: Random secret matching GitHub Actions workflow.
   - `TURSO_DATABASE_URL`: Your Turso cloud database URL (`libsql://...`).
   - `TURSO_AUTH_TOKEN`: Your Turso database token.
   - `GOOGLE_SPREADSHEET_ID`: (Optional) Your Google Sheet ID.
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: (Optional) Service account email.
   - `GOOGLE_PRIVATE_KEY`: (Optional) Service account private key.
   - `GEMINI_API_KEY`: (Optional) Gemini API key for receipt OCR parsing.
