# CivicShield MongoDB Schema

## `users`

- `name`
- `email`
- `phone`
- `password`
- `role`
- `organizationId`
- `department`
- `avatarUrl`
- `isActive`
- `isPhoneVerified`
- `refreshTokens[]`
- `resetPasswordTokenHash`
- `resetPasswordExpiresAt`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

## `organizations`

- `name`
- `slug`
- `type`
- `industry`
- `sizeBand`
- `status`
- `contactEmail`
- `contactPhone`
- `adminUserId`
- `branding`
- `departments[]`
- `complianceSettings`
- `subscriptionId`
- `approvedAt`
- `approvedBy`
- `notes`
- `createdAt`
- `updatedAt`

## `reports`

- `organizationId`
- `reporterUserId`
- `trackingCode`
- `accessKeyHash`
- `anonymous`
- `subject`
- `category`
- `department`
- `incidentDate`
- `location`
- `narrativeEncrypted`
- `reporterEmailEncrypted`
- `reporterPhoneEncrypted`
- `status`
- `priority`
- `assignedTo`
- `assignedDepartment`
- `resolutionSummary`
- `aiSummary`
- `aiSentiment`
- `aiUrgency`
- `aiRiskScore`
- `aiTags[]`
- `evidenceCount`
- `replyCount`
- `abuseFlagsCount`
- `lastActivityAt`
- `metadata`
- `createdAt`
- `updatedAt`

## `evidence_files`

- `organizationId`
- `reportId`
- `uploadedByUserId`
- `uploadedByAnonymous`
- `originalName`
- `mimeType`
- `size`
- `storageProvider`
- `storagePath`
- `url`
- `scrubbed`
- `scrubNotes`
- `createdAt`
- `updatedAt`

## `chat_messages`

- `organizationId`
- `reportId`
- `senderType`
- `senderUserId`
- `bodyEncrypted`
- `visibleToReporter`
- `readAt`
- `createdAt`
- `updatedAt`

## `compliance_rules`

- `organizationId`
- `code`
- `title`
- `category`
- `description`
- `severity`
- `keywords[]`
- `responseGuidance`
- `escalationGuidance`
- `evidenceHints[]`
- `slaHours`
- `isSystem`
- `isActive`
- `createdAt`
- `updatedAt`

## `otp_verifications`

- `phone`
- `purpose`
- `otpHash`
- `userId`
- `organizationId`
- `attempts`
- `maxAttempts`
- `expiresAt`
- `verifiedAt`
- `channel`
- `createdAt`
- `updatedAt`

## `audit_logs`

- `actorUserId`
- `actorRole`
- `organizationId`
- `module`
- `action`
- `targetType`
- `targetId`
- `ipHash`
- `userAgentHash`
- `metadata`
- `createdAt`
- `updatedAt`

## `ai_usage_logs`

- `organizationId`
- `userId`
- `feature`
- `modelName`
- `tokenIn`
- `tokenOut`
- `totalTokens`
- `latencyMs`
- `status`
- `costEstimate`
- `createdAt`
- `updatedAt`

## `subscriptions`

- `organizationId`
- `planName`
- `status`
- `billingCycle`
- `price`
- `seatLimit`
- `aiTokenLimit`
- `aiTokensUsed`
- `renewalDate`
- `createdAt`
- `updatedAt`

## `report_status_history`

- `organizationId`
- `reportId`
- `previousStatus`
- `newStatus`
- `changedByUserId`
- `note`
- `createdAt`
- `updatedAt`

## `system_settings`

- `key`
- `supportPhone`
- `twilioSenderNumber`
- `contactEmail`
- `maintenanceMode`
- `maintenanceMessage`
- `brandingLogoUrl`
- `deepseekModelName`
- `aiMonthlyTokenLimit`
- `otpExpiryMinutes`
- `otpMaxAttempts`
- `updatedBy`
- `createdAt`
- `updatedAt`
