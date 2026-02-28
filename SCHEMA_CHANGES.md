# 🎫 Enterprise Domain Model: Unified Access & Commerce System

Good. Now we’re talking proper domain modeling.
You’re building a system that must support:

- **Event tickets** (concert, festival, one-day event)
- **Park / multi-game access** (dynamic selection of games)
- **Multi-day expiration**
- **Staff scanning per game**
- **Future extensibility**

If I were designing this from scratch, I would not model around “event vs games”. I would model around **Product + Access + Consumption**.
That keeps it clean and extensible.

## 🎯 Core Design Principle

Separate:

- **What is being sold** → `products`
- **What is purchased** → `bookings`
- **What grants access** → `tickets`
- **What is consumed** → `ticket_product`

That gives you maximum flexibility.

---

## 🧱 Optimal Schema (From Scratch)

### ER Diagram Overview

### 1️⃣ products (Unified abstraction)

Instead of hard-wiring event vs games in booking logic:

**Table: products**

- `id` (uuid)
- `name`
- `product_type` ENUM('event', 'game')
- `event_id` (nullable)
- `game_id` (nullable)
- `valid_days` integer (nullable)
- `is_active` boolean
- `created_at`

**Meaning:**

- **Event product** → `product_type = 'event'`, `event_id` set
- **Games product** → `product_type = 'games'`, `valid_days` set

This removes ambiguity permanently.

### 2️⃣ ticket_types

Ticket types belong to products — not directly to events or games.

**Table: ticket_types**

- `id`
- `product_id` (FK products.id)
- `category` ENUM('adult','child','senior','student','group')
- `price` numeric
- `max_quantity_per_booking` integer
- `is_active` boolean

Now ticket types are cleanly attached to what is being sold.

### 3️⃣ bookings

**Table: bookings**

- `id`
- `booking_reference`
- `user_id` (nullable)
- `total_amount`
- `booking_status` ENUM('pending','confirmed','cancelled')
- `payment_status` ENUM('pending','completed','failed')
- `guest_email`
- `guest_name`
- `created_at`

Bookings are commerce-level objects. They do **NOT** know about event or game.

### 4️⃣ booking_items

**Table: booking_items**

- `id`
- `booking_id`
- `ticket_type_id`
- `quantity`
- `unit_price`
- `subtotal`

This is pure commerce.

### 5️⃣ tickets

A ticket represents one unit of access.

**Table: tickets**

- `id`
- `booking_id`
- `ticket_type_id`
- `ticket_code`
- `qr_token`
- `status` ENUM('active','used','expired','cancelled')
- `activated_at`
- `expires_at`
- `created_at`

**Important:**

- One ticket = one QR
- If quantity = 3 → 3 tickets created
- Tickets do NOT need to know event/game directly. That is resolved via `ticket_type -> product`.

### 6️⃣ ticket_product (CRITICAL FOR GAME SYSTEM)

This is the clean abstraction.

**Table: ticket_products**

- `id`
- `ticket_id`
- `game_id` (nullable)
- `event_id` (nullable)
- `status` ENUM('available','used')
- `used_at`
- `processed_by_staff_id`

**Meaning:**

- **Event ticket** → 1 entitlement with `event_id`
- **Games ticket** → allow multiple entitlements (per game included)

Now your scanning logic becomes elegant.

---

erDiagram
PRODUCTS ||--o{ TICKET_TYPES : "has many"
TICKET_TYPES ||--o{ BOOKING_ITEMS : "included in"
BOOKINGS ||--o{ BOOKING_ITEMS : "contains"
BOOKINGS ||--o{ TICKETS : "generates"
TICKET_TYPES ||--o{ TICKETS : "defines type of"
TICKETS ||--o{ TICKET_PRODUCTS : "grants access to"

    PRODUCTS {
        uuid      id              PK
        string    name
        enum      product_type
        uuid      event_id        FK "optional"
        uuid      game_id         FK "optional"
        int       valid_days
        boolean   is_active
    }

    TICKET_TYPES {
        uuid      id              PK
        uuid      product_id      FK
        enum      category        "adult / child / etc"
        numeric   price
        int       max_quantity
    }

    BOOKINGS {
        uuid      id              PK
        string    booking_reference
        uuid      user_id         FK
        numeric   total_amount
        enum      booking_status
        enum      payment_status
    }

    BOOKING_ITEMS {
        uuid      id              PK
        uuid      booking_id      FK
        uuid      ticket_type_id  FK
        int       quantity
        numeric   unit_price
        numeric   subtotal
    }

    TICKETS {
        uuid      id              PK
        uuid      booking_id      FK
        uuid      ticket_type_id  FK
        string    ticket_code
        string    qr_token
        enum      status
        timestamp expires_at
    }

    TICKET_PRODUCTS {
        uuid      id              PK
        uuid      ticket_id       FK
        uuid      game_id         FK "optional"
        uuid      event_id        FK "optional"
        enum      status
        timestamp used_at
    }

---

## 🎯 Why This Design Is Optimal

| Concern                  | Table             |
| :----------------------- | :---------------- |
| **What is sold**         | `products`        |
| **Pricing tiers**        | `ticket_types`    |
| **Purchase transaction** | `bookings`        |
| **Line items**           | `booking_items`   |
| **QR unit**              | `tickets`         |
| **Access rights**        | `ticket_products` |

This is enterprise-grade normalization.

---

## 🧠 How Scanning Works (Cleanly)

When QR scanned:

1.  **Fetch ticket**
2.  **Check status + expiration**
3.  **Fetch entitlements**
4.  **If event** → allow entry once
5.  **If games** → show list of available games

No special casing needed.

---

## 🔥 Why Your Current Schema Feels Slightly Awkward

Because:

- `ticket_games` is a partial entitlement system
- `event_id` lives in `bookings` instead of `product`
- "bundle" is implicit
- Commerce and access logic are partially mixed

It works — but it isn’t fully abstracted.

---

## 🚀 If You Wanted Absolute Clean Architecture

You would:

1.  Replace `ticket_games` with `ticket_products`
2.  Introduce `products` abstraction
3.  Remove event/game special-case logic from booking layer

---

## 🏆 Minimal Change Recommendation (Practical)

Since you're already deep into current schema:
Instead of rewriting everything:

1.  Add `booking_type` to `bookings`
2.  Keep `ticket_games`
3.  Keep `ticket_types` tied to game/event
4.  Refactor later if needed

Full redesign only makes sense if you're early stage.

---

## 📌 Final Answer

Optimal from-scratch design uses: `products`, `ticket_types`, `bookings`, `booking_items`, `tickets`, and `ticket_products`.

This handles:

- Events
- Multi-game bundles
- Multi-day passes
- Future expansions (VIP access, season pass, etc.)

**Clean. Scalable. Enterprise-safe.**
