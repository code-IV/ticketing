# 🚀 Project Incremental Changes

## 📅 Current Sprint: UI/UX Overhaul

**Status:** In Progress 🟡

---

### 🎨 Frontend: /home Page

- [ ] **Events Section:** - [ ] Logic: Only show `events-list` if data is present (conditional rendering).
  - [ ] Layout: Single event display (Removed Grid layout).
- [ ] **Games Section:**
  - [ ] Layout: Restructure into two distinct rows.
  - [ ] Interaction: Add hover-to-play video logic.

---

### ⚙️ Backend: API & Logic

- [ ] **Endpoint:** `POST /api/games/create`
  - [ ] Change: Convert to **Atomic Transaction** (Multipart/Form-Data). - [ ] Logic: Implement `JSON.parse` for the `game` metadata string.
- [ ] **Media Handling:**
  - [ ] Task: Generate Low-Res Image Placeholders (LQIP) on upload.
  - [ ] Task: Implement WebP conversion for performance.
  - [ ] Task: Duplicate media is possible we need to fix that also.

---

### 🔒 Security & Reliability

- [ ] **Uploads:** Add file type validation (MIME type check) on server-side.
- [ ] **Cleanup:** Add logic to delete orphaned files if DB write fails.
- [ ] **Rate Limiting:** Protect the game creation endpoint.

---

### 📝 Notes / Brainstorming

- _Check if the blur-2xl on the MOCK_IMG is too heavy._
- _Consider using Next/Image for automatic optimization._

---

### ✅ Completed Tasks
