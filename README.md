# Booking Management Portal

Two-dashboard booking portal for H2 House Of Health.

## Dashboards

- User dashboard: view doctor profiles, book doctor appointments, manage own bookings
- Doctor dashboard: view own patient bookings (only after admin approval)
- Admin dashboard: see all user bookings, review doctor profiles, and approve/reject doctors

## Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js + Express
- Database: SQLite (`better-sqlite3`)
- Auth: JWT (httpOnly cookie)

## Run locally

```bash
npm install
npm run start
```

Open `http://localhost:3000`

## Deploy on Render

- A Render Blueprint file is included at [render.yaml](/Users/sowmya/h2houseofhealth.github.io/render.yaml).
- The deployment uses a persistent disk for:
  - SQLite database data
  - uploaded files
- Required secrets to fill in on Render:
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `SENDGRID_API_KEY`
  - `SENDGRID_FROM_EMAIL`
- Optional mail / SES vars can also be filled if you use those flows.
- One-click deploy URL for this repo:
  - `https://render.com/deploy?repo=https://github.com/h2houseofhealth/h2houseofhealth.github.io`

## Demo admin login

- Email: `admin@h2health.local`
- Password: `Admin@12345`

## Key APIs

- `POST /api/auth/register/start` (name + email, send signup OTP)
- `POST /api/auth/register/verify` (verify signup OTP)
- `POST /api/auth/register/complete` (set password and create account)
- `POST /api/auth/login`
- `POST /api/auth/password/forgot` (send password reset OTP)
- `POST /api/auth/password/verify` (verify password reset OTP)
- `POST /api/auth/password/reset` (set new password)
- `GET /api/membership/plans` (membership status + plans)
- `POST /api/membership/subscribe` (activate membership plan)
- `GET /api/auth/me`
- `GET /api/profile`
- `PUT /api/profile`
- `POST /api/profile/avatar`
- `GET /api/doctor/profile` (doctor)
- `PUT /api/doctor/profile` (doctor, submits profile for admin approval)
- `GET /api/doctors`
- `GET /api/admin/doctors` (admin)
- `PATCH /api/admin/doctors/:id/approval` (admin)
- `POST /api/admin/doctors` (admin)
- `PUT /api/admin/doctors/:id` (admin)
- `DELETE /api/admin/doctors/:id` (admin)
- `POST /api/admin/ses/verify-recipient` (admin)
- `GET /api/admin/ses/identity-status?email=...` (admin)
- `GET /api/bookings`
- `GET /api/doctor/bookings` (doctor)
- `POST /api/bookings`
- `GET /api/payments/config`
- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `POST /api/bookings/:id/pay` (deprecated)
- `PUT /api/bookings/:id`
- `PATCH /api/bookings/:id/status`
- `DELETE /api/bookings/:id`

## Notes

- SQLite data is in `data/booking.db`.
- Set a strong `JWT_SECRET` in production.
- Demo doctors are seeded only when `SEED_DEMO_DOCTORS=true`.
- For OTP email delivery via SendGrid, configure:
`SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
- SMTP config is only used by SES verification-check email flow:
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- For SES sandbox recipient verification via API, configure:
`SES_API_REGION`, `SES_API_ACCESS_KEY_ID`, `SES_API_SECRET_ACCESS_KEY` (or AWS equivalents)
- SMTP credentials cannot be used for SES identity API calls.
- OTP delivery requires valid SendGrid configuration in all environments.
- For Razorpay payments configure:
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- Keep Razorpay in test mode:
`RAZORPAY_MODE=test` and use `rzp_test_*` keys.
- Hydrogen Session pricing is membership-aware:
  active members get `memberPriceInr`; others get `nonMemberPriceInr`.
- IV Therapies and IV Shots use the same price for members and non-members.
- Membership Services (Lab Tests, Oxidative Stress Marker Test, Radiology Services) are available only to active members.

## Payment Flow

1. User creates booking (status: `pending`, payment: `unpaid`)
2. User clicks `Pay Now` and Razorpay Checkout opens
3. On successful payment, frontend sends payment signature to backend for verification
4. Booking becomes `booked` and payment becomes `paid`
5. Admin can then mark booking as `confirmed`

## Booking Safeguards

- Double-booking prevention:
  same service + date + slot cannot be booked if another active booking exists (`pending`, `booked`, `confirmed`).
- Slot duration:
  1 hour per slot (first slot `9:30 AM - 10:30 AM`, last slot `7:30 PM - 8:30 PM`).
- Add-on rule:
  only one IV add-on (IV Therapy or IV Shot) is allowed per user in the same slot; additional add-ons are handled by admin after consultation.
- Only approved doctors are visible in user booking flow.
- User edit policy:
  users cannot edit bookings once they are `confirmed` or `completed`.
- Basic auth rate limiting:
  `/api/auth/*` endpoints are rate-limited to reduce brute-force attempts.

## Doctor Onboarding Flow

1. Doctor selects `Doctor` during signup (basic account only).
2. After login, doctor opens Profile and fills professional details.
3. Saving doctor profile submits it with `pending` approval.
4. Admin reviews doctor profile and approves/rejects it.
5. Only `approved` doctors are available for user booking.
6. Approved doctors can access patient booking details in doctor dashboard.

## Amazon SES Setup

1. Verify your sender domain or sender email in SES.
2. Add SPF/DKIM DNS records from SES to improve deliverability.
3. Request SES production access (move out of sandbox).
4. Create SES SMTP credentials.
5. Copy `.env.example` to `.env` and fill SES values.
6. Restart the server and test OTP signup with a non-verified recipient email.
