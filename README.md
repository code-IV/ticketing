# Bora Amusement Park - Online Ticketing System

A complete full-stack online ticketing system for Bora Amusement Park built with Next.js, Node.js/Express, and PostgreSQL.

## 🏗️ Architecture

```
BORA SYS/
├── backend/          # Node.js/Express API (Port 5000)
│   ├── src/
│   │   ├── config/       # Database & session configuration
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth & validation
│   │   ├── database/     # Migrations & seeds
│   │   └── utils/        # Helper functions
│   └── package.json
│
└── frontend/         # Next.js 14 App (Port 3000)
    ├── src/
    │   ├── app/          # Pages (App Router)
    │   ├── components/   # Reusable UI components
    │   ├── contexts/     # React contexts (Auth)
    │   ├── services/     # API service layer
    │   ├── types/        # TypeScript types
    │   └── lib/          # Utilities
    └── package.json
```

## 🚀 Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL 14+
- **Authentication:** Session-based (express-session + connect-pg-simple)
- **Validation:** express-validator
- **Security:** helmet, bcrypt, CORS

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **UI Components:** Custom components with Lucide icons
- **QR Codes:** qrcode.react
- **Date Handling:** date-fns

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## ⚙️ Setup Instructions

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set your PostgreSQL password

# Create database
psql -U postgres -c "CREATE DATABASE bora_ticketing;"

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed

# Start backend server
npm run dev
```

Backend runs at `http://localhost:5000`

**Default Credentials:**
- Admin: `admin@borapark.com` / `admin123`
- Visitor: `visitor@example.com` / `visitor123`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# Start frontend development server
npm run dev
```

Frontend runs at `http://localhost:3000`

## 🎯 Features

### Public Features
- ✅ Browse upcoming events
- ✅ View event details with ticket types
- ✅ Real-time availability checking
- ✅ User registration and login
- ✅ Responsive mobile-first design

### User Features
- ✅ Book tickets with multiple ticket types
- ✅ Multiple payment methods (Telebirr, Credit/Debit Card, Cash)
- ✅ View booking history
- ✅ Download/print tickets with QR codes
- ✅ Cancel bookings
- ✅ Update profile

### Admin Features
- ✅ Dashboard with revenue statistics
- ✅ Create and manage events
- ✅ Create and manage ticket types
- ✅ View all bookings
- ✅ Cancel bookings
- ✅ User management
- ✅ Revenue reports

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login
- `POST /logout` - Logout
- `GET /me` - Get current user
- `PUT /profile` - Update profile
- `PUT /change-password` - Change password

### Events (`/api/events`) - Public
- `GET /` - List active events
- `GET /:id` - Get event details with ticket types
- `GET /:id/availability` - Check availability
- `GET /:id/ticket-types` - Get ticket types

### Bookings (`/api/bookings`) - Authenticated
- `POST /` - Create booking
- `GET /my` - Get user's bookings
- `GET /:id` - Get booking details
- `GET /reference/:ref` - Lookup by reference
- `POST /:id/cancel` - Cancel booking
- `GET /:id/tickets` - Get booking tickets

### Admin (`/api/admin`) - Admin Only
- `GET /dashboard` - Dashboard stats
- `GET /events` - All events
- `POST /events` - Create event
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Deactivate event
- `POST /ticket-types` - Create ticket type
- `PUT /ticket-types/:id` - Update ticket type
- `DELETE /ticket-types/:id` - Deactivate ticket type
- `GET /bookings` - All bookings
- `POST /bookings/:id/cancel` - Cancel booking
- `GET /users` - All users
- `PATCH /users/:id/toggle-active` - Toggle user status
- `GET /reports/revenue` - Revenue summary
- `GET /reports/daily-revenue` - Daily revenue

## 🗄️ Database Schema

### Main Tables
- `users` - User accounts (admin/visitor)
- `events` - Park events/days
- `ticket_types` - Ticket pricing tiers
- `bookings` - Customer bookings
- `booking_items` - Line items per booking
- `tickets` - Individual tickets with QR codes
- `payments` - Payment records
- `user_sessions` - Session storage

## 🔐 Security Features

- Session-based authentication (no JWT)
- Password hashing with bcrypt (12 rounds)
- HTTPS/TLS ready
- CORS configuration
- SQL injection protection
- XSS protection via helmet
- Input validation on all endpoints
- Role-based access control

## 📱 User Flow

1. **Browse Events** → View available events
2. **Select Tickets** → Choose ticket types and quantities
3. **Login/Register** → Authenticate (if not logged in)
4. **Complete Booking** → Select payment method and confirm
5. **Receive Tickets** → Get QR codes for park entry
6. **Manage Bookings** → View, print, or cancel bookings

## 🛠️ Development

### Backend Scripts
```bash
npm run dev          # Development with nodemon
npm start            # Production
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
```

### Frontend Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint
```

## 🚢 Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use strong `SESSION_SECRET`
3. Configure PostgreSQL connection
4. Enable HTTPS
5. Set up process manager (PM2)

### Frontend
1. Build: `npm run build`
2. Set `NEXT_PUBLIC_API_URL` to production API
3. Deploy to Vercel/Netlify or self-host

## 📊 Performance

- Session-based auth for stateful connections
- Database connection pooling (max 20)
- Transactional booking operations
- Optimized queries with indexes
- Client-side caching with React Query potential

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Event browsing and filtering
- [ ] Ticket booking flow
- [ ] Payment method selection
- [ ] QR code generation
- [ ] Booking cancellation
- [ ] Admin event creation
- [ ] Admin booking management
- [ ] Revenue reports

## 📝 License

Proprietary - Bora Amusement Park

## 👥 Support

For issues or questions, contact the development team.

---

**Built with precision and discipline for Bora Amusement Park** 🎢
