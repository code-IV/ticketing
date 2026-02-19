# Bora Amusement Park - Online Ticketing System (Backend API)

A Node.js/Express backend API with PostgreSQL for the Bora Amusement Park online ticketing system. Built with MVC architecture and session-based authentication.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Authentication:** Session-based (express-session + connect-pg-simple)
- **Validation:** express-validator
- **Security:** helmet, bcrypt, CORS

## Project Structure

```
src/
├── config/
│   ├── db.js              # PostgreSQL connection pool
│   └── session.js         # Session configuration
├── controllers/
│   ├── adminController.js # Admin dashboard, CRUD, reports
│   ├── authController.js  # Register, login, logout, profile
│   ├── bookingController.js # Create/view/cancel bookings
│   ├── eventController.js # Public event browsing
│   └── ticketController.js # Ticket lookup and validation
├── database/
│   ├── migrate.js         # Run schema migration
│   ├── schema.sql         # Full database schema
│   └── seed.js            # Seed sample data
├── middleware/
│   ├── auth.js            # Authentication & authorization
│   ├── errorHandler.js    # Global error handling
│   └── validate.js        # Request validation rules
├── models/
│   ├── Booking.js         # Booking model (transactional)
│   ├── Event.js           # Event model
│   ├── Payment.js         # Payment model + reports
│   ├── Ticket.js          # Individual ticket model
│   ├── TicketType.js      # Ticket type/pricing model
│   └── User.js            # User model
├── routes/
│   ├── adminRoutes.js     # /api/admin/*
│   ├── authRoutes.js      # /api/auth/*
│   ├── bookingRoutes.js   # /api/bookings/*
│   ├── eventRoutes.js     # /api/events/*
│   └── ticketRoutes.js    # /api/tickets/*
├── utils/
│   └── helpers.js         # Utility functions
├── app.js                 # Express app setup
└── server.js              # Server entry point
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update `DB_PASSWORD` and `SESSION_SECRET` in `.env`.

### 3. Create Database

```sql
CREATE DATABASE bora_ticketing;
```

### 4. Run Migrations

```bash
npm run db:migrate
```

### 5. Seed Sample Data

```bash
npm run db:seed
```

This creates:
- **Admin:** admin@borapark.com / admin123
- **Visitor:** visitor@example.com / visitor123
- Sample events and ticket types

### 6. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000`

## API Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | Login |
| POST | `/logout` | Yes | Logout |
| GET | `/me` | Yes | Get current user |
| PUT | `/profile` | Yes | Update profile |
| PUT | `/change-password` | Yes | Change password |

### Events (`/api/events`) - Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List active upcoming events |
| GET | `/:id` | Get event with ticket types |
| GET | `/:id/availability` | Check ticket availability |
| GET | `/:id/ticket-types` | Get ticket types for event |

### Bookings (`/api/bookings`) - Authenticated
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create a booking |
| GET | `/my` | Get my bookings |
| GET | `/:id` | Get booking details |
| GET | `/reference/:ref` | Lookup by reference |
| POST | `/:id/cancel` | Cancel a booking |
| GET | `/:id/tickets` | Get tickets for booking |

### Tickets (`/api/tickets`) - Authenticated
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/:id` | User | Get ticket by ID |
| GET | `/code/:code` | User | Get ticket by code |
| POST | `/validate/:code` | Admin | Validate ticket at gate |

### Admin (`/api/admin`) - Admin Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard summary |
| GET | `/events` | All events (inc. inactive) |
| POST | `/events` | Create event |
| PUT | `/events/:id` | Update event |
| DELETE | `/events/:id` | Deactivate event |
| POST | `/ticket-types` | Create ticket type |
| PUT | `/ticket-types/:id` | Update ticket type |
| DELETE | `/ticket-types/:id` | Deactivate ticket type |
| GET | `/bookings` | All bookings |
| GET | `/bookings/:id` | Booking details |
| POST | `/bookings/:id/cancel` | Cancel booking |
| GET | `/users` | All users |
| GET | `/users/:id` | User details |
| PATCH | `/users/:id/toggle-active` | Activate/deactivate user |
| GET | `/reports/revenue` | Revenue summary |
| GET | `/reports/daily-revenue` | Daily revenue report |
| GET | `/reports/payments` | All payments |

## Create Booking Example

```json
POST /api/bookings
{
  "eventId": "uuid-here",
  "items": [
    { "ticketTypeId": "uuid-here", "quantity": 2 },
    { "ticketTypeId": "uuid-here", "quantity": 1 }
  ],
  "paymentMethod": "telebirr",
  "notes": "Birthday celebration"
}
```
