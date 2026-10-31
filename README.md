# Vita Medical Complex | مجمع فيتا الطبي



[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

[![Express.js](https://img.shields.io/badge/Express.js-4.18%2B-000000?logo=express&logoColor=white)](https://expressjs.com/)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)

[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)

[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0.0-85EA2D?logo=openapi-initiative&logoColor=black)](http://localhost:3000/api-docs)

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)



A modern, full-stack medical clinic and outpatient complex management system engineered with **React 18**, **Node.js (Express)**, and **MySQL 8**. Designed specifically for polyclinics, ambulatory care centers, and specialized medical practices, the platform provides seamless **bilingual support (Arabic RTL & English LTR)**, dynamic **light/dark themes**, and strict **multi-role data isolation**.



---



## 📑 Table of Contents



- [Overview](#-overview)

- [System Architecture](#-system-architecture)

- [Key Features & Workspaces](#-key-features--workspaces)

  - [1. Specialty-Specific Clinical Suites](#1-specialty-specific-clinical-suites)

  - [2. Multi-Role RBAC & Data Isolation](#2-multi-role-rbac--data-isolation)

  - [3. Appointment Scheduling & Slot Collision Prevention](#3-appointment-scheduling--slot-collision-prevention)

  - [4. Doctor Credential Verification Workflow](#4-doctor-credential-verification-workflow)

  - [5. Electronic Prescriptions & Pharmacy Dispensary](#5-electronic-prescriptions--pharmacy-dispensary)

  - [6. Billing, Invoices & POS Cashier](#6-billing-invoices--pos-cashier)

  - [7. In-App Notifications & Automated Reminders](#7-in-app-notifications--automated-reminders)

  - [8. Bilingual RTL/LTR Interface & Theme Engine](#8-bilingual-rtlltr-interface--theme-engine)

- [Technology Stack](#-technology-stack)

- [Project Directory Structure](#-project-directory-structure)

- [Installation & Database Setup Guide](#-installation--database-setup-guide)

  - [1. Prerequisites](#1-prerequisites)

  - [2. Database Initialization (MySQL)](#2-database-initialization-mysql)

  - [3. Environment Configuration](#3-environment-configuration)

  - [4. Run Database Migrations](#4-run-database-migrations)

  - [5. Backend Server Execution](#5-backend-server-execution)

  - [6. Frontend Client Execution](#6-frontend-client-execution)

- [Evaluation Test Accounts](#-evaluation-test-accounts)

- [API Reference & Route Map](#-api-reference--route-map)

- [Automated Testing & Quality Verification](#-automated-testing--quality-verification)

- [Deployment Notes & Known Limitations](#-deployment-notes--known-limitations)

- [License](#-license)



---



## 🏥 Overview



**Vita Medical Complex (مجمع فيتا الطبي)** provides an integrated digital backbone for healthcare facilities. Unlike generic booking systems, it bridges clinical documentation, patient self-service, front-desk coordination, pharmacy stock management, and administrative financial auditing into a unified, secure system.



### Key Value Propositions:

- **Clinical Depth:** Custom clinical interfaces tailored to medical specialties (Dentistry, Ophthalmology, Orthopedics, Laboratory, Radiology).

- **Strict Data Governance:** Clinicians only see their assigned patients and schedules; patients access only their own medical history; financial profit margins remain restricted to executive management.

- **Bilingual & Culturally Native:** Native Arabic Right-to-Left (RTL) layout alongside English Left-to-Right (LTR) with instant client-side toggling.

- **Enterprise Modularity:** Clear separation of concerns between presentation, business logic, relational query models, and automated scheduling.



---



## 🏗 System Architecture



The project is built on a decoupled client-server architecture:



```

┌───────────────────────────────────────────────────────────┐

│                    Frontend (React 18 + Vite)             │

│  - Custom Design System (CSS Variables, Dark/Light Themes)│

│  - Bi-Directional i18n (Arabic RTL / English LTR)         │

│  - Role-Protected Route Guards & Role-Scoped Dashboards    │

│  - Specialized Diagnostic Modules (Odontogram, Eye Chart) │

└─────────────────────────────┬─────────────────────────────┘

                              │ REST APIs (JSON / JWT)

                              ▼

┌───────────────────────────────────────────────────────────┐

│                Backend API Server (Express.js)            │

│  - Security Pipeline: Helmet, CORS, Rate Limiting, Joi     │

│  - Authentication & RBAC Middleware (JWT Verification)     │

│  - Controllers & Business Logic Services                  │

│  - Background Appointment Reminder Scheduler (48h scan)    │

│  - Native OpenAPI 3.0 Documentation (Swagger UI)          │

└─────────────────────────────┬─────────────────────────────┘

                              │ Connection Pool (mysql2/promise)

                              ▼

┌───────────────────────────────────────────────────────────┐

│                  Database Layer (MySQL 8.0)               │

│  - Relational Schema (14 Tables, Foreign Keys, Indexes)   │

│  - 5-Role ENUM ('patient','doctor','pharmacist',...)      │

│  - Safe Idempotent DDL Migrations & Soft Deletions        │

└───────────────────────────────────────────────────────────┘

```



---



## 🌟 Key Features & Workspaces



### 1. Specialty-Specific Clinical Suites

Outpatient doctors do not share identical clinical documentation needs. The system features dedicated clinical workspaces for 5 active specialties:

- **Dentistry (طب الأسنان):** Interactive adult 32-tooth odontogram allowing clinicians to select tooth numbers and log conditions (decayed, filled, missing, crown, bridge, implant) alongside procedure notes.

- **Radiology & Ultrasound (الأشعة والسونار):** Structured diagnostic imaging report generator supporting Ultrasound, X-Ray, CT, and MRI modalities with dedicated clinical findings, impressions, and recommendations.

- **Medical Laboratory (المختبر والتحاليل):** Diagnostic test ordering and result entry with predefined reference intervals for CBC, Blood Glucose, Lipid Profiles, Liver Function, Renal Function, and Urinalysis.

- **Ophthalmology (طب وجراحة العيون):** Visual acuity evaluation (Snellen charts / fractional ratings), intraocular pressure (IOP) tracking, slit-lamp examination findings, and refraction records.

- **Orthopedics & Fractures (العظام والمفاصل):** Musculoskeletal assessment suite with joint mobility tracking, range-of-motion (ROM) grading, fracture classification, and immobilization plans.



### 2. Multi-Role RBAC & Data Isolation

Role-Based Access Control is enforced at both the Express middleware layer (`authenticate`, `authorize`) and SQL query parameterization:

- **Admin / Manager:** Total operational oversight—staff account management, doctor fee configuration, pending doctor credential audits, expense tracking, and clinic net-profit KPIs.

- **Doctor:** Manages personal consultation schedule, patient clinical encounters, medical history notes, and electronic prescriptions. Strict row-level isolation prevents doctors from viewing other clinicians' schedules or fee earnings.

- **Receptionist:** Front-desk appointment booking, patient check-in/out, visit invoice generation, debt collection, and cashier payment processing. Managerial expenses and clinic net-profit reports are hidden.

- **Pharmacist:** Prescription fulfillment and dispensing, medication catalog management, manual stock adjustments, supplier registry, and inventory audit logs.

- **Patient:** Self-service portal to request appointments, view past and upcoming visits, review diagnostic results, track electronic prescriptions, and manage in-app reminders.



### 3. Appointment Scheduling & Slot Collision Prevention

- Real-time time-slot calculation derived from doctor working days, shift start/end hours, and appointment duration intervals (e.g., 30 minutes).

- Collision detection preventing double-booking of doctors across overlapping intervals.

- Status lifecycle: `pending` (online request) → `confirmed` (front-desk verified) → `completed` (post-consultation) / `cancelled` / `no_show`.

- Safe soft-deletion with `deleted_at` timestamps to preserve clinical audit trails.



### 4. Doctor Credential Verification Workflow

- Clinicians can register via a specialized doctor registration flow requiring professional medical license numbers and specialty selection.

- New doctor accounts are created in a `pending` state (`is_active = 0`) preventing unauthorized clinical access.

- Administrators review submitted licensing documents and credentials via a dedicated verification portal (`/api/v1/users/pending-doctors`) with one-click approval or rejection.



### 5. Electronic Prescriptions & Pharmacy Dispensary

- Doctors write digital prescriptions directly within patient consultation records, specifying medication dosage, frequency, and duration.

- Pharmacists view unfulfilled prescriptions, dispense medications, and verify stock availability.

- Pharmacy inventory tracks generic names, brands, dosage forms, strengths, stock quantities, and minimum alert thresholds.

- Transaction audit trail logs all inventory events (incoming orders, dispensing deductions, manual corrections).



### 6. Billing, Invoices & POS Cashier

- Itemized invoice generation linking consultation fees and procedural charges.

- Automated calculation of subtotal, tax rates, applied discounts, amount paid, and remaining debt.

- Cashier payment modal supporting multiple payment methods (Cash, Card, Insurance) with printable, formatted receipt views.



### 7. In-App Notifications & Automated Reminders

- Event-triggered notifications for booking requests, receptionist confirmations, and cancellations.

- Background scheduler scanning confirmed appointments 48 hours in advance to dispatch automated reminder alerts.

- Built-in notification deduplication ensuring patients receive exactly one reminder per appointment.

- Email notification service currently supports simulated console-logging mode; live SMTP delivery is not presented as an active integration.



### 8. Bilingual RTL/LTR Interface & Theme Engine

- Native bi-directional layout switching between Arabic (RTL) and English (LTR) with instant UI adaptation.

- Built with custom CSS custom properties (tokens), guaranteeing zero layout shift when toggling between dark and light themes.



---



## 🛠 Technology Stack



### Backend

| Technology | Version | Purpose |

| :--- | :--- | :--- |

| **Node.js** | v18+ | JavaScript runtime engine |

| **Express.js** | ^4.18.2 | REST API routing and HTTP server |

| **MySQL 8.0** | 8.0+ | Enterprise relational database |

| **mysql2** | ^3.6.5 | Fast MySQL client with Promise-based connection pooling |

| **jsonwebtoken** | ^9.0.2 | Stateless JWT token issuance and verification |

| **bcryptjs** | ^2.4.3 | Salted password hashing (cost factor 12) |

| **Joi** | ^17.11.0 | Request body validation schemas |

| **Helmet** | ^7.1.0 | HTTP security headers |

| **express-rate-limit** | ^7.1.5 | Brute-force protection and rate limiting |

| **cors** | ^2.8.5 | Cross-Origin Resource Sharing control |

| **Winston & Morgan** | ^3.11 / ^1.10 | Structured application logging and HTTP request tracing |

| **Swagger UI / JSDoc** | ^5.0 / ^6.2 | OpenAPI 3.0.0 interactive documentation |



### Frontend

| Technology | Version | Purpose |

| :--- | :--- | :--- |

| **React** | ^18.2.0 | Declarative component UI library |

| **Vite** | ^5.4.0 | Next-generation frontend build tooling and HMR dev server |

| **React Router** | ^6.20.0 | Client-side routing with role-based route guards |

| **CSS Custom Properties** | Native | Complete Medical Design System (zero heavy external CSS bloat) |

| **Context API** | Native | Authentication (`AuthContext`) and localization state |



---



## 📂 Project Directory Structure



```

booking-system/

├── backend/

│   ├── config/              # MySQL connection pool configuration

│   ├── controllers/         # HTTP request controllers (auth, appointments, patients, etc.)

│   ├── data/                # Seed stores (pharmacy initial catalog, suppliers)

│   ├── docs/                # OpenAPI 3.0 specification & Swagger definitions

│   ├── errors/              # Custom AppError and centralized error handlers

│   ├── middleware/          # JWT auth, RBAC authorization, validation, rate limiting

│   ├── models/              # Relational SQL models and database queries

│   ├── routes/              # Express API route modules (14 mounted endpoints)

│   ├── scripts/             # Database migration engine (runMigrations.js)

│   ├── services/            # Core business logic (auth, appointments, pharmacy, reminders)

│   ├── tests/               # Integration test suite (Node.js native test runner)

│   ├── utils/               # Structured responses, JWT helpers, logging utilities

│   ├── validations/         # Joi validation schemas

│   ├── app.js               # Express application pipeline setup

│   └── server.js            # Server entry point & reminder scheduler lifecycle

├── database/

│   ├── 001_create_database.sql       # Database & user creation script for MySQL Workbench

│   ├── 002 medical center schema.sql # Relational schema (tables, foreign keys, enums)

│   └── migrations.sql                # Production schema updates & column migrations

├── docs/

│   └── PROJECT_PROGRESS.md           # Implementation milestone log

├── frontend/

│   ├── public/              # Static public assets (brand favicon, emblems)

│   ├── src/

│   │   ├── assets/          # SVG brand logos and icons

│   │   ├── components/      # UI primitives, BrandLogo, Navbar, Modals

│   │   ├── context/         # AuthContext and session state

│   │   ├── i18n/            # Arabic & English translation dictionaries

│   │   ├── layouts/         # AppLayout shell with responsive sidebar & topnav

│   │   ├── pages/           # Application views:

│   │   │   ├── appointments/  # Scheduling, cancellation, and booking modals

│   │   │   ├── auth/          # Login and registration pages

│   │   │   ├── billing/       # Invoices, cashier POS, and payment tracking

│   │   │   ├── dashboard/     # Role-specific dashboards & 5 specialty suites

│   │   │   ├── doctors/       # Doctor directory and consultation settings

│   │   │   ├── patient/       # Patient self-service portal views

│   │   │   ├── patients/      # Patient demographic management

│   │   │   ├── pharmacy/      # Dispensary, prescription fulfillment, catalog

│   │   │   └── records/       # Clinical encounter records

│   │   ├── routes/          # AppRouter and ProtectedRoute role guards

│   │   ├── services/        # Frontend API client modules (fetch-based)

│   │   ├── styles/          # Global CSS tokens, RTL layouts, themes

│   │   ├── App.jsx          # Top-level application component

│   │   └── main.jsx         # DOM entry point

│   ├── index.html           # HTML template

│   ├── package.json         # Frontend dependencies and build scripts

│   └── vite.config.js       # Vite build configuration & API proxy

├── .env.example             # Environment variable template

├── .gitignore               # Ignored runtime artifacts, secrets, and caches

├── LICENSE                  # ISC License

└── package.json             # Root backend scripts and dependencies

```



---



## 🚀 Installation & Database Setup Guide



### 1. Prerequisites

- **Node.js:** v18.0.0 or higher ([Download Node.js](https://nodejs.org/))

- **MySQL Server:** v8.0 or higher ([Download MySQL](https://dev.mysql.com/downloads/installer/))

- **MySQL Workbench** or MySQL CLI

- **Git**



---



### 2. Database Initialization (MySQL)



The application connects using a dedicated database user. Initialize the database and user permissions in MySQL:



1. Open **MySQL Workbench** and connect to your local MySQL server as `root` (or an administrator).

2. Open a query tab and execute the following SQL:



```sql

*-- 1. Create the database*

CREATE DATABASE IF NOT EXISTS booking_db

  CHARACTER SET utf8mb4

  COLLATE utf8mb4_unicode_ci;



*-- 2. Create the application user (replace 'your_secure_password' with your password)*

CREATE USER IF NOT EXISTS 'booking_app'@'localhost'

  IDENTIFIED BY 'your_secure_password';



*-- 3. Grant required privileges on the database*

GRANT SELECT, INSERT, UPDATE, DELETE,
    CREATE, ALTER, INDEX, REFERENCES,
    CREATE VIEW, SHOW VIEW
ON booking_db.* TO 'booking_app'@'localhost';



*-- 4. Apply privilege changes*

FLUSH PRIVILEGES;

```



---



### 3. Environment Configuration



1. In the root directory, create a `.env` file from the example template:

   ```bash

   # Windows PowerShell

   copy .env.example .env



   # Linux / macOS

   cp .env.example .env

   ```



2. Open `.env` and verify your configuration:

   ```env

   # Server Configuration

   PORT=3000

   NODE_ENV=development



   # Database Configuration (MySQL)

   DB_HOST=localhost

   DB_PORT=3306

   DB_USER=booking_app

   DB_PASSWORD=your_secure_password

   DB_NAME=booking_db



   # Security / JWT

   JWT_SECRET=your_jwt_secret_key_change_in_production

   JWT_EXPIRES_IN=7d

   # Email notifications currently run in simulated mode.

   ```



---



### 4. Run Database Migrations



Apply the database schema, table structures, and foreign keys:



```bash

npm run migrate

```



Before running migrations, create `booking_db` using a MySQL administrator account and grant the application user the database-level permissions shown above.

The migration runner (`backend/scripts/runMigrations.js`):

- Connects to the configured MySQL database.
- Applies `database/002 medical center schema.sql` (14 relational tables, foreign key constraints, and the 5-role ENUM).
- Applies `database/migrations.sql` statement-by-statement with handling for supported duplicate-object conditions.
- Reports migration and permission errors instead of silently treating them as successful.



---



### 5. Backend Server Execution



From the project root:



```bash

*# Install backend dependencies*

npm install



*# Start in development mode (with nodemon auto-restart)*

npm run dev



*# Or start in standard production mode*

npm start

```



The backend server starts on `http://localhost:3000`:

- **API Base:** `http://localhost:3000/api/v1`

- **Health Check:** `http://localhost:3000/api/health`

- **Interactive Swagger UI:** `http://localhost:3000/api-docs`

- **OpenAPI 3.0 JSON:** `http://localhost:3000/api-docs.json`



---



### 6. Frontend Client Execution



In a separate terminal window:



```bash

*# Navigate to the frontend directory*

cd frontend



*# Install frontend dependencies*

npm install



*# Start Vite development server*

npm run dev

```



The client application will start at `http://localhost:5173`.



#### Frontend Quality & Build Commands:

```bash

*# Lint code across all JSX components (0 errors, 0 warnings)*

npm run lint



*# Compile optimized production bundle to frontend/dist/*

npm run build



*# Preview production build locally*

npm run preview

```



---



## 👥 Evaluation Test Accounts



To test role-based access control, the project supports the following local evaluation roles:



| Role | Example Account | Access Scope |
| :--- | :--- | :--- |
| **Admin** | `admin@test.com` | Full system control, user accounts, financial expenses, KPIs |
| **Doctor** | `doctor.radiology@medicare.local` | Radiology workspace, assigned visits, clinical records, prescriptions |
| **Doctor** | `doctor.dental@medicare.local` | Dental workspace, 32-tooth odontogram, clinical encounters |
| **Receptionist** | `receptionist@test.com` | Front-desk scheduling, check-in, cashier POS, itemized billing |
| **Pharmacist** | `pharmacist@medicare.local` | Pharmacy dispensary, inventory catalog, stock adjustments |
| **Patient** | `patient@test.com` | Self-service booking, personal medical records, notifications |



**Important:** Passwords are intentionally not published in this repository. Demo accounts depend on the local development database and seed data. Use credentials configured in your own local environment, or create test users through the supported registration and administration workflows. Never reuse development credentials in production.



---



## 📡 API Reference & Route Map



All API routes are mounted under `/api/v1` and return structured JSON responses:

```json

{

  "success": true,

  "data": { ... },

  "message": "Operation completed successfully"

}

```



### Route Summary



| Module | Method | Endpoint | RBAC Protection | Description |

| :--- | :---: | :--- | :---: | :--- |

| **System** | `GET` | `/api/health` | Public | Server uptime and health status |

| | `GET` | `/api-docs` | Public | Interactive Swagger UI documentation |

| **Auth** | `POST` | `/api/v1/auth/register` | Public | Patient self-registration / doctor application |

| | `POST` | `/api/v1/auth/login` | Public | Authenticates credentials and returns JWT |

| | `GET` | `/api/v1/auth/me` | Authenticated | Current user profile |

| **Users** | `GET` | `/api/v1/users` | Admin | Search and list users with pagination |

| | `PUT` | `/api/v1/users/:id/status` | Admin | Activate or deactivate a user account |

| | `PUT` | `/api/v1/users/:id/role` | Admin | Change user role permission |

| | `GET` | `/api/v1/users/pending-doctors` | Admin | Review pending doctor applications |

| | `PUT` | `/api/v1/users/pending-doctors/:id/approve` | Admin | Approve doctor credentials & activate account |

| **Appointments**| `GET` | `/api/v1/appointments` | Doctor, Receptionist, Patient, Admin | List visits (scoped by role) |

| | `POST` | `/api/v1/appointments` | Patient, Receptionist, Admin | Book appointment with slot collision check |

| | `PUT` | `/api/v1/appointments/:id/status`| Receptionist, Doctor, Admin | Update status (`confirmed`, `completed`, `cancelled`) |

| | `PUT` | `/api/v1/appointments/:id/reschedule`| Patient, Receptionist, Admin | Reschedule date and time slot |

| | `DELETE`| `/api/v1/appointments/:id` | Receptionist, Admin | Soft-delete appointment |

| **Patients** | `GET` | `/api/v1/patients` | Doctor, Receptionist, Admin | List patients with search & pagination |

| | `GET` | `/api/v1/patients/:id` | Doctor, Receptionist, Admin | Patient medical profile |

| | `POST` | `/api/v1/patients` | Receptionist, Admin | Register patient demographic record |

| | `PUT` | `/api/v1/patients/:id` | Receptionist, Admin | Update patient demographics |

| **Records** | `GET` | `/api/v1/records` | Doctor, Patient, Admin | Encounter records (scoped to user) |

| | `POST` | `/api/v1/records` | Doctor, Admin | Create medical diagnosis & treatment record |

| | `GET` | `/api/v1/records/:id` | Doctor, Patient, Admin | Detailed clinical record & specialty data |

| **Prescriptions**| `GET` | `/api/v1/prescriptions` | Doctor, Pharmacist, Patient, Admin | List digital prescriptions |

| | `POST` | `/api/v1/prescriptions` | Doctor, Admin | Prescribe medications |

| | `PUT` | `/api/v1/prescriptions/:id/status`| Pharmacist, Admin | Update status (`dispensed`, `cancelled`) |

| **Pharmacy** | `GET` | `/api/v1/pharmacy/stats` | Pharmacist, Admin | Live inventory KPIs & low-stock alerts |

| | `GET` | `/api/v1/pharmacy/transactions` | Pharmacist, Admin | Inventory stock audit history |

| | `POST` | `/api/v1/pharmacy/dispense` | Pharmacist, Admin | Dispense prescription & deduct stock |

| | `POST` | `/api/v1/pharmacy/inventory/adjust` | Pharmacist, Admin | Manual inventory correction |

| **Medications**| `GET` | `/api/v1/medications` | Authenticated | Pharmaceutical catalog & stock counts |

| | `POST` | `/api/v1/medications` | Pharmacist, Admin | Add new medication to catalog |

| **Invoices** | `GET` | `/api/v1/invoices` | Receptionist, Patient, Admin | List invoices (scoped to user) |

| | `POST` | `/api/v1/invoices` | Receptionist, Admin | Generate itemized visit invoice |

| | `POST` | `/api/v1/invoices/:id/payments` | Receptionist, Admin | Record cashier POS payment |

| **Financial** | `GET` | `/api/v1/financial/expenses`| Admin | Operational clinic expenses list |

| | `POST` | `/api/v1/financial/expenses`| Admin | Record clinic operational expense |

| | `GET` | `/api/v1/financial/summary` | Admin | Financial KPI summary (revenue, expenses, net profit) |

| **Dashboard** | `GET` | `/api/v1/dashboard/overview`| Doctor, Receptionist, Pharmacist, Admin | Overview statistics |

| | `GET` | `/api/v1/dashboard/my-summary` | Doctor | Personalized doctor-scoped metrics |

| **Notifications**| `GET`| `/api/v1/notifications`| Authenticated | User notifications & unread count |

| | `PUT` | `/api/v1/notifications/:id/read` | Authenticated | Mark notification as read |

| | `PUT` | `/api/v1/notifications/read-all`| Authenticated | Mark all notifications as read |



---



## 🧪 Automated Testing & Quality Verification



The project includes an automated integration test suite utilizing Node.js's native test runner (`node --test`), requiring zero external test framework dependencies.



```bash

*# Execute integration test suite from project root*

npm test

```



### Verified Test Results:

- **Total Tests:** **39 passing** (0 failing, 0 skipped across 5 suites).

- **Test Suites Breakdown:**

  1. `System & Health API`: Server health check, OpenAPI JSON delivery, 404 handler.

  2. `Authentication & Validation API`: Field validation, password constraints, credential verification, and token payload validation across all 5 roles.

  3. `Security & Protected Routes Authorization`: Token enforcement on core endpoints (401 Unauthorized for unauthenticated requests).

  4. `Role-Based Access Control & Security Guards`: Strict role boundary checks (403 Forbidden enforcement across Patient, Doctor, Receptionist, and Pharmacist boundaries).

  5. `Pharmacy Management & Dispensary Module`: Pharmacist authentication, stock transactions, KPI analytics, and supplier queries.



### Frontend Quality:

- **ESLint:** Clean exit (`0 errors`, `0 warnings`) across all components, hooks, and contexts.

- **Production Build:** Vite production build compiles optimized assets with zero build errors.



---



## ⚠️ Deployment Notes & Known Limitations



1. **Automated Reminder Scheduler (Single-Instance Design):**

   - The appointment reminder service runs at server startup and periodically every 6 hours via an in-process timer.

   - Deduplication is tracked via in-memory execution guards and the local JSON notification store (`backend/data/notifications_store.json`).

   - This scheduler is designed for a **single Node.js server instance**. In a horizontally scaled cluster (e.g., multi-container Kubernetes replicas or PM2 cluster mode), distributed locking (such as Redis or database row-level locking) should be introduced to prevent duplicate reminder processing.



2. **Email Delivery (Simulated Mode):**

   - Email notifications currently use **simulated mode**, logging message payloads to the console. Live SMTP delivery is not currently implemented as a verified, working integration; adding and testing a real email provider is a separate future task.


3. **Public Self-Registration Scope:**

   - In accordance with enterprise healthcare security standards, public self-registration is restricted to **Patients** and **Doctors** (subject to admin licensing verification). Staff roles (**Admin**, **Receptionist**, **Pharmacist**) must be created or assigned by an Administrator.



4. **External Messaging Integrations:**

   - The platform does not currently include direct SMS gateway or WhatsApp Business API integrations. All notifications and reminders are delivered through the in-app notification center and optional email.



---



## 📄 License



This project is licensed under the [ISC License](LICENSE).
