# Quick Setup Guide

## Prerequisites Check

```bash
# Check Node.js version (need 18+)
node --version

# Check PostgreSQL (need 14+)
psql --version
```

## Step-by-Step Setup

### 1. Backend Setup (5 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure database credentials
# Edit backend/.env and set DB_PASSWORD to your PostgreSQL password

# Create database
psql -U postgres -c "CREATE DATABASE bora_ticketing;"

# Run migrations
npm run db:migrate

# Seed sample data (creates admin and sample events)
npm run db:seed

# Start backend
npm run dev
```

✅ Backend should be running at `http://localhost:5000`

### 2. Frontend Setup (3 minutes)

```bash
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# Start frontend
npm run dev
```

✅ Frontend should be running at `http://localhost:3000`

### 3. Test the System

1. Open browser: `http://localhost:3000`
2. Click "Sign In"
3. Login as admin: `admin@borapark.com` / `admin123`
4. Navigate to Admin Dashboard
5. Create a new event
6. Logout and register as a new user
7. Book tickets for the event
8. View your booking with QR codes

## Common Issues

### Backend won't start
- **Error: password authentication failed**
  - Fix: Update `DB_PASSWORD` in `backend/.env`
  
- **Error: database "bora_ticketing" does not exist**
  - Fix: Run `psql -U postgres -c "CREATE DATABASE bora_ticketing;"`

### Frontend won't connect to backend
- **Error: Network Error**
  - Fix: Ensure backend is running on port 5000
  - Fix: Create `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

### Port already in use
- **Backend (5000):** Change `PORT` in `backend/.env`
- **Frontend (3000):** Run `npm run dev -- -p 3001`

## Default Credentials

**Admin Account:**
- Email: `admin@borapark.com`
- Password: `admin123`

**Test Visitor:**
- Email: `visitor@example.com`
- Password: `visitor123`

## Project Structure

```
BORA SYS/
├── backend/          # Express API (Port 5000)
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── database/
│   ├── .env          # Database credentials
│   └── package.json
│
└── frontend/         # Next.js App (Port 3000)
    ├── src/
    │   ├── app/          # Pages
    │   ├── components/   # UI components
    │   ├── services/     # API calls
    │   └── contexts/     # Auth state
    ├── .env.local    # API URL
    └── package.json
```

## Next Steps

1. **Customize branding** - Update colors in `frontend/tailwind.config.ts`
2. **Add payment integration** - Implement Telebirr/Stripe in backend
3. **Email notifications** - Configure SendGrid in backend
4. **Deploy** - See README.md for deployment instructions

## Support

If you encounter issues:
1. Check both backend and frontend terminals for errors
2. Verify PostgreSQL is running
3. Ensure ports 3000 and 5000 are available
4. Review the full README.md for detailed documentation
