# 🚀 Project Incremental Changes

## 📅 Current Sprint: UI/UX Overhaul & Core Logic

**Status:** In Progress 🟡

---

### 🎨 Frontend: /home & Interface

- [ ] **UI**
  - [ ] **Games Section**
    - [x] Layout: Restructure into two distinct rows.
  - [x] Interaction: Add hover-to-play video logic. else display thumbnail
- [ ] **Navigation & Access**
  - [x] Add 'X' (Close) button to the Signup Page.
  - [x] **Mandatory Signup:** Enforce signup requirement for discount eligibility.
- [ ] **Features**
  - [x] Implement **Media Gallery View** for asset selection (vs. direct download).
  - [x] Integrated **Discount UI** logic (Percentage, Tiered, Early Bird, Member, and Group).
  - [x] Discount UI only.
  - [x] Ticket buying page card.
- [ ] **Refinement**
  - [x] Home Page Layout (2 items per line).
  - [x] Event Page Layout (2 items per line).
  - [x] User Profile update UI.
  - [x] QR/Barcode Scan Page fixes.
  - [x] Asset Integration (Real Media, Mock Images, Metadata).

---

### ⚙️ Backend: API & Logic

- [ ] **Endpoint:** `POST /api/games/create`
  - ✅ Change: Convert to **Atomic Transaction** (Multipart/Form-Data).
  - 🚫 Logic: Implement `JSON.parse` for the `game` metadata string.
- [ ] **Media Handling**
  - [x] Task: Generate Low-Res Image Placeholders (LQIP) on upload.
  - [x] Task: Implement WebP conversion for performance.
  - [x] Task: Fix duplicate media upload logic.
  - ✅ Support for: Thumbnail, Banner, Poster, and Gallery assets.
- [ ] **Authentication & Security**
  - [x] Implement **OTP (One-Time Password)** for 1-time password resets.
  - [x] Enforce "Auth Required" middleware for discount eligibility.
- [ ]**Core Logic & Discounts**
  - [x] Build **Discount Engine**: Case-by-case eligibility checker.
    - _Types:_ Percentage (10/20/30%), Tiered (3+ or 5+), Early Bird, Member, and Group packages.
  - ✅ Ticket **Revoke** functionality for Admins.
  - [x] Standardize API **Response Model** (Data cleanup & optimization).
- [ ] **Logging & Monitoring**
  - [x] **Ticket Buy Log**: Audit trail for transactions.
  - [x] **System Log**: Administrative action and error tracking.
- [ ] **Admin & Analytics**
  - [x] Fix **Analytics Data** rendering issue (merged dashboard).
  - [x] Admin ticket list: Ability to view and revoke user tickets.
  - [x] Super Admin / User role permission logic.
  - [x] Admin tab visibility on login fix.
  - [x] Admin/User search by user email.
  - [x] Merge Admin and Analytics pages.

---

### 🧪 Testing & Quality Assurance

- [ ] **Unit & Integration Testing**
  - [x] Test Discount triggers (e.g., "Buy 3, get 15% off").
  - [x] Test OTP expiration and reuse prevention.
- [ ] **User Acceptance (UAT)**
  - [x] Extensive UI testing on mobile/KDE Plasma browsers.
  - [x] End-to-end "Ticket Buy" flow validation.

---

### 🔒 Security & Reliability

- [x] **Uploads:** Add file type validation (MIME type check) on server-side.
- [x] **Cleanup:** Add logic to delete orphaned files if DB write fails.
- [x] **Rate Limiting:** Protect the game creation endpoint.

---

### 📝 Notes / Brainstorming

- _Check if the blur-2xl on the MOCK_IMG is too heavy._
- _Consider using Next/Image for automatic optimization._
- ~~❌ Customer Support module (Postponed)~~

## Legend

- 🚫 => cancelled task
- ✅ => completed task
- 🟡 => inprogress task
- [x] => new task
