# GatePass System

A digital employee and visitor sign-in/sign-out platform: QR-driven kiosk forms,
a live security dashboard, and an admin oversight dashboard. Built with
Node.js + Express + PostgreSQL on the backend and React + Vite + Tailwind on
the frontend.

## What's included

- **Home page** (`/`) — landing page with the hero and the two sign-in pathway cards.
- **Employee sign-in** (`/employee-signin`) — enter an employee ID, auto-fill profile, declare
  assets (vehicle/laptop, personal/company), sign in; scanning again signs out.
- **Visitor sign-in** (`/visitor-signin`) — name, contact, host, purpose, assets; automatically
  **emails the host** the moment the visitor signs in.
- **Security dashboard** (`/security`, requires login) — live occupancy stats, recent activity,
  currently-in-building list with one-click sign-out, employee directory, visitor history,
  full activity log, and settings.
- **Admin dashboard** (`/admin`, requires admin login) — everything security sees, plus:
  employee master-list management, user account management (create/disable security & admin
  logins), **security-officer accountability** (who processed which check-in/check-out and when),
  a full audit log with officer attribution, and date-range reports (visitor counts, average
  dwell time, asset-mismatch counts).

## Project structure

```
gatepass-system/
  backend/     Node.js + Express API, PostgreSQL schema, seed script
  frontend/    React + Vite + Tailwind app
```

## 1. Set up PostgreSQL

Create a database and a user (adjust names/passwords as you like):

```sql
CREATE DATABASE gatepass;
CREATE USER gatepass_user WITH PASSWORD 'gatepass_pass';
GRANT ALL PRIVILEGES ON DATABASE gatepass TO gatepass_user;
```

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DATABASE_URL to match your Postgres credentials,
# set JWT_SECRET to a long random string,
# and (optionally) set SMTP_HOST/SMTP_USER/SMTP_PASS for real emails —
# leave them blank to have emails logged to the console instead of sent.

npm run migrate   # creates all tables
npm run seed       # creates a demo admin, a demo security account, and 5 demo employees
npm run dev         # starts the API on http://localhost:4000
```

Seeded logins (printed again at the end of `npm run seed`):

| Role     | Email                    | Password       |
|----------|---------------------------|----------------|
| Admin    | admin@gatepass.local       | Admin@123      |
| Security | security@gatepass.local    | Security@123   |

Demo employee IDs: `EMP001` – `EMP005`.

**Change these passwords** (or create fresh accounts and disable the seeded ones from
the admin "User accounts" page) before using this anywhere beyond testing.

## 3. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev   # starts on http://localhost:5173
```

Open `http://localhost:5173`. The dev server proxies `/api/*` to `http://localhost:4000`, so
both servers need to be running.

## 4. Generating the two gate QR codes

The employee and visitor sign-in pages are just URLs:

- Employee: `https://your-domain.com/employee-signin`
- Visitor: `https://your-domain.com/visitor-signin`

Any QR generator (or a small script using the `qrcode` npm package) can turn those two URLs
into printable codes for the gate.

## 5. Email notifications

`backend/src/utils/mailer.js` uses Nodemailer. If `SMTP_HOST`/`SMTP_USER` are not set in `.env`,
it logs the email content to the backend console instead of sending it — so the visitor flow
works out of the box for local testing. To send real emails, fill in your SMTP provider's
details (e.g. Gmail SMTP, SendGrid, Mailgun, or a local provider such as Africa's Talking's
SMTP relay) in `.env`.

## 6. Known limitations / next steps

- Self-service kiosk sign-ins and sign-outs aren't attributed to a specific security officer
  (only checkouts processed from the security dashboard are). If you want every event attributed,
  require a security login step at the kiosk, or add a "processed by" selector to the kiosk flow.
- No biometric/photo capture, blacklist flag, or barrier-hardware integration yet — noted as
  future enhancements in the project proposal.
- Passwords are stored with bcrypt; sessions use a JWT in an httpOnly cookie. For production,
  serve everything over HTTPS and set `NODE_ENV=production` so the cookie is marked secure.
