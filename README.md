# Medical Booking & Center Management System

A production-ready, full-stack healthcare clinic and medical center management system built with **React**, **Node.js**, **Express**, and **MySQL**. Designed for clinics, outpatient centers, and multi-specialty healthcare practices with full bilingual support (Arabic RTL & English LTR).

---

## 🌟 Key Features

- **Role-Based Access Control (RBAC):** Granular permissions for Admin, Doctor, Receptionist, Pharmacist, and Patient roles.
- **Appointments Management:** Book, reschedule, cancel, and track appointments with conflict detection, search, and multi-status filtering.
- **Patient Management:** Full medical records including demographics, emergency contacts, blood type, allergies, and chronic conditions.
- **Doctor Profiles & Scheduling:** Specialties, consultation fees, custom work days, shift times, and slot duration.
- **Modern Responsive UI:** Clean SaaS interface built with Tailwind CSS, supporting both Arabic (RTL) and English (LTR), plus light/dark theme switching.
- **Security & Reliability:** JWT authentication, bcrypt password hashing, Joi request validation, Helmet security headers, rate limiting, and centralized error handling.
- **RESTful API Documentation:** Interactive Swagger UI documentation available out of the box.

---

## 🏗 System Architecture

```
booking-system/
├── backend/
│   ├── config/          # Database connection pool and environment configuration
│   ├── controllers/     # Request handlers (auth, appointments, patients, doctors)
│   ├── middleware/      # Auth verification, role authorization, validation, error handler
│   ├── models/          # Database query abstractions and SQL transactions
│   ├── routes/          # Express route definitions
│   ├── scripts/         # Database migration runner scripts
│   ├── services/        # Business logic layer
│   ├── tests/           # Automated API integration tests
│   ├── utils/           # Shared utilities (logger, tokens, password hashing)
│   ├── validations/     # Joi validation schemas
│   ├── app.js           # Express application setup
│   └── server.js        # Server entry point
├── database/
│   ├── 001_create_database.sql       # Database creation script
│   ├── 002 medical center schema.sql # Core medical center relational schema
│   └── migrations.sql                # Production schema updates and table alterations
├── docs/
│   └── PROJECT_PROGRESS.md           # Backend module milestones and progress history
└── frontend/
    ├── src/
    │   ├── components/  # Layout, modals, forms, and UI primitives
    │   ├── pages/       # Route pages (Dashboard, Appointments, Patients, Login)
    │   ├── services/    # Fetch-based API client modules
    │   ├── context/     # AuthContext and session state
    │   ├── i18n/        # Bi-directional Arabic & English translations
    │   ├── routes/      # Protected and public route trees
    │   ├── App.jsx      # Application routing and layout shell
    │   └── main.jsx     # Application root mount
    └── package.json
```

---

## 🛠 Technology Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js 4.x
- **Database:** MySQL 8.x with `mysql2/promise` connection pooling
- **Security:** `jsonwebtoken`, `bcryptjs`, `helmet`, `express-rate-limit`, `cors`
- **Validation:** `joi`
- **Logging:** `winston`, `morgan`
- **Documentation:** `swagger-ui-express`, `swagger-jsdoc`

### Frontend
- **Framework:** React 18 (JSX)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with custom medical design system
- **Routing:** `react-router-dom` v6
- **State & i18n:** React Context API (AuthContext, LanguageContext)
- **Internationalization:** Full Arabic (RTL) & English (LTR) with theme toggling

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher)
- [MySQL](https://www.mysql.com/) Server (version 8.0 or higher)
- [Git](https://git-scm.com/)

### 2. Environment Configuration
Copy `.env.example` to `.env` in the root directory (or configure existing `.env`):

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=booking_db
DB_PORT=3306

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

### 3. Database Setup
Create the database and apply migrations:

```bash
# 1. Run migrations to initialize tables and schema
npm run migrate
```

Alternatively, import `database/001_create_database.sql`, `database/002 medical center schema.sql`, and `database/migrations.sql` using MySQL Workbench or CLI.

### 4. Running the Backend
From the project root:

```bash
# Install root dependencies
npm install

# Start in development mode (with nodemon)
npm run dev

# Or start in production mode
npm start
```

The backend server will run on `http://localhost:3000`.
- API Health Check: `http://localhost:3000/health`
- Swagger Documentation: `http://localhost:3000/api-docs`

### 5. Running the Frontend
In a separate terminal:

```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will start at `http://localhost:5173`.

---

## 🧪 Testing & Verification

```bash
# Run backend API test suite
npm test

# Run frontend linting
cd frontend && npm run lint

# Run frontend production build
cd frontend && npm run build
```

---

## 📄 License

This project is licensed under the ISC License.
