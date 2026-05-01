# CivicShield

CivicShield is a production-oriented AI-powered secure anonymous reporting and compliance SaaS platform for colleges, companies, institutions, and enterprises.

The current implementation delivers:

- Multi-role dashboards for `super_admin`, `org_admin` / investigators / staff, and `reporter`
- Anonymous public reporting with tracking code + access key
- Secure anonymous inbox messaging
- DeepSeek-backed ethics advisor and admin intelligence hooks with graceful fallback logic
- Twilio OTP login flow
- Editable compliance rule engine
- System settings editable from the super admin dashboard
- MongoDB-based audit, analytics, subscriptions, and status history

## Architecture

- Frontend: React + Vite + Tailwind CSS + DaisyUI + React Query + React Router
- Backend: Node.js + Express + Mongoose
- Database: MongoDB Atlas
- AI: DeepSeek via OpenAI-compatible client
- OTP: Twilio
- Storage: Cloudinary with local fallback

Main documents:

- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API_REFERENCE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Security Checklist](docs/SECURITY_CHECKLIST.md)

## Folder Structure

```text
CivicShield_App/
  backend/
  docs/
  frontend/
  postman/
  CivicShield_Postman_Collection.json
```

Detailed folder-level architecture is documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Dashboards

### Super Admin

- Platform analytics
- Organization monitoring
- Subscription overview
- AI token usage
- System settings management
- Audit log visibility

### Organization Admin

- Report lifecycle management
- Compliance rule editing
- Staff user management
- Export flows
- Analytics and trend view

### Reporter

- Register and login
- View authenticated report history
- Submit new reports
- Use AI ethics advisor
- Track anonymous submissions

## Authentication Flow

- Email + password login with refresh-token rotation
- Phone login with Twilio OTP
- Remember-me support
- Forgot-password token generation
- Secure logout
- Anonymous reporting without login

## Default Dev Ports

- Frontend: `3000`
- Backend: `5000`

## Quick Start

### 1. Install everything

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Add environment files

- Create `backend/.env` from `backend/.env.example`
- Create `frontend/.env` from `frontend/.env.example`

### 3. Seed demo data

```bash
npm run seed
```

### 4. Start development

```bash
npm run dev
```

## Seed Credentials

- Super admin: `superadmin@civicshield.com` / `CivicShield@2026`
- Org admin: `admin@nvc.edu` / `CivicShield@2026`
- Reporter: `reporter@nvc.edu` / `CivicShield@2026`
- Demo tracking: `CS-DEMO2026` / `DEMO2026`

## Backend API Surface

Key routes include:

- `/api/v1/auth/*`
- `/api/v1/organizations/*`
- `/api/v1/reports/*`
- `/api/v1/ai/*`
- `/api/v1/admin/*`
- `/api/v1/settings/*`
- `/api/v1/users/*`

See the full route map in [docs/API_REFERENCE.md](docs/API_REFERENCE.md).

## Security Controls

- AES-style encrypted storage for sensitive report text fields
- Helmet, CORS, HPP, and request sanitization
- Auth and OTP rate limiting
- Password hashing
- Refresh-token rotation
- Audit logging
- Upload restrictions
- Image and PDF metadata scrubbing
- Tenant scoping for protected data

Expanded checklist: [docs/SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md)

## Notes

- DeepSeek integrations include fallback behavior so the platform still demos cleanly without live AI credentials.
- Cloudinary is optional in development; local upload storage is used when cloud credentials are absent.
- Twilio OTP returns a preview code in non-configured development mode for testing convenience.
