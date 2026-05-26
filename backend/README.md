# FindThem Backend

Production-ready Node.js and Express backend scaffold for **FindThem**, an AI-powered missing persons tracking platform.

## What Is Included

- REST API with versioned routes under `/api/v1`
- MongoDB models for users, missing person cases, volunteer reports, AI logs, notifications, rewards, OTPs, and refresh tokens
- JWT access tokens and refresh-token rotation
- Firebase Google Sign-In support
- Twilio OTP, SMS, and WhatsApp adapters
- Cloudinary image/PDF uploads with image compression and thumbnail URLs
- AI face matching adapter with confidence scoring and emergency workflow when confidence is above 80%
- Role-based access for Admin, Family Member, Volunteer, NGO Partner, and Police Verification Team
- Nearby case search using MongoDB geospatial indexes
- Socket.io real-time notifications, volunteer location events, and AI scan progress
- Helmet, CORS, request validation, rate limiting, sanitization, and secure upload limits
- Swagger docs at `/api-docs`
- Docker and docker-compose setup
- Postman collection at `docs/postman_collection.json`

## Project Structure

```text
src/
  config/          Database, Redis, Firebase, Cloudinary, Socket.io
  constants/       Shared role constants
  controllers/     Request handlers
  docs/            Swagger setup
  middleware/      Auth, authorization, validation, upload, security
  models/          Mongoose schemas and indexes
  routes/          Versioned REST route modules
  scripts/         Operational scripts
  services/        Vendor integrations and business workflows
  utils/           Error, JWT, crypto, logger, pagination helpers
tests/             API tests
docs/              Postman collection
```

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

With Docker:

```bash
docker compose up --build
```

Health check:

```bash
curl http://localhost:5000/health
```

## Core API

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/otp/verify`
- `POST /api/v1/auth/otp/resend`
- `POST /api/v1/auth/google`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/refresh-token`
- `GET /api/v1/cases`
- `GET /api/v1/cases/nearby`
- `POST /api/v1/cases`
- `POST /api/v1/reports`
- `POST /api/v1/ai/face/compare`
- `GET /api/v1/notifications`
- `GET /api/v1/admin/analytics`

## Environment Notes

Use strong secrets for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `ENCRYPTION_KEY` in production. Configure Firebase service account values, Cloudinary keys, Twilio Verify and messaging values, SMTP, Google Maps, and the AI face matching provider URL before enabling production traffic.

## Production Checklist

- Run behind HTTPS and a trusted reverse proxy
- Use MongoDB Atlas or a replicated MongoDB cluster
- Enable Redis for rate-limit, cache, queue, and session-related workloads
- Move AI matching to a queue worker for large uploads or bulk scanning
- Add object-level authorization rules for case ownership and police workflows
- Add persistent audit logs for verification, reward, and moderation actions
- Wire push notifications through FCM/APNs using the existing notification service boundary
- Configure CI to run `npm test`, linting, dependency audit, and Docker build

