# D Festival × 幻樂空間 — Booking Platform

A production-minded booking web application for D Festival × 幻樂空間, built with Next.js App Router, PostgreSQL, Prisma, Argon2 password hashing, and JWT sessions stored in httpOnly cookies.

[Live site](https://fms-booking.vercel.app)

## Portfolio snapshot

This project demonstrates:

- a public event and booking flow;
- authenticated user sessions and password-change enforcement;
- availability checks with Hong Kong business rules;
- booking history and bonus-reward handling;
- a separate admin surface for booking review and calendar operations.

## Local development

1. Start the database from the parent directory:

   ```bash
   docker compose up -d
   ```

2. Copy environment variables and install dependencies:

   ```bash
   cp .env.example .env
   npm install
   ```

3. Apply migrations and seed a local development database:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Common commands

| Command | Purpose |
|---|---|
| `npm run db:studio` | Open Prisma Studio |
| `npm run build` | Create a production build |
| `npm run db:seed` | Seed local development data |

## API surface

- `GET /api/v1/public/settings` — public event settings
- `POST /api/v1/registration` — user registration
- `POST /api/v1/auth/login`, `logout`, `change-password`
- `GET /api/v1/me` — current user and booking-gate state
- `GET /api/v1/booking/availability?from=yyyy-MM-dd&to=yyyy-MM-dd`
- `POST /api/v1/booking/request`
- `GET /api/v1/booking/history`

The server enforces the event window, advance-booking limits, personal and teaching quotas, rolling three-day limits, capacity, overlap checks, password-change requirements, and the booking-open timestamp.

## Admin surface

- `POST /api/v1/admin/auth/login` — admin login
- `/admin/bookings` — approve, waitlist, or reject bookings
- `/admin/calendar?from=&to=` — calendar preview

All business dates are displayed in `Asia/Hong_Kong`; timestamps are stored in UTC.

## Security notes

- Keep all local secrets in `.env`; never commit real credentials.
- The seed command is for local development only. Configure a unique local admin password through `SEED_ADMIN_PASSWORD`.
- Before deploying, verify that seed accounts, staging credentials, and admin routes are disabled or protected in the target environment.

## Status

The repository is a portfolio and development reference. The admin UI is not fully wired for every operation yet; use the documented API and Prisma Studio paths for local inspection.
