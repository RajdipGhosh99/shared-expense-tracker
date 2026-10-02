# E2E Automation Test Suite (Playwright)

Automated end-to-end (E2E) testing suite for the **Shared Expense Tracker** application using [Playwright](https://playwright.dev/).

---

## 📁 Directory Structure

```
automation/
├── package.json               # Automation package scripts & Playwright deps
├── playwright.config.ts       # Multi-device (Mobile Chrome Pixel 7 + Desktop) config & webServer lifecycle
├── tsconfig.json              # TypeScript compilation setup
├── README.md                  # Automation documentation
└── tests/
    ├── helpers.ts             # Session & registration fixture helpers
    ├── 01_auth.spec.ts        # Registration, login, logout & route protection
    ├── 02_group.spec.ts       # Group creation & invite code onboarding
    ├── 03_expenses_and_dedup.spec.ts # Expense splitting & deduplication conflict resolution
    └── 04_settlements_and_statements.spec.ts # Vacation mode, UPI deep links & WhatsApp statements
```

---

## 🚀 Running the Tests

From the **project root**:

```bash
# Run all E2E tests across projects
npm run test:e2e

# Or from within the automation/ directory:
cd automation

# Standard headless run
npm test

# Run in Interactive UI mode (time-travel debugging)
npm run test:ui

# Run in Headed browser mode
npm run test:headed

# Run specifically on Mobile Viewport (Pixel 7)
npm run test:mobile
```

---

## 🎯 Test Coverage

| Test Suite | Coverage & Scenarios |
|---|---|
| **01_auth.spec.ts** | Route guards (`/auth` redirect), full user registration with UPI IDs, secure login/logout lifecycle. |
| **02_group.spec.ts** | Group onboarding, 6-character uppercase invite code generation, multi-user invite code joining. |
| **03_expenses_and_dedup.spec.ts** | Integer minor units expense addition, Equal split calculation, Net Standing updates, Duplicate UTR 409 conflict detection with `#EXP-...` and in-place overwrite resolution. |
| **04_settlements_and_statements.spec.ts** | Vacation mode toggle, Min-Cash-Flow greedy debt settlement with dynamic `upi://pay` deep link generation, Month-end statement reports, and 1-tap WhatsApp digest link formatting. |

---

## 📱 Mobile-First Verification

Playwright is configured to run tests using:
- **`mobile-chrome`**: Emulating Google Pixel 7 (393x851 viewport, touch-enabled, mobile user-agent).
- **`desktop-chrome`**: Mobile dimensions (430x932 iPhone 14/15 Pro Max) to test responsiveness and safe-area notch layout.
