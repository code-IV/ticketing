# 🚀 Project Incremental Changes

## 📅 Current Sprint: UI/UX Overhaul

**Status:** In Progress 🟡

---

### 🎨 Frontend: /home Page

- [X] **Events Section:** - [ ] Logic: Only show `events-list` if data is present (conditional rendering).
  - [X] Layout: Single event display (Removed Grid layout).
- [ ] **Games Section:**
  - [ ] Layout: Restructure into two distinct rows.
  - [ ] Interaction: Add hover-to-play video logic.


- [ ] **Navigation & Access**
    - [ ] Add 'X' (Close) button to the Signup Page.
    - [ ] Update Event Navigation Page background (Apply Fading Blur/Gradient).
- [ ] **Features**
    - [ ] Implement **Media Gallery View** for asset selection (vs. direct download).
    - [ ] Real-time "Tickets Left" display on the Event Page.
    - [ ] Integrated **Discount UI** logic for:
        - Percentage, Tiered, Early Bird, Member, and Group types.
- [ ] **Refinement**
    - [x] Home Page Layout (2 items per line).
    - [x] Event Page Layout (2 items per line).
    - [x] User Profile update UI.
    - [x] QR/Barcode Scan Page fixes.
---

### ⚙️ Backend: API & Logic

- [ ] **Endpoint:** `POST /api/games/create`
  - [ ] Change: Convert to **Atomic Transaction** (Multipart/Form-Data). - [ ] Logic: Implement `JSON.parse` for the `game` metadata string.
- [ ] **Media Handling:**
  - [ ] Task: Generate Low-Res Image Placeholders (LQIP) on upload.
  - [ ] Task: Implement WebP conversion for performance.
  - [ ] Task: Duplicate media is possible we need to fix that also.


- [ ] **Authentication**
    - [ ] Implement **OTP (One-Time Password)** for password resets.
    - [ ] Enforce "Auth Required" middleware for discount eligibility.
- [ ] **Core Logic**
    - [ ] Build **Discount Engine**: Case-by-case eligibility checker.
    - [ ] Ticket **Revoke** functionality for Admins.
    - [ ] Standardize API **Response Model** (Data cleanup).
- [ ] **Logging & Monitoring**
    - [ ] **Ticket Buy Log**: Audit trail for transactions.
    - [ ] **System Log**: Administrative action and error tracking.

 - [ ] Fix **Analytics Data** rendering issue (merged dashboard).
- [x] Super Admin / User role permission logic.
---

## 🧪 Testing & Quality Assurance
- [ ] **Unit & Integration Testing**
    - [ ] Test Discount triggers (e.g., "Buy 3, get 15% off").
    - [ ] Test OTP expiration and reuse prevention.
- [ ] **User Acceptance (UAT)**
    - [ ] Extensive UI testing on mobile/KDE Plasma browsers.
    - [ ] End-to-end "Ticket Buy" flow validation.


### 🔒 Security & Reliability

- [ ] **Uploads:** Add file type validation (MIME type check) on server-side.
- [ ] **Cleanup:** Add logic to delete orphaned files if DB write fails.
- [ ] **Rate Limiting:** Protect the game creation endpoint.

---

### 📝 Notes / Brainstorming

- _Check if the blur-2xl on the MOCK_IMG is too heavy._
- _Consider using Next/Image for automatic optimization._





      
x button to the signup page
1 time pasword pass reset

✅ discount ui only
✅ ticket buying page card

sighnup is nessassary for the discount
discount
limited discount
discount for each case
meida selection with the the galler rather than allways download


response model cleanup

✅ super admin
✅ home page layout 2 per line
✅ event page layout 2 per line
✅ user profile update
✅ real MEDIA
✅ ticket cut
✅ mock images
✅ metadata
        thumbnail
        banner
        poter
        galary

update the event navigation page background
update the events number of tickets left

✅ admin tab not apearing when loging in
✅ admin / user search by user email
✅ merge admin and analitics page
fix analitics data not showing properly
adin ticket list and ability to revoke the user ticket
✅ fix scan page

extensive testing
        - feat
        - ui

ticket buy log
system log

❌ customer support

discount types
Percentage discounts: Should users get 10%, 20%, 30% off based on quantity?
Tiered discounts: Buy 3+ tickets get 15% off, 5+ get 25% off?
Early bird discounts: Book before certain date get discount?
Member discounts: Logged-in users get special pricing?
Group discounts: Family packages or group bookings?
