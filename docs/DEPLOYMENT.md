# CivicShield Deployment Guide

## Environment

- Frontend dev default: `http://localhost:3000`
- Backend dev default: `http://localhost:5000`
- Database: MongoDB Atlas
- File storage: Cloudinary
- AI provider: DeepSeek
- OTP provider: Twilio

## Backend Deployment

1. Copy `backend/.env.example` to `.env`.
2. Fill MongoDB Atlas, JWT, Twilio, DeepSeek, and Cloudinary credentials.
3. Install dependencies with `npm install`.
4. Seed demo data if needed with `npm run seed`.
5. Start the server with `npm start`.

## Frontend Deployment

1. Copy `frontend/.env.example` to `.env`.
2. Set `VITE_API_URL` to your deployed backend URL, for example `https://api.example.com/api/v1`.
3. Install dependencies with `npm install`.
4. Build with `npm run build`.
5. Deploy the `dist/` output to Vercel, Netlify, or any static hosting layer.

## Suggested Production Stack

- Frontend: Vercel or Netlify
- Backend: Render, Railway, Fly.io, or EC2
- Database: MongoDB Atlas
- Asset storage: Cloudinary
- DNS + TLS: Cloudflare

## Production Notes

- Set secure JWT secrets and `NODE_ENV=production`.
- Use an HTTPS frontend origin in `FRONTEND_URL`.
- Enable Cloudinary credentials for non-local uploads.
- Set Twilio values for real OTP delivery.
- Set DeepSeek API values to enable non-fallback AI behavior.
- Keep `CRYPTO_SECRET` stable to preserve decryption of encrypted report fields.
