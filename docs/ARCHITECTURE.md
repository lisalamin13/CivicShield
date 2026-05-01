# CivicShield Architecture

## Product Summary

CivicShield is a multi-tenant SaaS platform for secure anonymous reporting, case handling, AI-assisted compliance, and organization-wide ethics analytics. The platform serves three primary personas:

- Super Admin
- Organization Admin
- Reporter / End User

Anonymous submission is supported without authentication, while authenticated users gain history, inbox continuity, and dashboard access.

## System Architecture

```text
React + Vite SPA (Port 3002)
        |
        | HTTPS / JSON / multipart
        v
Express API (Port 5002)
        |
        |-- MongoDB Atlas
        |-- DeepSeek API
        |-- Twilio OTP
        |-- Cloudinary storage
```

## Core Design Decisions

- Multi-tenant database design with `organizationId` scoping across all organization-bound data.
- Anonymous reporting uses a public report creation flow that returns a tracking code and a one-time access key.
- Sensitive report narrative and contact fields are AES encrypted at rest.
- AI features are centralized through a DeepSeek service layer so model, token limits, and prompts can be managed from system settings.
- Super-admin-editable settings are stored in `system_settings`, not hardcoded in the database or config files.
- Role-based access is enforced with JWT access tokens and rotating refresh tokens.
- Security middleware includes Helmet, CORS allowlist, rate limiting, request sanitization, upload restrictions, audit logs, and OTP expiry controls.

## Tenant Model

- One organization can have many users, reports, compliance rules, and subscriptions.
- Super admin operates across all organizations.
- Organization admins and staff are scoped to their own tenant.
- Anonymous reporters can access only their own report thread using tracking credentials.

## Backend Folder Structure

```text
backend/
  config/
    db.js
  controllers/
    adminController.js
    aiController.js
    authController.js
    organizationController.js
    reportController.js
    settingsController.js
    userController.js
  middleware/
    auth.js
    errorHandler.js
    notFound.js
    rateLimiters.js
    upload.js
  models/
    AIUsageLog.js
    AuditLog.js
    ChatMessage.js
    ComplianceRule.js
    EvidenceFile.js
    Organization.js
    OTPVerification.js
    Report.js
    ReportStatusHistory.js
    Subscription.js
    SystemSetting.js
    User.js
  routes/
    adminRoutes.js
    aiRoutes.js
    authRoutes.js
    organizationRoutes.js
    reportRoutes.js
    settingsRoutes.js
    userRoutes.js
  seed/
    seed.js
  services/
    aiService.js
    analyticsService.js
    auditService.js
    exportService.js
    metadataService.js
    otpService.js
    storageService.js
  templates/
    prompts.js
  utils/
    apiFeatures.js
    appError.js
    crypto.js
    jwt.js
    sanitize.js
  validators/
    authValidators.js
    organizationValidators.js
    reportValidators.js
  app.js
  server.js
  .env.example
  package.json
```

## Frontend Folder Structure

```text
frontend/
  public/
  src/
    app/
      App.jsx
      providers.jsx
      router.jsx
    assets/
    components/
      charts/
      common/
      dashboard/
      forms/
    features/
      auth/
      dashboard/
      reports/
    hooks/
    layouts/
      AuthLayout.jsx
      DashboardLayout.jsx
      PublicLayout.jsx
    lib/
      api.js
      constants.js
      helpers.js
      queryClient.js
      storage.js
    pages/
      AnonymousReportPage.jsx
      EthicsAdvisorPage.jsx
      LandingPage.jsx
      LoginPage.jsx
      OrgDashboardPage.jsx
      RegisterPage.jsx
      ReportTrackingPage.jsx
      SuperAdminDashboardPage.jsx
      UserDashboardPage.jsx
    styles/
      index.css
    main.jsx
  index.html
  tailwind.config.js
  postcss.config.js
  vite.config.js
  .env.example
  package.json
```

## MongoDB Collections

### `users`

