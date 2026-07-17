# 🥛 Milk Management System

A comprehensive dairy management system with customer management, delivery tracking, billing, payments, and a customer self-service portal.

**Tech Stack:** React 18 · Node.js/Express · MySQL · JWT Auth · Tailwind CSS

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ and **npm**
- **MySQL** 8.0+ running locally or on a server

### 1. Clone & Install Dependencies

```bash
# Frontend
cd milk-management
npm install

# Backend
cd backend
npm install
cd ..
```

### 2. Configure Environment

**Backend** — Copy and edit the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your database credentials:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=milk_management_db
JWT_SECRET=your_random_secret_key_here
FRONTEND_URL=http://localhost:3000
```

**Frontend** (optional) — Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Set `REACT_APP_API_URL` to point to your backend (defaults to `http://localhost:5000`).

### 3. Initialize Database

The backend auto-creates all tables on first run. Just make sure MySQL is running and the database exists:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS milk_management_db;"
```

Then start the backend:

```bash
cd backend
npm start
```

The server will create all required tables and seed a default admin account:
- **Username:** `admin`
- **PIN:** `1234`

### 4. Start Frontend

In a separate terminal:

```bash
cd milk-management
npm start
```

The app opens at **http://localhost:3000**.

---

## 📁 Project Structure

```
milk-management/
├── backend/
│   ├── server.js           # Express API server (all routes)
│   ├── init_db.js          # Database initialization & migrations
│   ├── .env.example        # Backend env template
│   └── __tests__/
│       └── server.test.js  # 85 API tests
├── src/
│   ├── App.js              # Main app (lazy routes, login screen, error boundary)
│   ├── index.js            # Entry point (React Query provider)
│   ├── index.css           # Tailwind + custom styles
│   ├── services/
│   │   └── api.js          # API service layer (all endpoints)
│   ├── context/
│   │   └── AppContext.jsx  # Global state (offline fallback)
│   ├── components/
│   │   ├── Sidebar.jsx     # Desktop sidebar nav
│   │   ├── BottomNav.jsx   # Mobile bottom nav
│   │   └── FingerprintManager.jsx  # WebAuthn biometrics
│   ├── pages/              # App pages (admin + portal)
│   ├── ui/                 # Reusable UI primitives
│   └── lib/
│       └── utils.js        # Utility functions
├── public/
│   ├── index.html          # HTML shell
│   ├── manifest.json       # PWA manifest
│   ├── service-worker.js   # Service Worker (network-first for navigation)
│   └── _redirects          # Netlify SPA routing
├── cypress/                # E2E tests (5 spec files)
├── netlify.toml            # Netlify deployment config
├── .env.example            # Frontend env template
└── package.json
```

---

## 🔐 Default Credentials

| Role | Username / Phone | PIN |
|------|-----------------|-----|
| **Admin** | `admin` | `1234` |
| **Customer** | (registered phone) | Set by admin via Portal Access page |

---

## 📖 Feature Guide

### Admin Pages (14 total)

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | default | KPIs, charts, today's deliveries, quick actions |
| **Customers** | `customers` | CRUD, search/filter, wallet balance, customer summary with reports |
| **Deliveries** | `deliveries` | Daily delivery marking, leave overlay, batch entry, extra milk |
| **Billing** | `billing` | Bill generation (single/batch), payments, WhatsApp sharing |
| **Reports** | `reports` | Daily report, monthly report with customer breakdown, P&L statement |
| **Expenses** | `expenses` | CRUD with category/date filtering |
| **Farm Management** | `farm-mgmt` | Cattle inventory, feed purchases, calving alerts |
| **Manage Leaves** | `leaves` | View and cancel customer leave periods |
| **Portal Access** | `access-mgmt` | Set/manage customer PINs for portal login |
| **Access Control** | `access-logs` | Login logs, staff accounts, biometric management |
| **Milk Calculator** | `calculator` | Monthly bill estimator with period-based calculation |
| **Access Logs** | `access-logs` | Login history, staff accounts, customer PIN management |

### Customer Portal (4 pages)

| Page | Description |
|------|-------------|
| **Dashboard** | Today's delivery, subscription info, wallet balance |
| **My Deliveries** | Last 30 days of delivery history |
| **My Bills** | Monthly invoices with payment status |
| **Support** | Submit complaints, contact info |

### API Features

- JWT authentication with httpOnly cookies
- Rate-limited login (10 attempts / 15 min)
- Role-based access (admin, worker, customer)
- bcrypt password hashing
- WebAuthn biometric authentication
- Transaction-safe payment recording
- Auto-generated bills from actual deliveries
- Wallet credit system for overpayments
- Telegram notifications for customer updates & complaints
- CORS security with allowed origins

---

## 🧪 Testing

### Backend Tests (85 tests)

```bash
cd backend
npm test
```

Covers all route groups: auth, customers, users, deliveries, leave, bills, payments, credits, expenses, cattle, feed, analytics, reports, portal, WebAuthn, admin.

### E2E Tests (Cypress)

```bash
npx cypress run               # Headless
npx cypress run --headed      # Visible browser
npx cypress open              # Interactive mode
```

### Frontend Tests

```bash
npm test
```

---

## ☁️ Deployment (Netlify + Backend Host)

### Frontend → Netlify

1. Push to GitHub
2. Connect repo in Netlify
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. **Important:** Set environment variable:
   - `REACT_APP_API_URL` → URL of your hosted backend

Netlify automatically picks up `netlify.toml` and `public/_redirects` for SPA routing.

### Backend → Render / Railway / VPS

1. Deploy `backend/` to Render (Web Service) or Railway
2. Set all environment variables (DB_HOST, DB_PASSWORD, JWT_SECRET, etc.)
3. Make sure the backend has a public URL that the frontend can reach

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port |
| `DB_HOST` | No | `localhost` | MySQL host |
| `DB_USER` | No | `root` | MySQL user |
| `DB_PASSWORD` | **Yes** | — | MySQL password |
| `DB_NAME` | No | `milk_management_db` | Database name |
| `JWT_SECRET` | **Yes** | — | JWT signing secret |
| `FRONTEND_URL` | No | `http://localhost:3000` | Allowed CORS origin(s) |
| `TELEGRAM_BOT_TOKEN` | No | — | Bot token for notifications |
| `TELEGRAM_CHAT_ID` | No | — | Chat ID for notifications |
| `WEBAUTHN_ORIGIN` | No | `http://localhost:3000` | WebAuthn origin |

### Frontend (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_API_URL` | No | `http://localhost:5000` | Backend API base URL |
| `REACT_APP_SUPPORT_PHONE` | No | `+91 9876543210` | Support phone number |

---

## 🤝 Support

For issues or questions, please create a GitHub issue or contact the development team.

---

## 📄 License

This project is for educational and business use.
