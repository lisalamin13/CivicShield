# CivicShield Security Checklist

- Helmet enabled with safe cross-origin asset rules.
- CORS restricted to configured frontend origin.
- Access tokens kept short-lived.
- Refresh tokens rotated and stored in HTTP-only cookies.
- Passwords hashed with bcrypt.
- Sensitive report fields encrypted at rest.
- Login and OTP routes rate limited.
- OTP verification records expire automatically.
- Upload MIME types and sizes restricted.
- Image and PDF metadata scrubbed before persistence.
- Input sanitized before database writes.
- Audit logs written for privileged and report lifecycle actions.
- Maintenance mode enforced from editable system settings.
- AI usage logged for cost and abuse monitoring.
- Organization scoping enforced on protected queries.
- Anonymous inbox protected by tracking code and access key checks.
