# Grocery Shop Management System (MERN)

A full-stack POS (Point of Sale) and Inventory Management application for small grocery stores.

## Features
- Shop owner authentication (register/login, JWT)
- Dashboard with sales stats and charts
- Product management (CRUD, search, categories, units)
- POS billing with invoice generation, print/PDF, stock validation
- Inventory management, low-stock alerts, stock adjustments and movement history
- Stock purchase management from suppliers
- Sales history with search/filter, invoice reprint, CSV export
- Reports (daily/weekly/monthly/custom, profit, top products, purchases)
- Shop settings for invoice details

**No payment gateway or payment method tracking is included.** Generating a bill records a completed sale.

## Tech Stack
- **Frontend:** React (Vite), JavaScript, Tailwind CSS, React Router, Axios, Recharts, react-hot-toast, date-fns
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs

## Project Structure
```
grocery-shop-management/
  client/        # React + Vite frontend
  server/        # Express + MongoDB backend
```

## Prerequisites
- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI

> **Transactions:** Sales and purchase operations attempt MongoDB transactions. Transactions require MongoDB to run as a **replica set** (including Atlas or a single-node replica set). The server includes a fallback for standalone MongoDB instances in development, but a replica set is recommended for full atomicity.

## Setup

### 1. Backend
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET
npm run seed   # optional: creates demo user and sample products
npm run dev
```
Server runs on `http://localhost:5000` by default.

### 2. Frontend
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:5173` by default.

If your API is not on `http://localhost:5000`, create `client/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

## Demo Credentials (after seeding)
- Email: `owner@groceryshop.com`
- Password: `password123`

## Environment Variables
See `server/.env.example`:
- `PORT` - server port
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - token expiry (e.g. 7d)
- `CLIENT_URL` - frontend origin for CORS
- `NODE_ENV` - development/production

## API Overview
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Products: `/api/products`
- Sales/Billing: `/api/sales`
- Inventory: `/api/inventory`, `/api/inventory/low-stock`, `/api/inventory/adjustment`, `/api/inventory/movements`
- Purchases: `/api/purchases`
- Dashboard: `/api/dashboard/stats`, `/api/dashboard/sales-chart`, `/api/dashboard/top-products`
- Reports: `/api/reports/sales`, `/api/reports/profit`, `/api/reports/top-products`, `/api/reports/purchases`
- Settings: `/api/settings`

## Notes
- All prices/totals are calculated on the backend.
- Stock is validated before sale completion and deducted only after successful save.
- Completed sales are not deleted via the UI.
- Product prices at time of sale are stored as snapshots for accurate profit reporting.
