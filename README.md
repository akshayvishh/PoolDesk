# PoolDesk 🏊
### Swimming Pool Pass & Management System

PoolDesk is a desktop-friendly, owner-operated swimming pool management application designed to simplify swimmer registration, hourly pass management, pool occupancy tracking, checkout, billing, and revenue reporting.

The system provides a centralized interface for managing daily swimming pool operations, reducing manual record-keeping and helping pool owners monitor active swimmers and expiring passes efficiently.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Problem Statement](#-problem-statement)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [Pass Plans and Pricing](#-pass-plans-and-pricing)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Database Design](#-database-design)
- [Installation and Setup](#-installation-and-setup)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [Application Routes](#-application-routes)
- [API Overview](#-api-overview)
- [Security](#-security)
- [Testing](#-testing)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📖 Project Overview

Swimming pool operators often rely on registers, spreadsheets, or manual calculations to manage swimmer entry, pass validity, payments, and pool capacity.

PoolDesk aims to replace these disconnected processes with a centralized digital system.

The application is intended for use by the pool owner or authorized operator. It allows the operator to register swimmers, assign passes, monitor remaining pass time, process checkout, generate printable receipts, and review operational and financial reports.

The planned architecture uses React for the frontend, FastAPI for the backend, and MongoDB Atlas for persistent cloud database storage.

## ❗ Problem Statement

Manual swimming pool management can lead to:

- Difficulty tracking active swimmers and available pool capacity.
- Errors in calculating pass expiry times and charges.
- Delays in identifying swimmers whose passes are about to expire.
- Inconsistent records of cash and online payments.
- Time-consuming searches for previous registrations.
- Limited visibility into daily revenue, pool utilization, and completed checkouts.

PoolDesk addresses these challenges through a centralized interface and automated business rules.

## 🎯 Objectives

1. Digitize swimmer registration and pass management.
2. Automate pass pricing and expiry-time calculation.
3. Display active swimmers and passes nearing expiry.
4. Track pool occupancy and checkout status.
5. Maintain searchable registration and billing records.
6. Record payment methods and support printable receipts.
7. Provide daily revenue and pool usage reports.
8. Store application data persistently using MongoDB Atlas.

---

## ✨ Key Features

### 1. Owner Authentication

- Owner login interface.
- Protected application pages.
- No public owner registration page.
- Secure password handling and authenticated API access in the backend.

The initial owner account is intended to be created through a controlled setup or seed process.

### 2. Dashboard

The dashboard is designed to provide a quick overview of pool operations, including:

- Total active swimmers.
- Current pool occupancy.
- Available capacity.
- Passes expiring soon.
- Daily revenue.
- Recent registrations and operational activity.

Displayed figures should be calculated from the actual stored records once backend integration is complete.

### 3. New Swimmer Registration

The operator can register a swimmer by entering relevant details such as:

- Swimmer's name.
- Contact number.
- Selected pool.
- Pass type.
- Entry time.
- Payment method.

The system is designed to generate a unique Pass ID and calculate the amount and expiry time according to the selected pass.

### 4. Active Swimmers

- View swimmers currently checked in.
- View pass details and expiry times.
- Monitor remaining pass duration.
- Identify the pool assigned to each swimmer.
- Access available pass-management and checkout actions.

### 5. Expiring Soon

The system identifies checked-in swimmers whose passes have **10 minutes or less remaining**, excluding passes that have already expired.

The list should refresh periodically so operators can respond promptly.

### 6. Pass Management

Authorized operators can manage existing passes through supported actions such as:

- Extending pass validity.
- Upgrading a pass where permitted.
- Reviewing pass details.
- Confirming checkout.
- Cancelling a record with an appropriate reason.

Changes affecting price or payment should be recorded consistently.

### 7. Checkout and Occupancy Management

Pass expiry and checkout are separate events.

- **Expired:** The pass validity period has ended.
- **Checked out:** The swimmer has left the pool and their occupancy is released.
- **Awaiting checkout:** The pass has expired, but checkout has not been recorded.

An expired pass must not automatically free pool capacity if the swimmer has not been checked out.

### 8. Manage Records

Search and filter registrations using details such as:

- Swimmer name.
- Phone number.
- Pass ID.
- Active status.
- Expired or awaiting-checkout status.
- Completed checkout.
- Cancelled status.

Paid billing records should be retained for auditability rather than permanently deleted during routine cancellation.

### 9. Billing and Receipts

- Display pass charges in Indian rupees (INR).
- Record cash or online payment methods.
- Generate printable pass receipts.
- Maintain transaction records associated with registrations.
- Preserve billing consistency when passes are extended, upgraded, cancelled, or refunded.

### 10. Reports

The reporting module is designed to provide:

- Daily revenue.
- Cash versus online collections.
- Hourly versus full-day pass sales.
- Pool utilization.
- Registration and checkout summaries.
- Cancellation and refund summaries where applicable.

Reports must use actual persisted data rather than placeholder figures.

---

## 💳 Pass Plans and Pricing

| Pass Type | Price | Validity |
|---|---:|---|
| Hourly Pass | ₹150 | 1 hour from entry |
| Full-Day Pass | ₹300 | Until the pool's configured closing time on that operating day |

**Important:** A full-day pass is not a rolling 24-hour pass. Its expiry depends on the pool's operating schedule.

Prices and validity rules should be enforced by the backend rather than trusted from frontend input.

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React | User interface |
| Build Tool | Vite | Frontend development and build |
| Routing | React Router | Navigation between application pages |
| Styling | CSS | Layout, responsive styling, and visual design |
| Backend | Python | Application logic |
| API Framework | FastAPI | REST API and request validation |
| Database Driver | PyMongo | MongoDB communication |
| Database | MongoDB Atlas | Cloud data storage |
| Data Validation | Pydantic | Request and response validation |
| Configuration | python-dotenv | Local environment configuration |
| API Server | Uvicorn | Running the FastAPI application |
| Authentication | JWT or secure session-based authentication | Protecting authorized operations |
| Testing | pytest and FastAPI TestClient | Backend testing |

The final dependencies and authentication implementation should be confirmed against the actual project files.

---

## 🏗️ System Architecture

PoolDesk follows a frontend–backend–database architecture.

```text
┌─────────────────────────────┐
│       React Frontend        │
│                             │
│ Dashboard | Registration    │
│ Active Swimmers | Reports   │
└──────────────┬──────────────┘
               │
               │ HTTP / JSON
               ▼
┌─────────────────────────────┐
│       FastAPI Backend       │
│                             │
│ Authentication              │
│ Pass and Pricing Rules       │
│ Occupancy and Checkout       │
│ Billing and Reports          │
└──────────────┬──────────────┘
               │
               │ PyMongo
               ▼
┌─────────────────────────────┐
│       MongoDB Atlas         │
│                             │
│ Owners | Pools               │
│ Registrations | Transactions│
└─────────────────────────────┘
```

### Data Flow

1. The operator performs an action in the React interface.
2. The frontend sends an HTTP request to the FastAPI backend.
3. The backend authenticates and validates the request.
4. Business rules are applied on the server.
5. PyMongo reads or updates the appropriate MongoDB collections.
6. The backend returns a response to the frontend.
7. The interface displays the updated information.

The frontend must not connect directly to MongoDB or contain database credentials.

---

## 📁 Project Structure

The intended structure is shown below. The exact filenames may differ depending on the implementation.

```text
PoolDesk/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── assets/
│   ├── App.jsx
│   └── main.jsx
│
├── public/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── config.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routes/
│   │   ├── services/
│   │   └── security.py
│   ├── tests/
│   ├── .env
│   ├── .env.example
│   └── requirements.txt
│
├── .gitignore
├── package.json
├── PROJECT_STATUS.md
├── NEXT_SESSION_PROMPT.md
└── README.md
```

Only include files and directories that are actually created in the repository; treat this structure as a reference for the intended architecture.

---

## 🗄️ Database Design

MongoDB Atlas is intended to provide persistent storage for PoolDesk.

### Collections

| Collection | Purpose |
|---|---|
| `owners` | Owner credentials, account status, and authentication-related data |
| `pools` | Pool names, capacity, operating hours, and configuration |
| `registrations` | Swimmer details, Pass IDs, pass validity, and checkout status |
| `transactions` | Payments, adjustments, cancellations, and refunds where applicable |

### Important Data Rules

- Each registration should have a unique Pass ID.
- Money must use a consistent precision-safe representation.
- Dates should be stored consistently, preferably in UTC, and displayed using the `Asia/Kolkata` timezone.
- Pool occupancy should be derived from checkout status and applicable business rules.
- Payment and registration updates should remain consistent.
- Indexes should support common searches and enforce uniqueness where required.
- Database credentials must never be stored in source code.

MongoDB transactions should be used when supported by the selected Atlas deployment and needed for atomic multi-document operations. Otherwise, the implementation should provide an appropriate consistency strategy.

---

## ⚙️ Installation and Setup

### Prerequisites

Install or prepare the following:

- Node.js and npm.
- Python 3.10 or a compatible version selected by the project.
- MongoDB Atlas account and a running cluster.
- A MongoDB database user.
- Atlas Network Access configured for the development environment.
- Git.
- A code editor such as Visual Studio Code or Antigravity.

### 1. Clone the Repository

```bash
git clone https://github.com/akshayvishh/PoolDesk.git
cd PoolDesk
```

If the project is already available locally, open the existing repository folder instead of cloning it again.

### 2. Install Frontend Dependencies

From the project root:

```bash
npm install
```

### 3. Prepare the Python Backend

From the project root, enter the backend directory:

```bash
cd backend
```

Create and activate a virtual environment.

**Windows:**

```bash
python -m venv .venv
.venv\Scripts\activate
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

The backend directory and requirements file should be created by the implementation if they do not already exist.

---

## 🔐 Environment Configuration

Create a local `backend/.env` file containing your configuration.

Example:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-address>/
MONGODB_DB=pooldesk
JWT_SECRET=replace_with_a_secure_random_secret
```

Use the actual Atlas URI provided for your cluster. If the URI already contains credentials, retain the correct complete URI.

Configure the frontend API base URL in the root `.env` file if required:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

### Security Requirements

- Never commit `.env` files to Git.
- Commit only sanitized example configuration such as `.env.example`.
- Never put MongoDB credentials or backend authentication secrets in `VITE_` variables.
- Use a strong, unique authentication secret.
- Restrict Atlas Network Access to appropriate IP addresses instead of allowing unrestricted access unnecessarily.
- Use a least-privilege MongoDB database user.
- Keep actual credentials out of logs, screenshots, and source-control history.

---

## ▶️ Running the Application

Run the frontend and backend in separate terminals.

### Terminal 1: Start the Backend

From the `backend` directory, activate the virtual environment and run the FastAPI application using the actual module path created by the project.

For example, if the entry point is `app/main.py`:

```bash
uvicorn app.main:app --reload
```

The development server should be available at:

```text
http://127.0.0.1:8000
```

FastAPI's interactive API documentation is typically available at:

```text
http://127.0.0.1:8000/docs
```

### Terminal 2: Start the Frontend

From the project root:

```bash
npm run dev
```

Open the local URL displayed by Vite in the terminal.

**Note:** These commands assume the corresponding entry point, scripts, and dependencies exist. Confirm them in the repository before running.

---

## 🧭 Application Routes

The planned frontend routes are:

| Route | Page |
|---|---|
| `/login` | Owner Login |
| `/dashboard` | Dashboard |
| `/registration` | New Swimmer Registration |
| `/active-swimmers` | All Active Swimmers |
| `/expiring-soon` | Expiring Soon |
| `/records` | Manage Records |
| `/reports` | Reports |

The registration page is for registering swimmers, not creating owner accounts. Protected pages should require owner authentication.

---

## 🔌 API Overview

The backend is intended to expose versioned REST endpoints under `/api/v1`.

| Method | Example Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate the owner |
| `POST` | `/api/v1/auth/logout` | End the authenticated session |
| `GET` | `/api/v1/auth/me` | Retrieve the current owner identity |
| `GET` | `/api/v1/dashboard/summary` | Retrieve dashboard metrics |
| `GET` | `/api/v1/pools` | Retrieve pool information |
| `POST` | `/api/v1/pools` | Create a pool, if supported by permissions |
| `POST` | `/api/v1/registrations` | Register a swimmer |
| `GET` | `/api/v1/registrations` | Search and filter registrations |
| `GET` | `/api/v1/registrations/active` | Retrieve active swimmers |
| `GET` | `/api/v1/registrations/expiring-soon` | Retrieve passes nearing expiry |
| `POST` | `/api/v1/registrations/{pass_id}/checkout` | Check out a swimmer |
| `POST` | `/api/v1/registrations/{pass_id}/extend` | Extend a pass |
| `POST` | `/api/v1/registrations/{pass_id}/cancel` | Cancel a registration |
| `GET` | `/api/v1/reports` | Retrieve reporting data |
| `GET` | `/health` | Check application health |

These routes describe the intended API surface, not a guarantee that every endpoint is already implemented. Confirm the actual API documentation before integrating additional clients.

---

## 🔒 Security

Security measures should include:

- Password hashing rather than plaintext password storage.
- Authentication and authorization for protected endpoints.
- Server-side validation of input.
- Server-side pricing and expiry calculations.
- Secure handling of authentication tokens or sessions.
- Protection against unauthorized access to records.
- Safe error responses without leaking secrets.
- Environment-based configuration.
- Auditable billing changes and soft cancellation.
- Appropriate CORS settings for the frontend origin.

The initial owner should be provisioned through a controlled setup process. Public owner signup is outside the intended application workflow.

---

## 🧪 Testing

The application should be tested at both the backend and frontend levels.

### Backend Tests

- MongoDB Atlas connectivity.
- Owner login and invalid credentials.
- Swimmer registration and unique Pass IDs.
- Hourly and full-day expiry calculations.
- Pool capacity enforcement.
- Expiring-soon filtering.
- Checkout and occupancy updates.
- Pass extension and upgrade rules.
- Payment record consistency.
- Search, filters, and reports.
- Unauthorized access to protected endpoints.

### Manual End-to-End Checks

1. Log in using the provisioned owner account.
2. Register a test swimmer.
3. Confirm that the pass appears in the active swimmers list.
4. Refresh the page and verify that the record remains available.
5. Test expiry and checkout behavior.
6. Verify payment details and the printable receipt.
7.
