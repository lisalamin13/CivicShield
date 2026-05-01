# CivicShield API Reference

## Base URL

`/api/v1`

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `POST /auth/forgot-password`
- `POST /auth/reset-password/:token`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

## Organizations

- `POST /organizations/onboard`
- `GET /organizations`
- `GET /organizations/:organizationId`
- `PATCH /organizations/:organizationId`
- `PATCH /organizations/:organizationId/status`
- `POST /organizations/:organizationId/departments`

## Reports

- `POST /reports`
- `GET /reports`
- `GET /reports/:reportId`
- `POST /reports/track`
- `PATCH /reports/:reportId/status`
- `PATCH /reports/:reportId/assign`
- `POST /reports/:reportId/messages`
- `GET /reports/:reportId/messages`
- `POST /reports/:reportId/evidence`
- `GET /reports/analytics/overview`
- `GET /reports/export/csv`
- `GET /reports/export/pdf`

## AI

- `POST /ai/chat`
- `POST /ai/reports/:reportId/intelligence`
- `POST /ai/reports/:reportId/draft-reply`
- `GET /ai/usage`

## Admin

- `GET /admin/platform-overview`
- `GET /admin/abuse-reports`
- `GET /admin/audit-logs`
- `GET /admin/subscriptions`
- `PATCH /admin/subscriptions/:subscriptionId`
- `GET /admin/token-usage`

## Settings

- `GET /settings/system`
- `PATCH /settings/system`

## Users

- `GET /users`
- `POST /users`
- `PATCH /users/:userId`
- `PATCH /users/:userId/status`

## Compliance

- `GET /reports/compliance/rules`
- `POST /reports/compliance/rules`
- `PATCH /reports/compliance/rules/:ruleId`
- `DELETE /reports/compliance/rules/:ruleId`