- Identity and credentials for super admins, org admins, staff, and registered reporters.
- Stores hashed password, hashed refresh tokens, profile metadata, phone verification state, and tenant scope.

### `organizations`

- Tenant profile, approval state, billing profile, branding, departments, and security preferences.

### `reports`

- Primary case record with encrypted narrative, status, category, risk score, AI summary, assignment, anonymity settings, and tracking identifiers.

### `evidence_files`

- Metadata for uploaded files, cloud storage path, scrub status, MIME type, size, and upload actor.

### `chat_messages`

- Secure inbox messages tied to a report thread for anonymous two-way communication.

### `compliance_rules`

- Editable organization rules used by admins and AI for classification, policy guidance, SLAs, and escalation hints.

### `otp_verifications`

- OTP session records for SMS login, expiry, delivery state, attempt counts, and verification status.

### `audit_logs`

- Immutable activity logs for logins, report actions, settings changes, AI operations, and admin changes.

### `ai_usage_logs`

- Token usage, prompt type, model name, latency, actor, organization, and budget tracking.

### `subscriptions`

- Plan metadata, billing cycle, limits, seat counts, AI quota, and status.

### `report_status_history`

- Timeline entries for every status change, assignment, escalation, and resolution event.

### `system_settings`

- Platform-wide settings editable by super admin, including support contacts, OTP sender settings, maintenance mode, model selection, and token budgets.

## Authentication Architecture

- Access token: short-lived JWT returned to frontend.
- Refresh token: rotating token stored as an HTTP-only cookie.
- Email/password login: available for all registered accounts.
- Phone OTP login: available for verified phone users via Twilio.
- Forgot password: reset-token flow with expiry.
- Anonymous reporting: no login required.

## Reporting Workflow

1. Reporter selects anonymous or authenticated flow.
2. System receives report, sanitizes text, encrypts sensitive fields, and stores tracking credentials.
3. AI service optionally generates category, urgency, sentiment, and summary.
4. Organization admin reviews, assigns investigator, updates lifecycle, and can reply through the secure inbox.
5. Reporter checks status using dashboard or tracking page.
6. Audit logs and history entries are recorded on each action.

## Compliance Engine

- Global starter rules ship via seed data.
- Organizations can clone, edit, add, disable, or delete their own rules.
- Rules include severity, SLA, keywords, escalation guidance, evidence requirements, and response hints.
- AI prompts pull organization rules plus system settings for grounded classification and policy chat answers.

## AI Modules

### Ethics Advisor

- Public or authenticated chatbot.
- Uses organization rules and platform guidance to answer policy questions and help structure complaints.

### Admin Intelligence

- Report summary
- Urgency detection
- Risk score
- Sentiment
- Category tagging
- Draft reply generation

### AI Analytics

- Repeat complaint trend analysis
- Department hotspot detection
- Monthly volume forecasting
- Category breakdowns

## Security Controls

- Helmet headers
- Configurable CORS allowlist
- General and auth-specific rate limiting
- Password hashing with bcrypt
- AES-256-GCM encryption for sensitive report fields
- Upload type and size restrictions
- Image and PDF metadata scrubbing
- Input sanitization
- Audit logs
- OTP expiry and retry caps
- Role-based access control
- Refresh token rotation

## Port Conventions

- Frontend default dev port: `3000`
- Backend default dev port: `5000`
- Ports remain env-configurable if you want to change them later.

## Backend Setup Notes

- Express API uses modular controllers, services, models, and validators.
- MongoDB Atlas is the primary database.
- Cloudinary is the default storage integration, with local fallback for development.
- DeepSeek is integrated through an OpenAI-compatible client wrapper.
- Twilio handles OTP delivery.

## Frontend Setup Notes

- Vite powers the React SPA.
- Tailwind CSS and DaisyUI provide the design system foundation.
- React Router handles public, auth, and role-specific dashboard routes.
- React Query handles API caching and mutations.
- Axios manages API requests with refresh-token recovery.
