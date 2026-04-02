const fs = require('fs');
const https = require('https');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const Razorpay = require('razorpay');
const multer = require('multer');

loadEnvFromFile(path.join(__dirname, '.env'));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_super_secret_change_me';
const IS_PRODUCTION = normalizeEnvValue(process.env.NODE_ENV).toLowerCase() === 'production';
const ALLOW_DEV_OTP_FALLBACK = !IS_PRODUCTION && normalizeEnvValue(process.env.ALLOW_DEV_OTP_FALLBACK || 'true').toLowerCase() !== 'false';
const TOKEN_COOKIE = 'booking_portal_token';
const ALLOWED_SLOT_START_TIMES = ['09:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30', '16:30', '17:30', '18:30', '19:30'];
const MAX_BOOKINGS_PER_SLOT_HYDROGEN = 1;
const MAX_BOOKINGS_PER_SLOT_IV = 1;
const MAX_HYDROGEN_SESSIONS_PER_DAY_PER_USER = 3;
const IV_REBOOK_COOLDOWN_DAYS = 14;
const OTP_TTL_MINUTES = 10;
const BOOKING_HOLD_MINUTES = 10;
const BOOKING_HOLD_CUTOFF_SQL = `datetime('now', '-${BOOKING_HOLD_MINUTES} minutes')`;
const ADMIN_DISCOUNT_GATE_PASSWORD = normalizeEnvValue(process.env.ADMIN_DISCOUNT_GATE_PASSWORD || 'H2-FOUNDERS-2026');
const RAZORPAY_KEY_ID = normalizeEnvValue(process.env.RAZORPAY_KEY_ID);
const RAZORPAY_KEY_SECRET = normalizeEnvValue(process.env.RAZORPAY_KEY_SECRET);
const RAZORPAY_MODE = normalizeEnvValue(process.env.RAZORPAY_MODE || 'test').toLowerCase() || 'test';
const SENDGRID_API_KEY = normalizeEnvValue(process.env.SENDGRID_API_KEY);
const SENDGRID_FROM_EMAIL = normalizeEnvValue(
  process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER || ''
);
const AVATAR_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const SEED_DEMO_DOCTORS = normalizeEnvValue(process.env.SEED_DEMO_DOCTORS || 'false').toLowerCase() === 'true';
const SES_API_REGION = (
  normalizeEnvValue(process.env.SES_API_REGION) ||
  normalizeEnvValue(process.env.AWS_REGION) ||
  regionFromSmtpHost(normalizeEnvValue(process.env.SMTP_HOST)) ||
  'ap-southeast-2'
).trim();
const SES_API_ACCESS_KEY_ID = normalizeEnvValue(process.env.SES_API_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '');
const SES_API_SECRET_ACCESS_KEY = (
  normalizeEnvValue(process.env.SES_API_SECRET_ACCESS_KEY) ||
  normalizeEnvValue(process.env.AWS_SECRET_ACCESS_KEY) ||
  ''
).trim();
const SES_API_SESSION_TOKEN = normalizeEnvValue(process.env.SES_API_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN || '');

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}
const SERVICE_CATALOG = [
  {
    category: 'HYDROGEN SESSION',
    name: 'H2 Single Session',
    priceInr: 4800,
    nonMemberPriceInr: 9500,
    memberPriceInr: 4800,
    includes: '1 Hydrogen Session',
    description:
      'Single hydrogen session for immediate recovery and cellular wellness support. Non-member pricing: Rs. 9,500.',
  },
  {
    category: 'HYDROGEN SESSION',
    name: 'H2 1 Week Program (4 Sessions)',
    priceInr: 12000,
    nonMemberPriceInr: 28000,
    memberPriceInr: 12000,
    includes: '4 Hydrogen Sessions in 1 week',
    description:
      'Structured weekly session plan designed for consistency and better recovery outcomes. Non-member pricing: Rs. 28,000.',
  },
  {
    category: 'HYDROGEN SESSION',
    name: 'H2 2 Week Program (8 Sessions)',
    priceInr: 22000,
    nonMemberPriceInr: 48000,
    memberPriceInr: 22000,
    includes: '8 Hydrogen Sessions in 2 weeks',
    description:
      'Enhanced two-week protocol to support sustained detox and energy optimization. Non-member pricing: Rs. 48,000.',
  },
  {
    category: 'HYDROGEN SESSION',
    name: 'H2 1 Month Program (16 Sessions)',
    priceInr: 32000,
    nonMemberPriceInr: 64000,
    memberPriceInr: 32000,
    includes: '16 Hydrogen Sessions in 1 month',
    description:
      'Monthly core plan for ongoing metabolic, inflammation, and vitality support. Non-member pricing: Rs. 64,000.',
  },
  {
    category: 'HYDROGEN SESSION',
    name: 'H2 Intensive 1 Month (30 Sessions)',
    priceInr: 46000,
    nonMemberPriceInr: 90000,
    memberPriceInr: 46000,
    includes: '30 Hydrogen Sessions in 1 month',
    description:
      'High-frequency monthly program for users seeking accelerated therapeutic benefits. Non-member pricing: Rs. 90,000.',
  },
  {
    category: 'HYDROGEN SESSION',
    name: 'H2 Intensive 3 Month (90 Sessions)',
    priceInr: 100000,
    nonMemberPriceInr: 150000,
    memberPriceInr: 100000,
    includes: '90 Hydrogen Sessions in 3 months',
    description:
      'Long-cycle intensive plan built for deep and sustained wellness transformation. Non-member pricing: Rs. 1,50,000.',
  },
  {
    category: 'MEMBERSHIP SERVICES',
    name: 'Lab Tests',
    priceInr: 0,
    membershipOnly: true,
    includes: 'Comprehensive lab panel included for active members.',
    description: 'Membership-only benefit. Included in active membership.',
  },
  {
    category: 'MEMBERSHIP SERVICES',
    name: 'Oxidative Stress Marker Test',
    priceInr: 0,
    membershipOnly: true,
    includes: 'Oxidative stress marker test included for active members.',
    description: 'Membership-only benefit. Included in active membership.',
  },
  {
    category: 'MEMBERSHIP SERVICES',
    name: 'Radiology Services',
    priceInr: 0,
    membershipOnly: true,
    includes: 'Radiology services included for active members.',
    description: 'Membership-only benefit. Included in active membership.',
  },
  {
    category: 'IV THERAPIES',
    name: 'Gym Hero',
    priceInr: 4800,
    includes: 'Normal saline, B1, B2, B6, B12, Vitamin C, Magnesium, Glutathione',
    description:
      'Designed for fitness enthusiasts to support muscle recovery, hydration, energy production, and antioxidant support after intense workouts.',
  },
  {
    category: 'IV THERAPIES',
    name: 'Skin Luminosity',
    priceInr: 5900,
    includes: 'B1, B2, B6, B12, Vitamin C, Biotin, Zinc, Glutathione',
    description:
      'Promotes brighter, clearer skin by supporting collagen production, antioxidant protection, and overall skin health.',
  },
  {
    category: 'IV THERAPIES',
    name: 'Ultimate Immunity',
    priceInr: 6500,
    includes: 'Vitamin C, N-Acetyl Cysteine (NAC), Zinc, B1, B2, B6, B12, Alpha Lipoic Acid, Glutathione',
    description:
      'A powerful immune support blend that helps fight infections, reduce oxidative stress, and improve overall wellness.',
  },
  {
    category: 'IV THERAPIES',
    name: 'Hangover Cure',
    priceInr: 4500,
    includes: 'Normal saline, B1, B2, B6, B12, Glutathione, Magnesium, Ketorol, Ondansetron',
    description:
      'Rehydrates the body, relieves nausea and headache, and restores energy levels after alcohol consumption.',
  },
  {
    category: 'IV THERAPIES',
    name: 'Migraine',
    priceInr: 4500,
    includes: 'B1, B2, B6, B12, Magnesium, Ondansetron, Ketorol',
    description:
      'Helps reduce migraine intensity by easing pain, correcting deficiencies, and relieving nausea.',
  },
  {
    category: 'IV THERAPIES',
    name: 'Stress Buster',
    priceInr: 4500,
    includes: 'B1, B2, B6, B12, Vitamin C, Magnesium, Zinc',
    description:
      'Supports nervous system balance, reduces fatigue, and helps manage physical and mental stress.',
  },
  {
    category: 'IV THERAPIES',
    name: 'The House Drip',
    priceInr: 7500,
    includes:
      'B1, B2, B6, B12, Folic Acid, Vitamin C, Magnesium, Alpha Lipoic Acid, N-Acetyl Cysteine, Zinc, Biotin, L-Arginine, L-Carnitine',
    description:
      'A comprehensive wellness infusion designed for energy, immunity, detox support, metabolism, and overall vitality.',
  },
  {
    category: 'IV SHOTS',
    name: 'Recharge',
    priceInr: 2300,
    includes: 'B1, B2, B6, B12, Vitamin C',
    description: 'Quick energy booster that helps reduce fatigue and improve daily performance.',
  },
  {
    category: 'IV SHOTS',
    name: 'Focus',
    priceInr: 2900,
    includes: 'B1, B2, B6, B12, Glutathione',
    description: 'Supports mental clarity, concentration, and antioxidant protection.',
  },
  {
    category: 'IV SHOTS',
    name: 'Relax',
    priceInr: 2400,
    includes: 'Magnesium, Zinc, B1, B2, B6',
    description: 'Helps calm the nervous system, ease muscle tension, and promote relaxation.',
  },
  {
    category: 'IV SHOTS',
    name: 'Beauty',
    priceInr: 3800,
    includes: 'B1, B2, B3, B5, B6, Biotin, Vitamin C, Zinc, Glutathione',
    description: 'Enhances skin glow, supports hair and nail strength, and provides antioxidant benefits.',
  },
  {
    category: 'IV SHOTS',
    name: 'Gym Pump',
    priceInr: 3300,
    includes: 'B1, B2, B6, Glutathione, L-Arginine, L-Carnitine',
    description: 'Improves blood flow, endurance, and workout performance.',
  },
  {
    category: 'IV SHOTS',
    name: 'Detox',
    priceInr: 3800,
    includes: 'Vitamin C, N-Acetyl Cysteine, Zinc, Glutathione',
    description: 'Supports liver function, detoxification pathways, and cellular antioxidant defense.',
  },
  {
    category: 'IV SHOTS',
    name: 'Immunity Boost',
    priceInr: 3900,
    includes: 'B1, B2, B6, Vitamin C, N-Acetyl Cysteine, Zinc, Glutathione',
    description: 'Strengthens immune response and helps protect against infections.',
  },
  {
    category: 'IV SHOTS',
    name: 'The House Push',
    priceInr: 4800,
    includes: 'B1, B2, B6, B12, Vitamin C, Biotin, N-Acetyl Cysteine, Zinc, Glutathione',
    description: 'A premium wellness shot designed for full-body support, energy enhancement, and immune strengthening.',
  },
];

const MEMBERSHIP_PLANS = [
  {
    id: 'h2_single',
    name: '1 Person Membership',
    peopleCount: 1,
    priceInr: 84000,
    validityDays: 90,
    h2SessionsIncluded: 16,
    perks:
      'Includes lab tests, oxidative stress marker test, radiology services, concierge primary care, and 16 H2 sessions.',
  },
  {
    id: 'h2_two',
    name: '2 Person Membership',
    peopleCount: 2,
    priceInr: 160000,
    validityDays: 90,
    h2SessionsIncluded: 32,
    perks: '',
  },
  {
    id: 'h2_four',
    name: '4 Person Membership',
    peopleCount: 4,
    priceInr: 288000,
    validityDays: 90,
    h2SessionsIncluded: 64,
    perks: '',
  },
  {
    id: 'h2_add_person',
    name: 'Add Person',
    peopleCount: 1,
    priceInr: 78000,
    validityDays: 90,
    h2SessionsIncluded: 16,
    perks:
      'Add one more member to an existing plan with lab tests, oxidative stress marker test, radiology services, and hydrogen pricing benefits.',
  },
];
const MEMBERSHIP_VALIDITY_DAYS = Number(MEMBERSHIP_PLANS.find((plan) => plan.id === 'h2_single')?.validityDays || 90);
const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  next();
});
app.use(express.json());
const cors = require("cors");
app.use(cors());
const dataDir = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, 'uploads'));
const dbPath = path.join(dataDir, 'booking.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
const razorpayConfigError = getRazorpayConfigError();
const RAZORPAY_UNAVAILABLE_MESSAGE = razorpayConfigError || 'Razorpay is not configured';
const razorpay = !razorpayConfigError
  ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
  : null;

if (razorpayConfigError && (RAZORPAY_KEY_ID || RAZORPAY_KEY_SECRET || process.env.RAZORPAY_MODE)) {
  console.warn(`Razorpay disabled: ${razorpayConfigError}`);
}

migrate();
seedAdmin();

const requestCounters = new Map();

function loadEnvFromFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = String(rawLine || '').trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function normalizeEnvValue(value) {
  let normalized = String(value || '').trim();
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }
  return normalized;
}

function extractSendGridErrorDetails(error) {
  const statusCode = Number(error?.code || error?.response?.statusCode || 500);
  const body = error?.response?.body;
  const errors = Array.isArray(body?.errors) ? body.errors : [];
  const detail = errors
    .map((entry) => String(entry?.message || entry?.field || '').trim())
    .filter(Boolean)
    .join(' | ');

  return {
    statusCode,
    detail,
    responseBody: body || null,
  };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getRazorpayConfigError() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return 'Razorpay is not configured';
  }

  if (RAZORPAY_MODE !== 'test') {
    return 'Razorpay live mode is blocked. Set RAZORPAY_MODE=test.';
  }

  if (!RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    return 'Razorpay live keys are blocked. Use rzp_test_* credentials.';
  }

  return null;
}

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(uploadsDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      cb(null, `avatar_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: {
    fileSize: AVATAR_MAX_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPG, PNG, or WEBP images are allowed'), ok);
  },
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', rateLimit({ windowMs: 60_000, max: 40 }));

app.post('/api/auth/register/start', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!name || !email) {
    return res.status(400).json({ message: 'name and email are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'valid email is required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ message: 'email already registered' });
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();
  const placeholderPasswordHash = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 10);
  db.prepare(
    `INSERT INTO pending_registrations (email, name, password_hash, otp_hash, expires_at, attempts_left, otp_verified, created_at)
     VALUES (?, ?, ?, ?, ?, 5, 0, datetime('now'))
     ON CONFLICT(email) DO UPDATE SET
       name = excluded.name,
       password_hash = excluded.password_hash,
       otp_hash = excluded.otp_hash,
       expires_at = excluded.expires_at,
       attempts_left = 5,
       otp_verified = 0,
       created_at = datetime('now')`
  ).run(email, name, placeholderPasswordHash, otpHash, expiresAt);

  const mailResult = await sendOtpEmail(email, otp, 'signup');
  if (!mailResult.ok) {
    return res.status(mailResult.statusCode || 500).json({ message: mailResult.message });
  }

  return res.status(200).json({
    message: mailResult.message || `Signup OTP sent to ${email}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    otpRequired: true,
    verificationRequired: true,
  });
});

app.post('/api/auth/register', async (_req, res) => {
  return res.status(410).json({
    message: 'Signup flow changed. Use /api/auth/register/start, /api/auth/register/verify, and /api/auth/register/complete.',
  });
});

app.post('/api/auth/register/verify-email', async (req, res) => {
  return res.status(410).json({
    message: 'Use /api/auth/register/start with name and email to begin signup.',
  });
});

app.post('/api/auth/register/verify', (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ message: 'email and otp are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const pending = db.prepare(
    `SELECT email, name, otp_hash AS otpHash, expires_at AS expiresAt, attempts_left AS attemptsLeft, otp_verified AS otpVerified
     FROM pending_registrations
     WHERE email = ?`
  ).get(normalizedEmail);

  if (!pending) {
    return res.status(404).json({ message: 'No pending registration found. Please register again.' });
  }

  if (Number(pending.otpVerified) === 1) {
    return res.json({
      verified: true,
      verificationStatus: 'SUCCESS',
      message: 'OTP already verified. Please set your password to complete signup.',
    });
  }

  if (new Date(pending.expiresAt).getTime() < Date.now()) {
    db.prepare('DELETE FROM pending_registrations WHERE email = ?').run(normalizedEmail);
    return res.status(400).json({ message: 'OTP expired. Please register again.' });
  }

  const isOtpValid = hashOtp(String(otp).trim()) === pending.otpHash;
  if (!isOtpValid) {
    db.prepare(
      'UPDATE pending_registrations SET attempts_left = attempts_left - 1 WHERE email = ?'
    ).run(normalizedEmail);

    const updated = db
      .prepare('SELECT attempts_left AS attemptsLeft FROM pending_registrations WHERE email = ?')
      .get(normalizedEmail);

    if (!updated || updated.attemptsLeft <= 0) {
      db.prepare('DELETE FROM pending_registrations WHERE email = ?').run(normalizedEmail);
      return res.status(400).json({ message: 'Too many invalid OTP attempts. Please register again.' });
    }

    return res.status(400).json({ message: `Invalid OTP. ${updated.attemptsLeft} attempts left.` });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existingUser) {
    db.prepare('DELETE FROM pending_registrations WHERE email = ?').run(normalizedEmail);
    return res.status(409).json({ message: 'email already registered' });
  }

  db.prepare(
    `UPDATE pending_registrations
     SET otp_verified = 1, otp_hash = '', expires_at = datetime('now'), attempts_left = 0
     WHERE email = ?`
  ).run(normalizedEmail);

  return res.json({
    verified: true,
    verificationStatus: 'SUCCESS',
    message: 'OTP verified. Now set your password to complete signup.',
  });
});

app.post('/api/auth/register/complete', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ message: 'password must be at least 8 characters' });
  }

  const pending = db.prepare(
    `SELECT email, name, otp_verified AS otpVerified
     FROM pending_registrations
     WHERE email = ?`
  ).get(email);
  if (!pending) {
    return res.status(404).json({ message: 'No pending signup found. Start registration again.' });
  }

  if (Number(pending.otpVerified) !== 1) {
    return res.status(400).json({ message: 'Please verify signup OTP first.' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    db.prepare('DELETE FROM pending_registrations WHERE email = ?').run(email);
    return res.status(409).json({ message: 'email already registered' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, created_at)
       VALUES (?, ?, ?, 'user', datetime('now'))`
    )
    .run(String(pending.name || '').trim() || 'User', email, passwordHash);

  db.prepare('DELETE FROM pending_registrations WHERE email = ?').run(email);

  const user = syncMembershipForUser({ userId: Number(result.lastInsertRowid), email }) || {
    id: Number(result.lastInsertRowid),
    name: String(pending.name || 'User'),
    email,
    role: 'user',
    membershipStatus: 'inactive',
    membershipPlan: '',
    membershipStartedAt: null,
    membershipExpiresAt: null,
    membershipPeopleCount: null,
    membershipSubscriptionId: null,
  };

  setAuthCookie(res, user);
  return res.status(201).json({ user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db
    .prepare(
      `SELECT id, name, email, password_hash, role, age, gender, mobile, avatar_url AS avatarUrl,
              membership_status AS membershipStatus, membership_plan AS membershipPlan,
              membership_started_at AS membershipStartedAt, membership_expires_at AS membershipExpiresAt,
              membership_people_count AS membershipPeopleCount,
              membership_subscription_id AS membershipSubscriptionId
       FROM users
       WHERE email = ?`
    )
    .get(normalizedEmail);

  if (!user) {
    return res.status(404).json({ message: 'User not found. Please register.' });
  }

  const passwordHash = String(user.password_hash || '').trim();
  if (!passwordHash) {
    return res.status(500).json({
      message: 'This account is missing a password. Please contact support or reseed the admin account.',
    });
  }

  if (!bcrypt.compareSync(String(password), passwordHash)) {
    return res.status(401).json({ message: 'Invalid password.' });
  }

  const syncedUser = syncMembershipForUser({ userId: Number(user.id), email: normalizedEmail }) || getUserProfileById(Number(user.id)) || user;
  const authUser = {
    id: Number(syncedUser.id),
    name: String(syncedUser.name),
    email: String(syncedUser.email),
    role: String(syncedUser.role || 'user'),
    age: syncedUser.age ?? null,
    gender: syncedUser.gender || '',
    mobile: syncedUser.mobile || '',
    avatarUrl: syncedUser.avatarUrl || '',
    membershipStatus: syncedUser.membershipStatus || 'inactive',
    membershipPlan: syncedUser.membershipPlan || '',
    membershipStartedAt: syncedUser.membershipStartedAt || null,
    membershipExpiresAt: syncedUser.membershipExpiresAt || null,
    membershipPeopleCount: syncedUser.membershipPeopleCount ?? null,
    membershipSubscriptionId: syncedUser.membershipSubscriptionId || null,
  };

  setAuthCookie(res, authUser);
  return res.json({ user: authUser });
});

app.post('/api/auth/login/verify', (req, res) => {
  return res.status(410).json({ message: 'Login OTP flow is disabled. Please login using email and password.' });
});

app.post('/api/auth/password/forgot', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'email is required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'valid email is required' });
  }

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();
  db.prepare(
    `INSERT INTO pending_password_resets (email, otp_hash, expires_at, attempts_left, verified, created_at)
     VALUES (?, ?, ?, 5, 0, datetime('now'))
     ON CONFLICT(email) DO UPDATE SET
       otp_hash = excluded.otp_hash,
       expires_at = excluded.expires_at,
       attempts_left = 5,
       verified = 0,
       created_at = datetime('now')`
  ).run(email, otpHash, expiresAt);

  const mailResult = await sendOtpEmail(email, otp, 'password_reset');
  if (!mailResult.ok) {
    return res.status(mailResult.statusCode || 500).json({ message: mailResult.message });
  }

  return res.json({
    message: mailResult.message || `Password reset OTP sent to ${email}. It expires in ${OTP_TTL_MINUTES} minutes.`,
  });
});

app.post('/api/auth/password/verify', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const otp = String(req.body?.otp || '').trim();
  if (!email || !otp) {
    return res.status(400).json({ message: 'email and otp are required' });
  }

  const pending = db
    .prepare(
      `SELECT email, otp_hash AS otpHash, expires_at AS expiresAt, attempts_left AS attemptsLeft, verified
       FROM pending_password_resets
       WHERE email = ?`
    )
    .get(email);

  if (!pending) {
    return res.status(404).json({ message: 'No pending password reset found. Request OTP again.' });
  }

  if (Number(pending.verified) === 1) {
    return res.json({ verified: true, message: 'OTP already verified. Set your new password.' });
  }

  if (new Date(pending.expiresAt).getTime() < Date.now()) {
    db.prepare('DELETE FROM pending_password_resets WHERE email = ?').run(email);
    return res.status(400).json({ message: 'OTP expired. Request a new one.' });
  }

  if (hashOtp(otp) !== pending.otpHash) {
    db.prepare('UPDATE pending_password_resets SET attempts_left = attempts_left - 1 WHERE email = ?').run(email);
    const updated = db
      .prepare('SELECT attempts_left AS attemptsLeft FROM pending_password_resets WHERE email = ?')
      .get(email);
    if (!updated || updated.attemptsLeft <= 0) {
      db.prepare('DELETE FROM pending_password_resets WHERE email = ?').run(email);
      return res.status(400).json({ message: 'Too many invalid OTP attempts. Request a new one.' });
    }
    return res.status(400).json({ message: `Invalid OTP. ${updated.attemptsLeft} attempts left.` });
  }

  db.prepare(
    `UPDATE pending_password_resets
     SET verified = 1, otp_hash = '', expires_at = datetime('now'), attempts_left = 0
     WHERE email = ?`
  ).run(email);

  return res.json({ verified: true, message: 'OTP verified. Set your new password.' });
});

app.post('/api/auth/password/reset', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'password must be at least 8 characters' });
  }

  const pending = db
    .prepare('SELECT email, verified FROM pending_password_resets WHERE email = ?')
    .get(email);
  if (!pending) {
    return res.status(404).json({ message: 'No pending password reset found. Request OTP again.' });
  }

  if (Number(pending.verified) !== 1) {
    return res.status(400).json({ message: 'Please verify OTP first.' });
  }

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!user) {
    db.prepare('DELETE FROM pending_password_resets WHERE email = ?').run(email);
    return res.status(404).json({ message: 'User not found.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(passwordHash, email);
  db.prepare('DELETE FROM pending_password_resets WHERE email = ?').run(email);
  db.prepare('DELETE FROM pending_login_otps WHERE email = ?').run(email);

  return res.json({ message: 'Password reset successful. Please login with your new password.' });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(TOKEN_COOKIE);
  res.status(204).send();
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/profile', requireAuth, (req, res) => {
  const profile = db.prepare(
    `SELECT id, name, role, age, gender, mobile, avatar_url AS avatarUrl,
            membership_status AS membershipStatus, membership_plan AS membershipPlan,
            membership_started_at AS membershipStartedAt, membership_expires_at AS membershipExpiresAt,
            membership_people_count AS membershipPeopleCount,
            membership_subscription_id AS membershipSubscriptionId
     FROM users
     WHERE id = ?`
  ).get(req.user.id);

  res.json({ profile });
});

app.get('/api/doctor/profile', requireAuth, requireDoctor, (req, res) => {
  const doctor = db
    .prepare(
      `SELECT id, user_id AS userId, name, specialty, bio, experience_years AS experienceYears,
              consultation_fee AS consultationFee, available_days AS availableDays,
              approval_status AS approvalStatus, created_at AS createdAt
       FROM doctors
       WHERE user_id = ?`
    )
    .get(req.user.id);

  res.json({ doctor: doctor || null });
});

app.put('/api/doctor/profile', requireAuth, requireDoctor, (req, res) => {
  const payload = validateDoctorSelfProfilePayload(req.body);
  if (payload.error) return res.status(400).json({ message: payload.error });

  const existing = db
    .prepare('SELECT id FROM doctors WHERE user_id = ?')
    .get(req.user.id);

  if (existing) {
    db.prepare(
      `UPDATE doctors
       SET name = ?, specialty = ?, bio = ?, experience_years = ?, consultation_fee = ?, available_days = ?, approval_status = 'pending'
       WHERE id = ?`
    ).run(
      req.user.name,
      payload.data.specialty,
      payload.data.bio,
      payload.data.experienceYears,
      payload.data.consultationFee,
      payload.data.availableDays,
      existing.id
    );
  } else {
    db.prepare(
      `INSERT INTO doctors (
        user_id, name, specialty, bio, experience_years, consultation_fee, available_days, approval_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`
    ).run(
      req.user.id,
      req.user.name,
      payload.data.specialty,
      payload.data.bio,
      payload.data.experienceYears,
      payload.data.consultationFee,
      payload.data.availableDays
    );
  }

  const doctor = db
    .prepare(
      `SELECT id, user_id AS userId, name, specialty, bio, experience_years AS experienceYears,
              consultation_fee AS consultationFee, available_days AS availableDays,
              approval_status AS approvalStatus, created_at AS createdAt
       FROM doctors
       WHERE user_id = ?`
    )
    .get(req.user.id);

  res.json({ doctor });
});

app.put('/api/profile', requireAuth, (req, res) => {
  const hasAvatarField = Object.prototype.hasOwnProperty.call(req.body || {}, 'avatarUrl');
  const name = String(req.body?.name || '').trim();
  const ageRaw = String(req.body?.age ?? '').trim();
  const gender = String(req.body?.gender || '').trim().toLowerCase();
  const mobile = String(req.body?.mobile || '').trim();
  const avatarUrl = hasAvatarField ? String(req.body?.avatarUrl || '').trim() : null;

  if (!name) {
    return res.status(400).json({ message: 'name is required' });
  }

  let age = null;
  if (ageRaw) {
    const parsed = Number(ageRaw);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 120) {
      return res.status(400).json({ message: 'age must be a valid number between 1 and 120' });
    }
    age = parsed;
  }

  const allowedGenders = ['', 'male', 'female', 'other', 'prefer_not_to_say'];
  if (!allowedGenders.includes(gender)) {
    return res.status(400).json({ message: 'invalid gender' });
  }

  if (mobile && !/^[0-9+\-\s()]{7,20}$/.test(mobile)) {
    return res.status(400).json({ message: 'invalid mobile number' });
  }

  if (hasAvatarField && avatarUrl && !/^https?:\/\/.+/i.test(avatarUrl) && !avatarUrl.startsWith('/uploads/')) {
    return res.status(400).json({ message: 'avatarUrl must be a valid http/https URL or /uploads path' });
  }

  const current = db
    .prepare('SELECT avatar_url AS avatarUrl FROM users WHERE id = ?')
    .get(req.user.id);
  const nextAvatarUrl = hasAvatarField ? (avatarUrl || null) : (current?.avatarUrl || null);

  db.prepare(
    `UPDATE users
     SET name = ?, age = ?, gender = ?, mobile = ?, avatar_url = ?
     WHERE id = ?`
  ).run(name, age, gender || null, mobile || null, nextAvatarUrl, req.user.id);

  const profile = db.prepare(
    `SELECT id, name, role, age, gender, mobile, avatar_url AS avatarUrl,
            membership_status AS membershipStatus, membership_plan AS membershipPlan,
            membership_started_at AS membershipStartedAt, membership_expires_at AS membershipExpiresAt,
            membership_people_count AS membershipPeopleCount
     FROM users
     WHERE id = ?`
  ).get(req.user.id);

  res.json({ profile });
});

app.post('/api/profile/avatar', requireAuth, (req, res) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Max size is 10MB.' });
      }
      return res.status(400).json({ message: err.message || 'Image upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'avatar file is required' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.user.id);

    const profile = db.prepare(
      `SELECT id, name, role, age, gender, mobile, avatar_url AS avatarUrl,
              membership_status AS membershipStatus, membership_plan AS membershipPlan,
              membership_started_at AS membershipStartedAt, membership_expires_at AS membershipExpiresAt,
              membership_people_count AS membershipPeopleCount
       FROM users
       WHERE id = ?`
    ).get(req.user.id);

    return res.json({ profile });
  });
});

app.post('/api/admin/ses/verify-recipient', requireAuth, requireAdmin, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'valid email is required' });
  }

  const verification = await requestSesRecipientVerification(email);
  if (!verification.ok) {
    return res.status(400).json({
      message: verification.message,
      configured: Boolean(verification.configured),
    });
  }

  return res.json({
    email,
    verificationStatus: verification.status,
    message: 'Verification email requested. Ask recipient to click the SES verification link.',
  });
});

app.get('/api/admin/ses/identity-status', requireAuth, requireAdmin, async (req, res) => {
  const email = String(req.query?.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'valid email query param is required' });
  }

  const statusResult = await getSesIdentityStatus(email);
  if (!statusResult.ok) {
    return res.status(statusResult.statusCode || 400).json({ message: statusResult.message });
  }

  return res.json({
    email,
    verificationStatus: statusResult.status,
  });
});

app.get('/api/services', requireAuth, (req, res) => {
  const services = getVisibleServicesForUser(req.user).map((service) => toServiceResponse(service, req.user));
  res.json({ services, membershipActive: isMembershipActiveForUser(req.user) });
});

app.get('/api/services/availability', requireAuth, (req, res) => {
  const bookingDate = String(req.query?.bookingDate || '').trim();
  const category = String(req.query?.category || '').trim().toUpperCase();
  let availabilityUser = req.user;

  if (req.user.role === 'admin') {
    const customerEmail = String(req.query?.customerEmail || '').trim().toLowerCase();
    if (customerEmail) {
      const resolvedCustomer = resolveAdminCustomerContext({
        customerEmail,
        createIfMissing: false,
      });
      if (resolvedCustomer.error) {
        return res.status(400).json({ message: resolvedCustomer.error });
      }
      availabilityUser = resolvedCustomer.user;
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    return res.status(400).json({ message: 'bookingDate query must be in YYYY-MM-DD format' });
  }

  const selectedDate = new Date(`${bookingDate}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) {
    return res.status(400).json({ message: 'bookingDate is invalid' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    return res.status(400).json({ message: 'bookingDate cannot be in the past' });
  }

  const allServices = getVisibleServicesForUser(availabilityUser).filter((service) => {
    if (!category) return true;
    return String(service.category || '').toUpperCase() === category;
  });

  const availability = {};
  const holds = {};
  for (const service of allServices) {
    availability[service.name] = {};
    holds[service.name] = {};
    for (const slot of ALLOWED_SLOT_START_TIMES) {
      availability[service.name][slot] = 0;
      holds[service.name][slot] = 0;
    }
  }

  if (allServices.length > 0) {
    const placeholders = allServices.map(() => '?').join(', ');
    const params = [bookingDate, ...allServices.map((service) => service.name)];
    const rows = db
      .prepare(
        `SELECT service_name AS serviceName,
                booking_time AS bookingTime,
                SUM(CASE WHEN ${activeBookingSql()} THEN 1 ELSE 0 END) AS total,
                SUM(CASE WHEN ${holdBookingSql()} THEN 1 ELSE 0 END) AS holdTotal
         FROM bookings
         WHERE booking_date = ?
           AND status IN ('pending', 'booked', 'confirmed')
           AND service_name IN (${placeholders})
         GROUP BY service_name, booking_time`
      )
      .all(...params);

    for (const row of rows) {
      const serviceName = String(row.serviceName || '');
      const bookingTime = String(row.bookingTime || '');
      if (!availability[serviceName] || !ALLOWED_SLOT_START_TIMES.includes(bookingTime)) continue;
      availability[serviceName][bookingTime] = Number(row.total || 0);
      holds[serviceName][bookingTime] = Number(row.holdTotal || 0);
    }
  }

  return res.json({
    bookingDate,
    category,
    maxPerSlot: MAX_BOOKINGS_PER_SLOT_HYDROGEN,
    slotCapacityByService: Object.fromEntries(
      allServices.map((service) => [service.name, getSlotCapacityForServiceName(service.name)])
    ),
    slots: ALLOWED_SLOT_START_TIMES,
    availability,
    holds,
    holdMinutes: BOOKING_HOLD_MINUTES,
  });
});

app.get('/api/membership/plans', requireAuth, (req, res) => {
  const active = isMembershipActiveForUser(req.user);
  return res.json({
    active,
    current: {
      status: req.user.membershipStatus || 'inactive',
      plan: req.user.membershipPlan || '',
      startedAt: req.user.membershipStartedAt || null,
      expiresAt: req.user.membershipExpiresAt || null,
      peopleCount: req.user.membershipPeopleCount ?? null,
      subscriptionId: req.user.membershipSubscriptionId || null,
    },
    plans: MEMBERSHIP_PLANS,
  });
});

app.post('/api/membership/preview-coupon', requireAuth, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'Only users can preview membership coupons.' });
  }

  const planId = String(req.body?.planId || '').trim();
  const plan = MEMBERSHIP_PLANS.find((item) => item.id === planId);
  if (!plan) {
    return res.status(400).json({ message: 'Invalid membership plan selected.' });
  }

  const additionalPeople = Number(req.body?.additionalPeople ?? 0);
  if (!Number.isInteger(additionalPeople) || additionalPeople < 0) {
    return res.status(400).json({ message: 'additionalPeople must be a non-negative integer' });
  }

  const addPersonPlan = MEMBERSHIP_PLANS.find((item) => item.id === 'h2_add_person');
  const addPersonPriceInr = Number(addPersonPlan?.priceInr || 0);
  const subtotalAmountPaise = Math.round((Number(plan.priceInr || 0) + additionalPeople * addPersonPriceInr) * 100);
  const couponResult = validateCouponForUser({
    code: req.body?.couponCode,
    userId: req.user.id,
    appliesTo: 'membership',
    subtotalAmountPaise,
  });
  if (couponResult.error) {
    return res.status(400).json({ message: couponResult.error });
  }

  return res.json({ coupon: serializeCouponPreview(couponResult) });
});

app.post('/api/membership/subscribe', requireAuth, (req, res) => {
  return res.status(410).json({
    message: 'Direct membership activation is disabled. Use /api/membership/create-order and /api/membership/verify.',
  });
});

app.post('/api/membership/create-order', requireAuth, async (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'Only users can subscribe to membership.' });
  }
  if (!razorpay) {
    return res.status(503).json({ message: RAZORPAY_UNAVAILABLE_MESSAGE });
  }

  const planId = String(req.body?.planId || '').trim();
  const plan = MEMBERSHIP_PLANS.find((item) => item.id === planId);
  if (!plan) {
    return res.status(400).json({ message: 'Invalid membership plan selected.' });
  }
  const additionalPeople = Number(req.body?.additionalPeople ?? 0);
  if (!Number.isInteger(additionalPeople) || additionalPeople < 0) {
    return res.status(400).json({ message: 'additionalPeople must be a non-negative integer' });
  }

  const userRow = db
    .prepare(
      `SELECT membership_status AS membershipStatus, membership_plan AS membershipPlan,
              membership_started_at AS membershipStartedAt, membership_expires_at AS membershipExpiresAt,
              membership_people_count AS membershipPeopleCount
       FROM users
       WHERE id = ?`
    )
    .get(req.user.id);
  const hasActiveMembership = isMembershipActiveForUser({
    membershipStatus: userRow?.membershipStatus || req.user.membershipStatus,
    membershipExpiresAt: userRow?.membershipExpiresAt || req.user.membershipExpiresAt,
  });

  if (planId === 'h2_add_person' && !hasActiveMembership) {
    return res.status(409).json({ message: 'Add Person is available only for active memberships.' });
  }

  if (planId === 'h2_add_person' && additionalPeople > 0) {
    return res.status(400).json({ message: 'additionalPeople is not supported for Add Person plan' });
  }

  const addPersonPlan = MEMBERSHIP_PLANS.find((item) => item.id === 'h2_add_person');
  const addPersonPriceInr = Number(addPersonPlan?.priceInr || 0);
  const basePeopleCount = Number(plan.peopleCount || 1);
  const targetPeopleCount =
    planId === 'h2_add_person'
      ? Number(userRow?.membershipPeopleCount || req.user.membershipPeopleCount || 1) + 1
      : basePeopleCount + additionalPeople;
  const totalAmountInr =
    planId === 'h2_add_person'
      ? Number(plan.priceInr || 0)
      : Number(plan.priceInr || 0) + additionalPeople * addPersonPriceInr;
  const subtotalAmountPaise = Math.round(totalAmountInr * 100);
  const couponResult = validateCouponForUser({
    code: req.body?.couponCode,
    userId: req.user.id,
    appliesTo: 'membership',
    subtotalAmountPaise,
  });
  if (couponResult.error) {
    return res.status(400).json({ message: couponResult.error });
  }
  const amountInPaise = Math.max(100, Number(couponResult.finalAmountPaise || subtotalAmountPaise));

  const memberDetailsResult = normalizeMembershipMembers(req.body?.memberDetails, targetPeopleCount);
  if (memberDetailsResult.error) {
    return res.status(400).json({ message: memberDetailsResult.error });
  }
  const memberDetails = memberDetailsResult.data;
  if (!memberDetails.some((member) => String(member.email || '').trim().toLowerCase() === String(req.user.email || '').trim().toLowerCase())) {
    return res.status(400).json({ message: 'Buyer email must be included in the membership member list.' });
  }
  const subscriptionConflict = validateSubscriptionMemberConflicts(getMembershipSubscriptionId(req.user.id), memberDetails);
  if (subscriptionConflict.error) {
    return res.status(409).json({ message: subscriptionConflict.error });
  }

  try {
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: buildRazorpayReceipt('membership', req.user.id),
      notes: {
        userId: String(req.user.id),
        planId: String(plan.id),
        peopleCount: String(targetPeopleCount),
        couponCode: String(couponResult.couponCode || ''),
      },
    });

    db.prepare(
      `INSERT OR REPLACE INTO membership_payment_orders (
        order_id, user_id, plan_id, people_count, member_details_json, original_amount_paise, discount_amount_paise, coupon_id, coupon_code, amount_paise, status, payment_reference, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, datetime('now'))`
    ).run(
      order.id,
      req.user.id,
      plan.id,
      targetPeopleCount,
      JSON.stringify(memberDetails),
      Number(couponResult.originalAmountPaise || subtotalAmountPaise),
      Number(couponResult.discountAmountPaise || 0),
      couponResult.coupon?.id || null,
      couponResult.couponCode || null,
      amountInPaise
    );

    return res.json({
      keyId: RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: {
        id: plan.id,
        name: plan.name,
        priceInr: totalAmountInr,
        basePriceInr: Number(plan.priceInr || 0),
        addPersonPriceInr,
        additionalPeople,
        basePeopleCount,
        peopleCount: targetPeopleCount,
        validityDays: plan.validityDays,
        coupon: serializeCouponPreview(couponResult),
      },
      members: memberDetails,
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error('Razorpay membership order create failed:', getRazorpayOrderErrorMessage(error, 'Unable to create membership order'));
    return res.status(500).json({ message: getRazorpayOrderErrorMessage(error, 'Unable to create membership order') });
  }
});

app.post('/api/membership/verify', requireAuth, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'Only users can subscribe to membership.' });
  }
  if (!razorpay || !RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ message: RAZORPAY_UNAVAILABLE_MESSAGE });
  }

  const planId = String(req.body?.planId || '').trim();
  const razorpayOrderId = String(req.body?.razorpay_order_id || '');
  const razorpayPaymentId = String(req.body?.razorpay_payment_id || '');
  const razorpaySignature = String(req.body?.razorpay_signature || '');
  if (!planId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ message: 'Invalid membership verification payload' });
  }

  const plan = MEMBERSHIP_PLANS.find((item) => item.id === planId);
  if (!plan) {
    return res.status(400).json({ message: 'Invalid membership plan selected.' });
  }

  const pendingOrder = db
    .prepare(
      `SELECT order_id AS orderId, user_id AS userId, plan_id AS planId, people_count AS peopleCount, status,
              member_details_json AS memberDetailsJson,
              coupon_id AS couponId, discount_amount_paise AS discountAmountPaise
       FROM membership_payment_orders
       WHERE order_id = ?`
    )
    .get(razorpayOrderId);

  if (!pendingOrder) {
    return res.status(404).json({ message: 'Membership order not found' });
  }
  if (Number(pendingOrder.userId) !== Number(req.user.id)) {
    return res.status(403).json({ message: 'forbidden' });
  }
  if (String(pendingOrder.planId) !== plan.id) {
    return res.status(400).json({ message: 'Plan mismatch for this order' });
  }
  if (String(pendingOrder.status) === 'paid') {
    return res.status(409).json({ message: 'Membership payment already verified for this order' });
  }

  const peopleCount = Number(pendingOrder.peopleCount || plan.peopleCount || 1);
  let memberDetails = [];
  try {
    memberDetails = pendingOrder.memberDetailsJson ? JSON.parse(pendingOrder.memberDetailsJson) : [];
  } catch {
    memberDetails = [];
  }
  const memberDetailsResult = normalizeMembershipMembers(memberDetails, peopleCount);
  if (memberDetailsResult.error) {
    return res.status(400).json({ message: memberDetailsResult.error });
  }
  memberDetails = memberDetailsResult.data;
  if (!memberDetails.some((member) => String(member.email || '').trim().toLowerCase() === String(req.user.email || '').trim().toLowerCase())) {
    return res.status(400).json({ message: 'Buyer email must be included in the membership member list.' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({ message: 'Invalid payment signature' });
  }

  const existingUser = db
    .prepare(
      `SELECT membership_status AS membershipStatus, membership_plan AS membershipPlan,
              membership_started_at AS membershipStartedAt, membership_expires_at AS membershipExpiresAt,
              membership_subscription_id AS membershipSubscriptionId
       FROM users
       WHERE id = ?`
    )
    .get(req.user.id);
  const hasActiveMembership = isMembershipActiveForUser({
    membershipStatus: existingUser?.membershipStatus || req.user.membershipStatus,
    membershipExpiresAt: existingUser?.membershipExpiresAt || req.user.membershipExpiresAt,
  });

  if (plan.id === 'h2_add_person' && !hasActiveMembership) {
    return res.status(409).json({ message: 'Add Person is available only for active memberships.' });
  }

  const now = new Date();
  const startedAt =
    plan.id === 'h2_add_person' && existingUser?.membershipStartedAt ? existingUser.membershipStartedAt : now.toISOString();
  const expiresAt =
    plan.id === 'h2_add_person' && existingUser?.membershipExpiresAt
      ? existingUser.membershipExpiresAt
      : new Date(now.getTime() + Number(plan.validityDays || MEMBERSHIP_VALIDITY_DAYS) * 24 * 60 * 60 * 1000).toISOString();
  const membershipPlanId =
    plan.id === 'h2_add_person' ? String(existingUser?.membershipPlan || req.user.membershipPlan || 'h2_single') : plan.id;
  const subscriptionId =
    existingUser?.membershipSubscriptionId ||
    req.user.membershipSubscriptionId ||
    getMembershipSubscriptionId(req.user.id);

  db.prepare(
    `UPDATE users
     SET membership_status = 'active',
         membership_plan = ?,
         membership_started_at = ?,
         membership_expires_at = ?,
         membership_people_count = ?,
         membership_subscription_id = ?
     WHERE id = ?`
  ).run(membershipPlanId, startedAt, expiresAt, peopleCount, subscriptionId, req.user.id);

  db.prepare(
    `UPDATE membership_payment_orders
     SET status = 'paid',
         payment_reference = ?,
         paid_at = datetime('now')
     WHERE order_id = ?`
  ).run(razorpayPaymentId, razorpayOrderId);

  if (Number(pendingOrder.couponId || 0) > 0 && Number(pendingOrder.discountAmountPaise || 0) > 0) {
    recordCouponRedemption({
      couponId: Number(pendingOrder.couponId),
      userId: req.user.id,
      contextType: 'membership',
      contextRef: razorpayOrderId,
      discountAmountPaise: Number(pendingOrder.discountAmountPaise || 0),
    });
  }

  const saveMembersResult = saveMembershipSubscriptionMembers({
    ownerUserId: req.user.id,
    subscriptionId,
    planId: membershipPlanId,
    peopleCount,
    startedAt,
    expiresAt,
    members: memberDetails.map((member) => ({
      ...member,
      email: String(member.email || '').trim().toLowerCase(),
    })),
  });
  if (saveMembersResult.error) {
    return res.status(409).json({ message: saveMembersResult.error });
  }

  const profile = syncMembershipForUser({ userId: req.user.id, email: req.user.email }) || getUserProfileById(req.user.id);

  return res.json({
    message:
      plan.id === 'h2_add_person'
        ? `Member added successfully. Current covered members: ${peopleCount}.`
        : `${plan.name} activated successfully for ${peopleCount} member(s).`,
    profile,
    paid: true,
  });
});

app.get('/api/doctors', requireAuth, (_req, res) => {
  return res.json({ doctors: [] });
});

app.get('/api/admin/doctors', requireAuth, requireAdmin, (_req, res) => {
  const doctors = db
    .prepare(
      `SELECT id, name, specialty, bio, experience_years AS experienceYears,
              consultation_fee AS consultationFee, available_days AS availableDays, created_at AS createdAt,
              approval_status AS approvalStatus,
              user_id AS userId
       FROM doctors
       ORDER BY id ASC`
    )
    .all();
  res.json({ doctors });
});

app.get('/api/admin/users', requireAuth, requireAdmin, (_req, res) => {
  const search = String(_req.query?.search || '').trim().toLowerCase();
  let query = `
    SELECT id,
           name,
           email,
           mobile,
           membership_status AS membershipStatus,
           membership_plan AS membershipPlan,
           membership_expires_at AS membershipExpiresAt,
           membership_people_count AS membershipPeopleCount
    FROM users
    WHERE role = 'user'
  `;
  const params = [];
  if (search) {
    const like = `%${search}%`;
    query += ` AND (
      LOWER(name) LIKE ? OR
      LOWER(email) LIKE ? OR
      mobile LIKE ?
    )`;
    params.push(like, like, like);
  }
  query += ' ORDER BY name COLLATE NOCASE ASC, id ASC';
  const users = db.prepare(query).all(...params);

  res.json({ users });
});

app.post('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const mobile = String(req.body?.mobile || '').trim();

  if (!name || !email || !mobile) {
    return res.status(400).json({ message: 'Name, email, and phone are required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }

  const result = resolveAdminCustomerContext({
    customerName: name,
    customerEmail: email,
    customerPhone: mobile,
    createIfMissing: true,
  });
  if (result?.error) {
    return res.status(400).json({ message: result.error });
  }
  if (!result?.user) {
    return res.status(500).json({ message: 'Unable to create user.' });
  }

  return res.json({ user: result.user, created: Boolean(result.createdUser) });
});

app.post('/api/admin/discount-access', requireAuth, requireAdmin, (req, res) => {
  const password = String(req.body?.password || '').trim();
  if (!password) {
    return res.status(400).json({ message: 'Password is required.' });
  }
  if (password !== ADMIN_DISCOUNT_GATE_PASSWORD) {
    return res.status(401).json({ message: 'Invalid discount password.' });
  }
  return res.json({ ok: true });
});

app.patch('/api/admin/users/:id', requireAuth, requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ message: 'Invalid user id.' });
  }

  const existing = db
    .prepare('SELECT id, name, email, mobile FROM users WHERE id = ?')
    .get(userId);
  if (!existing) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const nextEmailRaw = String(req.body?.email || '').trim().toLowerCase();
  const nextMobileRaw = String(req.body?.mobile || '').trim();
  const nextEmail = nextEmailRaw || existing.email;
  const nextMobile = nextMobileRaw || '';

  if (!nextEmail || !isValidEmail(nextEmail)) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }

  if (nextEmail !== existing.email) {
    const emailConflict = db
      .prepare('SELECT id FROM users WHERE email = ? AND id <> ?')
      .get(nextEmail, userId);
    if (emailConflict) {
      return res.status(409).json({ message: 'That email is already in use.' });
    }
  }

  db.prepare('UPDATE users SET email = ?, mobile = ? WHERE id = ?').run(nextEmail, nextMobile || null, userId);

  return res.json({
    user: {
      id: userId,
      name: existing.name,
      email: nextEmail,
      mobile: nextMobile,
    },
  });
});

app.post('/api/admin/services', requireAuth, requireAdmin, (req, res) => {
  const resolvedCustomer = resolveAdminCustomerContext({
    customerName: req.body?.customerName,
    customerEmail: req.body?.customerEmail,
    customerPhone: req.body?.customerPhone,
    createIfMissing: false,
  });
  if (resolvedCustomer.error) {
    return res.status(400).json({ message: resolvedCustomer.error });
  }

  if (!resolvedCustomer.user || !resolvedCustomer.user.email) {
    return res.json({ services: [], membershipActive: false, resolvedCustomer: null });
  }

  const services = getVisibleServicesForUser(resolvedCustomer.user).map((service) =>
    toServiceResponse(service, resolvedCustomer.user)
  );
  res.json({
    services,
    membershipActive: isMembershipActiveForUser(resolvedCustomer.user),
    resolvedCustomer: {
      id: resolvedCustomer.user.id ?? null,
      name: resolvedCustomer.user.name || '',
      email: resolvedCustomer.user.email || '',
      mobile: resolvedCustomer.user.mobile || '',
      discountPercent: getDiscountPercentForPhone(resolvedCustomer.user.mobile || ''),
      membershipStatus: resolvedCustomer.user.membershipStatus || 'inactive',
      membershipExpiresAt: resolvedCustomer.user.membershipExpiresAt || null,
      membershipPeopleCount: resolvedCustomer.user.membershipPeopleCount ?? null,
    },
  });
});

app.get('/api/bookings/:bookingId/notes', requireAuth, requireAdmin, (req, res) => {
  const bookingId = Number(req.params.bookingId);
  if (!Number.isInteger(bookingId)) {
    return res.status(400).json({ message: 'invalid booking id' });
  }
  const booking = db.prepare('SELECT id FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) {
    return res.status(404).json({ message: 'booking not found' });
  }
  const notes = db
    .prepare(
      `SELECT id, booking_id AS bookingId, note_text AS noteText,
              created_at AS createdAt, updated_at AS updatedAt
       FROM notes
       WHERE booking_id = ?
       ORDER BY created_at DESC`
    )
    .all(bookingId);
  return res.json({ notes });
});

app.post('/api/notes', requireAuth, requireAdmin, (req, res) => {
  const bookingId = Number(req.body?.bookingId || req.body?.booking_id || 0);
  const noteText = String(req.body?.noteText || req.body?.note_text || '').trim();

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({ message: 'bookingId is required' });
  }
  if (!noteText) {
    return res.status(400).json({ message: 'noteText is required' });
  }
  const booking = db.prepare('SELECT id FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) {
    return res.status(404).json({ message: 'booking not found' });
  }

  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO notes (booking_id, note_text, created_at, updated_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(bookingId, noteText, now, now);
  const note = db
    .prepare(
      `SELECT id, booking_id AS bookingId, note_text AS noteText,
              created_at AS createdAt, updated_at AS updatedAt
       FROM notes
       WHERE id = ?`
    )
    .get(result.lastInsertRowid);
  return res.json({ note });
});

app.put('/api/notes/:id', requireAuth, requireAdmin, (req, res) => {
  const noteId = Number(req.params.id);
  const noteText = String(req.body?.noteText || req.body?.note_text || '').trim();
  if (!Number.isInteger(noteId)) {
    return res.status(400).json({ message: 'invalid note id' });
  }
  if (!noteText) {
    return res.status(400).json({ message: 'noteText is required' });
  }
  const existing = db.prepare('SELECT id FROM notes WHERE id = ?').get(noteId);
  if (!existing) {
    return res.status(404).json({ message: 'note not found' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE notes SET note_text = ?, updated_at = ? WHERE id = ?').run(noteText, now, noteId);
  const note = db
    .prepare(
      `SELECT id, booking_id AS bookingId, note_text AS noteText,
              created_at AS createdAt, updated_at AS updatedAt
       FROM notes
       WHERE id = ?`
    )
    .get(noteId);
  return res.json({ note });
});

app.delete('/api/notes/:id', requireAuth, requireAdmin, (req, res) => {
  const noteId = Number(req.params.id);
  if (!Number.isInteger(noteId)) {
    return res.status(400).json({ message: 'invalid note id' });
  }
  const existing = db.prepare('SELECT id FROM notes WHERE id = ?').get(noteId);
  if (!existing) {
    return res.status(404).json({ message: 'note not found' });
  }
  db.prepare('DELETE FROM notes WHERE id = ?').run(noteId);
  return res.status(204).send();
});

app.get('/api/admin/membership-orders', requireAuth, requireAdmin, (_req, res) => {
  const orders = db
    .prepare(
      `SELECT mpo.order_id AS orderId,
              mpo.plan_id AS planId,
              mpo.people_count AS peopleCount,
              mpo.member_details_json AS memberDetailsJson,
              mpo.amount_paise AS amountPaise,
              mpo.status,
              mpo.payment_reference AS paymentReference,
              mpo.paid_at AS paidAt,
              mpo.created_at AS createdAt,
              u.id AS userId,
              u.name AS userName,
              u.email AS userEmail,
              u.mobile AS userMobile
       FROM membership_payment_orders mpo
       JOIN users u ON u.id = mpo.user_id
       WHERE LOWER(COALESCE(mpo.status, '')) = 'paid'
       ORDER BY datetime(COALESCE(mpo.paid_at, mpo.created_at)) DESC`
    )
    .all()
    .map((row) => {
      let memberDetails = [];
      try {
        memberDetails = row.memberDetailsJson ? JSON.parse(row.memberDetailsJson) : [];
      } catch {
        memberDetails = [];
      }
      return {
        orderId: row.orderId,
        planId: row.planId,
        peopleCount: Number(row.peopleCount || 0),
        amountPaise: Number(row.amountPaise || 0),
        status: row.status,
        paymentReference: row.paymentReference || '',
        paidAt: row.paidAt || null,
        createdAt: row.createdAt,
        userId: Number(row.userId),
        userName: row.userName,
        userEmail: row.userEmail,
        userMobile: row.userMobile || '',
        memberDetails,
      };
    });

  res.json({ orders });
});

app.get('/api/admin/discount-phones', requireAuth, requireAdmin, (_req, res) => {
  const discountPhones = db
    .prepare(
      `SELECT id, phone_key AS phoneKey, phone_display AS phoneDisplay, discount_percent AS discountPercent, created_at AS createdAt
       FROM admin_discount_phones
       ORDER BY datetime(created_at) DESC, id DESC`
    )
    .all()
    .map((row) => ({
      id: Number(row.id),
      phoneKey: row.phoneKey || '',
      phoneDisplay: row.phoneDisplay || '',
      discountPercent: Number(row.discountPercent || 0),
      createdAt: row.createdAt || null,
    }));

  res.json({ discountPhones });
});

app.post('/api/admin/discount-phones', requireAuth, requireAdmin, (req, res) => {
  const phoneDisplay = String(req.body?.phone || '').trim();
  const phoneKey = normalizeDiscountPhoneKey(phoneDisplay);
  const discountPercent = Number(req.body?.discountPercent || 0);

  if (!phoneKey) {
    return res.status(400).json({ message: 'Valid phone number is required.' });
  }
  if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
    return res.status(400).json({ message: 'discountPercent must be between 1 and 100.' });
  }

  db.prepare(
    `INSERT INTO admin_discount_phones (phone_key, phone_display, discount_percent, created_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(phone_key) DO UPDATE SET
       phone_display = excluded.phone_display,
       discount_percent = excluded.discount_percent`
  ).run(phoneKey, phoneDisplay, discountPercent);

  res.status(201).json({ message: 'Discount phone saved.' });
});

app.delete('/api/admin/discount-phones/:id', requireAuth, requireAdmin, (req, res) => {
  const discountId = Number(req.params.id);
  if (!Number.isInteger(discountId)) {
    return res.status(400).json({ message: 'Invalid discount id.' });
  }

  db.prepare('DELETE FROM admin_discount_phones WHERE id = ?').run(discountId);
  res.json({ message: 'Discount phone removed.' });
});

app.get('/api/admin/coupons', requireAuth, requireAdmin, (_req, res) => {
  const coupons = db
    .prepare(
      `SELECT id,
              code,
              description,
              discount_type AS discountType,
              discount_value AS discountValue,
              applies_to AS appliesTo,
              max_redemptions AS maxRedemptions,
              per_user_limit AS perUserLimit,
              expires_at AS expiresAt,
              active,
              recipient_email AS recipientEmail,
              recipient_name AS recipientName,
              emailed_at AS emailedAt,
              email_status AS emailStatus,
              email_error AS emailError,
              created_at AS createdAt
       FROM coupons
       ORDER BY active DESC, datetime(created_at) DESC, id DESC`
    )
    .all()
    .map((row) => {
      const stats = getCouponRedemptionStats(row.id, -1);
      return {
        id: Number(row.id),
        code: row.code || '',
        description: row.description || '',
        discountType: row.discountType || 'percent',
        discountValue: Number(row.discountValue || 0),
        appliesTo: row.appliesTo || 'all',
        maxRedemptions: row.maxRedemptions == null ? null : Number(row.maxRedemptions),
        perUserLimit: Number(row.perUserLimit || 1),
        expiresAt: row.expiresAt || null,
        active: Number(row.active || 0) === 1,
        recipientEmail: row.recipientEmail || '',
        recipientName: row.recipientName || '',
        emailedAt: row.emailedAt || null,
        emailStatus: row.emailStatus || '',
        emailError: row.emailError || '',
        createdAt: row.createdAt || null,
        totalRedemptions: Number(stats.total || 0),
      };
    });

  res.json({ coupons });
});

app.post('/api/admin/coupons', requireAuth, requireAdmin, async (req, res) => {
  let code = normalizeCouponCode(req.body?.code);
  const description = String(req.body?.description || '').trim();
  const discountType = String(req.body?.discountType || 'percent').trim().toLowerCase();
  const discountValue = Number(req.body?.discountValue || 0);
  const appliesTo = 'all';
  const recipientEmail = String(req.body?.recipientEmail || '').trim().toLowerCase();
  const sendEmail = req.body?.sendEmail !== false;
  const singleUse = Boolean(req.body?.singleUse) || Boolean(recipientEmail);
  const maxRedemptionsRaw = req.body?.maxRedemptions;
  let maxRedemptions =
    maxRedemptionsRaw === '' || maxRedemptionsRaw == null ? null : Number(maxRedemptionsRaw);
  const expiresAt = String(req.body?.expiresAt || '').trim();

  if (!code) {
    code = generateUniqueCouponCode();
  }
  if (!['percent', 'flat'].includes(discountType)) {
    return res.status(400).json({ message: 'discountType must be percent or flat.' });
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return res.status(400).json({ message: 'discountValue must be greater than 0.' });
  }
  if (discountType === 'percent' && discountValue > 100) {
    return res.status(400).json({ message: 'Percent coupons cannot exceed 100.' });
  }
  if (recipientEmail && !isValidEmail(recipientEmail)) {
    return res.status(400).json({ message: 'recipientEmail must be a valid email.' });
  }
  if (sendEmail && !recipientEmail) {
    return res.status(400).json({ message: 'recipientEmail is required to send the coupon.' });
  }
  if (singleUse) {
    maxRedemptions = 1;
  }
  if (maxRedemptions != null && (!Number.isInteger(maxRedemptions) || maxRedemptions <= 0)) {
    return res.status(400).json({ message: 'maxRedemptions must be a positive integer.' });
  }
  if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
    return res.status(400).json({ message: 'expiresAt must be a valid date.' });
  }

  const recipient = recipientEmail ? getUserByEmail(recipientEmail) : null;
  const recipientName = recipient?.name || '';
  const initialEmailStatus = sendEmail ? 'pending' : 'draft';

  db.prepare(
    `INSERT INTO coupons (
      code, description, discount_type, discount_value, applies_to, max_redemptions, per_user_limit, expires_at, active,
      recipient_email, recipient_name, emailed_at, email_status, email_error, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, 1, ?, ?, NULL, ?, ?, datetime('now'))
    ON CONFLICT(code) DO UPDATE SET
      description = excluded.description,
      discount_type = excluded.discount_type,
      discount_value = excluded.discount_value,
      applies_to = excluded.applies_to,
      max_redemptions = excluded.max_redemptions,
      per_user_limit = excluded.per_user_limit,
      expires_at = excluded.expires_at,
      recipient_email = excluded.recipient_email,
      recipient_name = excluded.recipient_name,
      email_status = excluded.email_status,
      email_error = excluded.email_error,
      active = 1`
  ).run(
    code,
    description,
    discountType,
    discountValue,
    appliesTo,
    maxRedemptions,
    expiresAt || null,
    recipientEmail || null,
    recipientName || null,
    initialEmailStatus,
    ''
  );

  let emailStatus = initialEmailStatus;
  let emailMessage = '';
  if (sendEmail && recipientEmail) {
    const emailResult = await sendCouponEmail({
      toEmail: recipientEmail,
      recipientName,
      code,
      discountValue,
      appliesTo,
      expiresAt,
    });
    if (!emailResult.ok) {
      emailStatus = 'failed';
      emailMessage = emailResult.message || 'Unable to send email.';
      db.prepare(
        `UPDATE coupons
         SET email_status = ?, email_error = ?, emailed_at = NULL
         WHERE code = ?`
      ).run(emailStatus, emailMessage, code);
    } else {
      emailStatus = 'sent';
      db.prepare(
        `UPDATE coupons
         SET email_status = ?, email_error = '', emailed_at = datetime('now')
         WHERE code = ?`
      ).run(emailStatus, code);
    }
  }

  res.status(201).json({
    message: 'Coupon saved.',
    code,
    emailStatus,
    emailMessage,
  });
});

app.delete('/api/admin/coupons/:id', requireAuth, requireAdmin, (req, res) => {
  const couponId = Number(req.params.id);
  if (!Number.isInteger(couponId)) {
    return res.status(400).json({ message: 'Invalid coupon id.' });
  }

  db.prepare('DELETE FROM coupons WHERE id = ?').run(couponId);
  res.json({ message: 'Coupon removed.' });
});

app.post('/api/admin/coupons/:id/resend', requireAuth, requireAdmin, async (req, res) => {
  const couponId = Number(req.params.id);
  if (!Number.isInteger(couponId)) {
    return res.status(400).json({ message: 'Invalid coupon id.' });
  }

  const coupon = getCouponById(couponId);
  if (!coupon) {
    return res.status(404).json({ message: 'Coupon not found.' });
  }

  const recipientEmail = String(req.body?.recipientEmail || coupon.recipientEmail || '').trim().toLowerCase();
  if (!recipientEmail || !isValidEmail(recipientEmail)) {
    return res.status(400).json({ message: 'Valid recipientEmail is required.' });
  }

  const recipient = getUserByEmail(recipientEmail);
  const recipientName = recipient?.name || coupon.recipientName || '';
  const emailResult = await sendCouponEmail({
    toEmail: recipientEmail,
    recipientName,
    code: coupon.code,
    discountValue: coupon.discountValue,
    appliesTo: coupon.appliesTo,
    expiresAt: coupon.expiresAt,
  });

  if (!emailResult.ok) {
    const message = emailResult.message || 'Unable to send email.';
    db.prepare(
      `UPDATE coupons
       SET recipient_email = ?, recipient_name = ?, email_status = ?, email_error = ?, emailed_at = NULL
       WHERE id = ?`
    ).run(recipientEmail, recipientName || null, 'failed', message, couponId);
    return res.status(500).json({ message });
  }

  db.prepare(
    `UPDATE coupons
     SET recipient_email = ?, recipient_name = ?, email_status = ?, email_error = '', emailed_at = datetime('now')
     WHERE id = ?`
  ).run(recipientEmail, recipientName || null, 'sent', couponId);

  res.json({ message: 'Coupon emailed.', emailStatus: 'sent' });
});

app.patch('/api/admin/doctors/:id/approval', requireAuth, requireAdmin, (req, res) => {
  const doctorId = Number(req.params.id);
  const approvalStatus = String(req.body?.approvalStatus || '').trim().toLowerCase();

  if (!Number.isInteger(doctorId)) {
    return res.status(400).json({ message: 'invalid doctor id' });
  }
  if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
    return res.status(400).json({ message: 'approvalStatus must be pending/approved/rejected' });
  }

  const existing = db.prepare('SELECT id FROM doctors WHERE id = ?').get(doctorId);
  if (!existing) {
    return res.status(404).json({ message: 'doctor not found' });
  }

  db.prepare('UPDATE doctors SET approval_status = ? WHERE id = ?').run(approvalStatus, doctorId);
  const doctor = db
    .prepare(
      `SELECT id, user_id AS userId, name, specialty, bio, experience_years AS experienceYears,
              consultation_fee AS consultationFee, available_days AS availableDays,
              approval_status AS approvalStatus, created_at AS createdAt
       FROM doctors
       WHERE id = ?`
    )
    .get(doctorId);

  res.json({ doctor });
});

app.post('/api/admin/doctors', requireAuth, requireAdmin, (req, res) => {
  const payload = validateDoctorPayload(req.body);
  if (payload.error) return res.status(400).json({ message: payload.error });

  const result = db
    .prepare(
      `INSERT INTO doctors (
        name, specialty, bio, experience_years, consultation_fee, available_days, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(
      payload.data.name,
      payload.data.specialty,
      payload.data.bio,
      payload.data.experienceYears,
      payload.data.consultationFee,
      payload.data.availableDays
    );

  const doctor = db
    .prepare(
      `SELECT id, name, specialty, bio, experience_years AS experienceYears,
              consultation_fee AS consultationFee, available_days AS availableDays, created_at AS createdAt
       FROM doctors WHERE id = ?`
    )
    .get(result.lastInsertRowid);

  res.status(201).json({ doctor });
});

app.put('/api/admin/doctors/:id', requireAuth, requireAdmin, (req, res) => {
  const doctorId = Number(req.params.id);
  if (!Number.isInteger(doctorId)) {
    return res.status(400).json({ message: 'invalid doctor id' });
  }

  const existing = db.prepare('SELECT id FROM doctors WHERE id = ?').get(doctorId);
  if (!existing) {
    return res.status(404).json({ message: 'doctor not found' });
  }

  const payload = validateDoctorPayload(req.body);
  if (payload.error) return res.status(400).json({ message: payload.error });

  db.prepare(
    `UPDATE doctors
     SET name = ?, specialty = ?, bio = ?, experience_years = ?, consultation_fee = ?, available_days = ?
     WHERE id = ?`
  ).run(
    payload.data.name,
    payload.data.specialty,
    payload.data.bio,
    payload.data.experienceYears,
    payload.data.consultationFee,
    payload.data.availableDays,
    doctorId
  );

  const doctor = db
    .prepare(
      `SELECT id, name, specialty, bio, experience_years AS experienceYears,
              consultation_fee AS consultationFee, available_days AS availableDays, created_at AS createdAt
       FROM doctors WHERE id = ?`
    )
    .get(doctorId);

  res.json({ doctor });
});

app.delete('/api/admin/doctors/:id', requireAuth, requireAdmin, (req, res) => {
  const doctorId = Number(req.params.id);
  if (!Number.isInteger(doctorId)) {
    return res.status(400).json({ message: 'invalid doctor id' });
  }

  const existing = db.prepare('SELECT id FROM doctors WHERE id = ?').get(doctorId);
  if (!existing) {
    return res.status(404).json({ message: 'doctor not found' });
  }

  const activeBooking = db
    .prepare(
      `SELECT id
       FROM bookings
       WHERE doctor_id = ?
         AND status IN ('pending', 'booked', 'confirmed')
       LIMIT 1`
    )
    .get(doctorId);

  if (activeBooking) {
    return res.status(409).json({ message: 'cannot delete doctor with active bookings' });
  }

  db.prepare('DELETE FROM doctors WHERE id = ?').run(doctorId);
  res.status(204).send();
});

app.get('/api/bookings', requireAuth, (req, res) => {
  const baseQuery = `
    SELECT b.id,
           b.user_id AS userId,
           b.booking_group_id AS bookingGroupId,
           u.name AS clientName,
           u.email AS clientEmail,
           u.mobile AS clientMobile,
           u.age AS clientAge,
           u.gender AS clientGender,
           b.service_name AS serviceName,
           b.booking_date AS bookingDate,
           b.booking_time AS bookingTime,
           b.status,
           b.payment_status AS paymentStatus,
           b.paid_at AS paidAt,
           b.notes,
           b.created_at AS createdAt
    FROM bookings b
    JOIN users u ON u.id = b.user_id
  `;

  const rows = req.user.role === 'admin'
    ? db.prepare(`${baseQuery} ORDER BY b.booking_date, b.booking_time`).all()
    : db
        .prepare(`${baseQuery} WHERE b.user_id = ? ORDER BY b.booking_date, b.booking_time`)
        .all(req.user.id);

  res.json({ bookings: rows.map(applyHoldMeta) });
});

app.get('/api/doctor/bookings', requireAuth, requireDoctor, (req, res) => {
  return res.status(410).json({ message: 'Doctor bookings are currently disabled.' });
});

app.post('/api/bookings', requireAuth, (req, res) => {
  const requestRole = String(req.user?.role || '').trim().toLowerCase();
  if (requestRole === 'admin') {
    const resolvedCustomer = resolveAdminCustomerContext({
      userId: req.body?.userId,
      customerName: req.body?.customerName,
      customerEmail: req.body?.customerEmail,
      customerPhone: req.body?.customerPhone,
      createIfMissing: true,
    });
    if (resolvedCustomer.error) {
      return res.status(400).json({ message: resolvedCustomer.error });
    }
    return createSingleBookingResponse(req, res, {
      targetUser: resolvedCustomer.user,
      defaultNotes: 'Booked by admin',
      includeAdminMeta: true,
    });
  }

  return createSingleBookingResponse(req, res, {
    targetUser: req.user,
    defaultNotes: '',
    includeAdminMeta: false,
  });
});

app.post('/api/admin/bookings', requireAuth, requireAdmin, (req, res) => {
  const resolvedCustomer = resolveAdminCustomerContext({
    userId: req.body?.userId,
    customerName: req.body?.customerName,
    customerEmail: req.body?.customerEmail,
    customerPhone: req.body?.customerPhone,
    createIfMissing: true,
  });
  if (resolvedCustomer.error) {
    return res.status(400).json({ message: resolvedCustomer.error });
  }
  return createSingleBookingResponse(req, res, {
    targetUser: resolvedCustomer.user,
    defaultNotes: 'Booked by admin',
    includeAdminMeta: true,
  });
});

app.post('/api/hydrogen/create-order', requireAuth, async (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'only users can create hydrogen bookings' });
  }
  if (!razorpay) {
    return res.status(503).json({ message: RAZORPAY_UNAVAILABLE_MESSAGE });
  }

  const serviceName = String(req.body?.serviceName || '').trim();
  const service = getServiceByName(serviceName);
  if (!service || String(service.category || '').toUpperCase() !== 'HYDROGEN SESSION') {
    return res.status(400).json({ message: 'Invalid hydrogen package selected.' });
  }

  const packageSessions = getHydrogenSessionCountFromServiceName(service.name);
  const extraSessions = Number(req.body?.extraSessions ?? 0);
  if (!Number.isInteger(extraSessions) || extraSessions < 0) {
    return res.status(400).json({ message: 'extraSessions must be a non-negative integer' });
  }

  const totalSessions = packageSessions + extraSessions;
  const slots = Array.isArray(req.body?.slots) ? req.body.slots : [];
  if (slots.length !== totalSessions) {
    return res.status(400).json({ message: `Please select exactly ${totalSessions} slots.` });
  }

  const normalizedSlots = [];
  for (const slot of slots) {
    const bookingDate = String(slot?.bookingDate || '').trim();
    const bookingTime = String(slot?.bookingTime || '').trim();
    const selectedDate = new Date(`${bookingDate}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: `Invalid bookingDate: ${bookingDate}` });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({ message: 'bookingDate cannot be in the past' });
    }
    if (!ALLOWED_SLOT_START_TIMES.includes(bookingTime)) {
      return res.status(400).json({ message: `Invalid bookingTime: ${bookingTime}` });
    }
    if (isBookingSlotInPast(bookingDate, bookingTime)) {
      return res.status(400).json({ message: `bookingTime cannot be in the past for ${bookingDate}` });
    }
    normalizedSlots.push({ bookingDate, bookingTime });
  }

  const packagePriceInr = getEffectiveServicePriceInr(service, req.user);
  const singleSessionService =
    SERVICE_CATALOG.find(
      (item) =>
        String(item.category || '').toUpperCase() === 'HYDROGEN SESSION' &&
        getHydrogenSessionCountFromServiceName(item.name) === 1
    ) || service;
  const extraSessionPriceInr = getEffectiveServicePriceInr(singleSessionService, req.user);
  const addOnServiceName = String(req.body?.addOnServiceName || '').trim();
  const addOnSessionIndexRaw = req.body?.addOnSessionIndex;
  let addOnService = null;
  let addOnSessionIndex = null;
  if (addOnServiceName) {
    addOnService = getServiceByName(addOnServiceName);
    if (!addOnService || !isAddOnService(addOnService)) {
      return res.status(400).json({ message: 'Invalid add-on selected. Choose one IV Therapy or IV Shot.' });
    }
    addOnSessionIndex = Number(addOnSessionIndexRaw);
    if (!Number.isInteger(addOnSessionIndex) || addOnSessionIndex < 0 || addOnSessionIndex >= totalSessions) {
      return res.status(400).json({ message: 'addOnSessionIndex must point to a valid session.' });
    }
  }
  const addOnPriceInr = addOnService ? getEffectiveServicePriceInr(addOnService, req.user) : 0;
  const totalAmountInr =
    Number(packagePriceInr || 0) + Number(extraSessionPriceInr || 0) * extraSessions + Number(addOnPriceInr || 0);
  const hydrogenDailyLimitConflict = validateHydrogenDailySessionLimit(req.user.id, normalizedSlots);
  if (hydrogenDailyLimitConflict) {
    return res.status(409).json({
      message: `Only ${hydrogenDailyLimitConflict.maxAllowed} hydrogen sessions can be booked in one day.`,
    });
  }
  if (addOnService) {
    const addOnSlot = normalizedSlots[addOnSessionIndex];
    const cooldownConflict = findIvCooldownConflict(req.user.id, addOnService.name, addOnSlot?.bookingDate);
    if (cooldownConflict) {
      return res.status(409).json({
        message: getIvCooldownResponseMessage(cooldownConflict),
      });
    }
  }
  const amountInPaise = Math.max(100, Math.round(totalAmountInr * 100));

  try {
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: buildRazorpayReceipt('hydrogen', req.user.id),
      notes: {
        userId: String(req.user.id),
        serviceName: service.name,
        sessions: String(totalSessions),
      },
    });

    const insertBooking = db.prepare(
      `INSERT INTO bookings (
        user_id, doctor_id, client_name, client_email, client_phone,
        service_name, booking_date, booking_time, assigned_staff, status, payment_status, payment_order_id, booking_group_id, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'payment_pending', ?, ?, ?, ?)`
    );
    const countActiveForSlot = db.prepare(
      `SELECT
          SUM(CASE WHEN ${activeBookingSql()} THEN 1 ELSE 0 END) AS activeTotal,
          SUM(CASE WHEN ${holdBookingSql()} THEN 1 ELSE 0 END) AS holdTotal
       FROM bookings
       WHERE service_name = ?
         AND booking_date = ?
         AND booking_time = ?
         AND status IN ('pending', 'booked', 'confirmed')`
    );
    const maxPerSlot = getSlotCapacityForServiceName(service.name);
    const inRequestCounter = new Map();
    const bookingGroupId = createBookingGroupId('hydrogen');
    let addOnSummary = null;

    const txn = db.transaction((entries) => {
      for (const entry of entries) {
        const key = `${entry.bookingDate}|${entry.bookingTime}`;
        const alreadyInRequest = Number(inRequestCounter.get(key) || 0);
        const slotStats = countActiveForSlot.get(service.name, entry.bookingDate, entry.bookingTime) || {};
        const existing = Number(slotStats.activeTotal || 0);
        const holdCount = Number(slotStats.holdTotal || 0);
        if (existing + alreadyInRequest >= maxPerSlot) {
          throw new Error(holdCount > 0 ? buildHoldSlotMessage() : `Slot full for ${entry.bookingDate} ${entry.bookingTime}`);
        }
        inRequestCounter.set(key, alreadyInRequest + 1);

        insertBooking.run(
          req.user.id,
          null,
          req.user.name,
          req.user.email,
          req.user.mobile || '-',
          service.name,
          entry.bookingDate,
          entry.bookingTime,
          'H2 House Of Health',
          order.id,
          bookingGroupId,
          `Hydrogen package ${packageSessions} + extra ${extraSessions}`,
          getCurrentSqliteTimestamp()
        );
      }

      if (addOnService) {
        const addOnSlot = entries[addOnSessionIndex];
        if (!addOnSlot) {
          throw new Error('Invalid add-on session selection');
        }
        if (hasStandaloneIvBookingOnDate(req.user.id, addOnSlot.bookingDate)) {
          throw new Error(
            'A separate IV Therapy/IV Shot is already booked on this date. Hydrogen packages with an IV add-on cannot be combined with separate IV bookings on the same day.'
          );
        }
        if (hasConflictingAddOnBooking(req.user.id, addOnSlot.bookingDate, addOnSlot.bookingTime)) {
          throw new Error(
            'Only 1 IV add-on (IV Therapy or IV Shot) can be booked in the same time slot. Additional add-ons are handled by admin after consultation.'
          );
        }
        const addOnStats = countActiveForSlot.get(addOnService.name, addOnSlot.bookingDate, addOnSlot.bookingTime) || {};
        const existingAddOn = Number(addOnStats.activeTotal || 0);
        const holdAddOn = Number(addOnStats.holdTotal || 0);
        const addOnCapacity = getSlotCapacityForServiceName(addOnService.name);
        if (existingAddOn >= addOnCapacity) {
          throw new Error(holdAddOn > 0 ? buildHoldSlotMessage() : `Add-on slot full for ${addOnSlot.bookingDate} ${addOnSlot.bookingTime}`);
        }

        insertBooking.run(
          req.user.id,
          null,
          req.user.name,
          req.user.email,
          req.user.mobile || '-',
          addOnService.name,
          addOnSlot.bookingDate,
          addOnSlot.bookingTime,
          'H2 House Of Health',
          order.id,
          bookingGroupId,
          `IV add-on for ${service.name} (Session ${addOnSessionIndex + 1})`,
          getCurrentSqliteTimestamp()
        );

        addOnSummary = {
          serviceName: addOnService.name,
          bookingDate: addOnSlot.bookingDate,
          bookingTime: addOnSlot.bookingTime,
          sessionNumber: addOnSessionIndex + 1,
          amountInr: Number(addOnPriceInr || 0),
        };
      }
    });

    txn(normalizedSlots);

    return res.json({
      keyId: RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      totalSessions,
      amountInr: totalAmountInr,
      summary: {
        packagePriceInr,
        extraSessionPriceInr,
        extraSessions,
        addOn: addOnSummary,
        totalAmountInr,
      },
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    return res.status(409).json({ message: error?.message || 'Unable to prepare hydrogen order' });
  }
});

app.post('/api/hydrogen/book-pack', requireAuth, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'only users can create hydrogen bookings' });
  }

  const serviceName = String(req.body?.serviceName || '').trim();
  const service = getServiceByName(serviceName);
  if (!service || String(service.category || '').toUpperCase() !== 'HYDROGEN SESSION') {
    return res.status(400).json({ message: 'Invalid hydrogen package selected.' });
  }

  const packageSessions = getHydrogenSessionCountFromServiceName(service.name);
  const extraSessions = Number(req.body?.extraSessions ?? 0);
  if (!Number.isInteger(extraSessions) || extraSessions < 0) {
    return res.status(400).json({ message: 'extraSessions must be a non-negative integer' });
  }

  const totalSessions = packageSessions + extraSessions;
  const slots = Array.isArray(req.body?.slots) ? req.body.slots : [];
  if (slots.length !== totalSessions) {
    return res.status(400).json({ message: `Please select exactly ${totalSessions} slots.` });
  }

  const normalizedSlots = [];
  for (const slot of slots) {
    const bookingDate = String(slot?.bookingDate || '').trim();
    const bookingTime = String(slot?.bookingTime || '').trim();
    const selectedDate = new Date(`${bookingDate}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: `Invalid bookingDate: ${bookingDate}` });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({ message: 'bookingDate cannot be in the past' });
    }
    if (!ALLOWED_SLOT_START_TIMES.includes(bookingTime)) {
      return res.status(400).json({ message: `Invalid bookingTime: ${bookingTime}` });
    }
    if (isBookingSlotInPast(bookingDate, bookingTime)) {
      return res.status(400).json({ message: `bookingTime cannot be in the past for ${bookingDate}` });
    }
    normalizedSlots.push({ bookingDate, bookingTime });
  }

  const packagePriceInr = getEffectiveServicePriceInr(service, req.user);
  const singleSessionService =
    SERVICE_CATALOG.find(
      (item) =>
        String(item.category || '').toUpperCase() === 'HYDROGEN SESSION' &&
        getHydrogenSessionCountFromServiceName(item.name) === 1
    ) || service;
  const extraSessionPriceInr = getEffectiveServicePriceInr(singleSessionService, req.user);
  const addOnServiceName = String(req.body?.addOnServiceName || '').trim();
  const addOnSessionIndexRaw = req.body?.addOnSessionIndex;
  let addOnService = null;
  let addOnSessionIndex = null;
  if (addOnServiceName) {
    addOnService = getServiceByName(addOnServiceName);
    if (!addOnService || !isAddOnService(addOnService)) {
      return res.status(400).json({ message: 'Invalid add-on selected. Choose one IV Therapy or IV Shot.' });
    }
    addOnSessionIndex = Number(addOnSessionIndexRaw);
    if (!Number.isInteger(addOnSessionIndex) || addOnSessionIndex < 0 || addOnSessionIndex >= totalSessions) {
      return res.status(400).json({ message: 'addOnSessionIndex must point to a valid session.' });
    }
  }
  const addOnPriceInr = addOnService ? getEffectiveServicePriceInr(addOnService, req.user) : 0;
  const totalAmountInr =
    Number(packagePriceInr || 0) + Number(extraSessionPriceInr || 0) * extraSessions + Number(addOnPriceInr || 0);
  const hydrogenDailyLimitConflict = validateHydrogenDailySessionLimit(req.user.id, normalizedSlots);
  if (hydrogenDailyLimitConflict) {
    return res.status(409).json({
      message: `Only ${hydrogenDailyLimitConflict.maxAllowed} hydrogen sessions can be booked in one day.`,
    });
  }
  if (addOnService) {
    const addOnSlot = normalizedSlots[addOnSessionIndex];
    const cooldownConflict = findIvCooldownConflict(req.user.id, addOnService.name, addOnSlot?.bookingDate);
    if (cooldownConflict) {
      return res.status(409).json({
        message: getIvCooldownResponseMessage(cooldownConflict),
      });
    }
  }

  try {
    const bookingGroupId = createBookingGroupId('hydrogen');
    const insertBooking = db.prepare(
      `INSERT INTO bookings (
        user_id, doctor_id, client_name, client_email, client_phone,
        service_name, booking_date, booking_time, assigned_staff, status, payment_status, booking_group_id, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?, ?, ?)`
    );
    const countActiveForSlot = db.prepare(
      `SELECT
          SUM(CASE WHEN ${activeBookingSql()} THEN 1 ELSE 0 END) AS activeTotal,
          SUM(CASE WHEN ${holdBookingSql()} THEN 1 ELSE 0 END) AS holdTotal
       FROM bookings
       WHERE service_name = ?
         AND booking_date = ?
         AND booking_time = ?
         AND status IN ('pending', 'booked', 'confirmed')`
    );
    const maxPerSlot = getSlotCapacityForServiceName(service.name);
    const inRequestCounter = new Map();
    const createdIds = [];
    let addOnSummary = null;

    const txn = db.transaction((entries) => {
      for (const entry of entries) {
        const key = `${entry.bookingDate}|${entry.bookingTime}`;
        const alreadyInRequest = Number(inRequestCounter.get(key) || 0);
        const slotStats = countActiveForSlot.get(service.name, entry.bookingDate, entry.bookingTime) || {};
        const existing = Number(slotStats.activeTotal || 0);
        const holdCount = Number(slotStats.holdTotal || 0);
        if (existing + alreadyInRequest >= maxPerSlot) {
          throw new Error(holdCount > 0 ? buildHoldSlotMessage() : `Slot full for ${entry.bookingDate} ${entry.bookingTime}`);
        }
        inRequestCounter.set(key, alreadyInRequest + 1);

        const result = insertBooking.run(
          req.user.id,
          null,
          req.user.name,
          req.user.email,
          req.user.mobile || '-',
          service.name,
          entry.bookingDate,
          entry.bookingTime,
          'H2 House Of Health',
          bookingGroupId,
          `Hydrogen package ${packageSessions} + extra ${extraSessions}`,
          getCurrentSqliteTimestamp()
        );
        createdIds.push(Number(result.lastInsertRowid));
      }

      if (addOnService) {
        const addOnSlot = entries[addOnSessionIndex];
        if (!addOnSlot) {
          throw new Error('Invalid add-on session selection');
        }
        if (hasStandaloneIvBookingOnDate(req.user.id, addOnSlot.bookingDate)) {
          throw new Error(
            'A separate IV Therapy/IV Shot is already booked on this date. Hydrogen packages with an IV add-on cannot be combined with separate IV bookings on the same day.'
          );
        }
        if (hasConflictingAddOnBooking(req.user.id, addOnSlot.bookingDate, addOnSlot.bookingTime)) {
          throw new Error(
            'Only 1 IV add-on (IV Therapy or IV Shot) can be booked in the same time slot. Additional add-ons are handled by admin after consultation.'
          );
        }
        const addOnStats = countActiveForSlot.get(addOnService.name, addOnSlot.bookingDate, addOnSlot.bookingTime) || {};
        const existingAddOn = Number(addOnStats.activeTotal || 0);
        const holdAddOn = Number(addOnStats.holdTotal || 0);
        const addOnCapacity = getSlotCapacityForServiceName(addOnService.name);
        if (existingAddOn >= addOnCapacity) {
          throw new Error(holdAddOn > 0 ? buildHoldSlotMessage() : `Add-on slot full for ${addOnSlot.bookingDate} ${addOnSlot.bookingTime}`);
        }

        const addOnResult = insertBooking.run(
          req.user.id,
          null,
          req.user.name,
          req.user.email,
          req.user.mobile || '-',
          addOnService.name,
          addOnSlot.bookingDate,
          addOnSlot.bookingTime,
          'H2 House Of Health',
          bookingGroupId,
          `IV add-on for ${service.name} (Session ${addOnSessionIndex + 1})`,
          getCurrentSqliteTimestamp()
        );
        createdIds.push(Number(addOnResult.lastInsertRowid));
        addOnSummary = {
          serviceName: addOnService.name,
          bookingDate: addOnSlot.bookingDate,
          bookingTime: addOnSlot.bookingTime,
          sessionNumber: addOnSessionIndex + 1,
          amountInr: Number(addOnPriceInr || 0),
        };
      }
    });

    txn(normalizedSlots);

    const bookings = db
      .prepare(
        `SELECT b.id, b.service_name AS serviceName, b.booking_date AS bookingDate, b.booking_time AS bookingTime, b.status, b.payment_status AS paymentStatus
         FROM bookings b
         WHERE b.id IN (${createdIds.map(() => '?').join(', ')})
         ORDER BY b.booking_date, b.booking_time`
      )
      .all(...createdIds);

    return res.status(201).json({
      message: 'Hydrogen bookings saved successfully.',
      summary: {
        serviceName: service.name,
        packageSessions,
        extraSessions,
        totalSessions,
        totalAmountInr,
        addOn: addOnSummary,
      },
      bookings,
    });
  } catch (error) {
    return res.status(409).json({ message: error?.message || 'Unable to save hydrogen bookings' });
  }
});

app.post('/api/admin/hydrogen/book-pack', requireAuth, requireAdmin, (req, res) => {
  const resolvedCustomer = resolveAdminCustomerContext({
    userId: req.body?.userId,
    customerName: req.body?.customerName,
    customerEmail: req.body?.customerEmail,
    customerPhone: req.body?.customerPhone,
    createIfMissing: true,
  });
  if (resolvedCustomer.error) {
    return res.status(400).json({ message: resolvedCustomer.error });
  }
  const targetUser = resolvedCustomer.user;

  const serviceName = String(req.body?.serviceName || '').trim();
  const service = getServiceByName(serviceName);
  if (!service || String(service.category || '').toUpperCase() !== 'HYDROGEN SESSION') {
    return res.status(400).json({ message: 'Invalid hydrogen package selected.' });
  }

  const packageSessions = getHydrogenSessionCountFromServiceName(service.name);
  const extraSessions = Number(req.body?.extraSessions ?? 0);
  if (!Number.isInteger(extraSessions) || extraSessions < 0) {
    return res.status(400).json({ message: 'extraSessions must be a non-negative integer' });
  }

  const totalSessions = packageSessions + extraSessions;
  const slots = Array.isArray(req.body?.slots) ? req.body.slots : [];
  if (slots.length !== totalSessions) {
    return res.status(400).json({ message: `Please select exactly ${totalSessions} slots.` });
  }

  const normalizedSlots = [];
  for (const slot of slots) {
    const bookingDate = String(slot?.bookingDate || '').trim();
    const bookingTime = String(slot?.bookingTime || '').trim();
    const selectedDate = new Date(`${bookingDate}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: `Invalid bookingDate: ${bookingDate}` });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({ message: 'bookingDate cannot be in the past' });
    }
    if (!ALLOWED_SLOT_START_TIMES.includes(bookingTime)) {
      return res.status(400).json({ message: `Invalid bookingTime: ${bookingTime}` });
    }
    if (isBookingSlotInPast(bookingDate, bookingTime)) {
      return res.status(400).json({ message: `bookingTime cannot be in the past for ${bookingDate}` });
    }
    normalizedSlots.push({ bookingDate, bookingTime });
  }

  const packagePriceInr = getEffectiveServicePriceInr(service, targetUser);
  const singleSessionService =
    SERVICE_CATALOG.find(
      (item) =>
        String(item.category || '').toUpperCase() === 'HYDROGEN SESSION' &&
        getHydrogenSessionCountFromServiceName(item.name) === 1
    ) || service;
  const extraSessionPriceInr = getEffectiveServicePriceInr(singleSessionService, targetUser);
  const addOnServiceName = String(req.body?.addOnServiceName || '').trim();
  const addOnSessionIndexRaw = req.body?.addOnSessionIndex;
  let addOnService = null;
  let addOnSessionIndex = null;
  if (addOnServiceName) {
    addOnService = getServiceByName(addOnServiceName);
    if (!addOnService || !isAddOnService(addOnService)) {
      return res.status(400).json({ message: 'Invalid add-on selected. Choose one IV Therapy or IV Shot.' });
    }
    addOnSessionIndex = Number(addOnSessionIndexRaw);
    if (!Number.isInteger(addOnSessionIndex) || addOnSessionIndex < 0 || addOnSessionIndex >= totalSessions) {
      return res.status(400).json({ message: 'addOnSessionIndex must point to a valid session.' });
    }
  }
  const addOnPriceInr = addOnService ? getEffectiveServicePriceInr(addOnService, targetUser) : 0;
  const totalAmountInr =
    Number(packagePriceInr || 0) + Number(extraSessionPriceInr || 0) * extraSessions + Number(addOnPriceInr || 0);
  const hydrogenDailyLimitConflict = validateHydrogenDailySessionLimit(targetUser.id, normalizedSlots);
  if (hydrogenDailyLimitConflict) {
    return res.status(409).json({
      message: `Only ${hydrogenDailyLimitConflict.maxAllowed} hydrogen sessions can be booked in one day.`,
    });
  }

  try {
    const bookingGroupId = createBookingGroupId('hydrogen');
    const insertBooking = db.prepare(
      `INSERT INTO bookings (
        user_id, doctor_id, client_name, client_email, client_phone,
        service_name, booking_date, booking_time, assigned_staff, status, payment_status, booking_group_id, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?, ?, ?)`
    );
    const countActiveForSlot = db.prepare(
      `SELECT
          SUM(CASE WHEN ${activeBookingSql()} THEN 1 ELSE 0 END) AS activeTotal,
          SUM(CASE WHEN ${holdBookingSql()} THEN 1 ELSE 0 END) AS holdTotal
       FROM bookings
       WHERE service_name = ?
         AND booking_date = ?
         AND booking_time = ?
         AND status IN ('pending', 'booked', 'confirmed')`
    );
    const maxPerSlot = getSlotCapacityForServiceName(service.name);
    const inRequestCounter = new Map();
    const createdIds = [];
    let addOnSummary = null;

    const txn = db.transaction((entries) => {
      for (const entry of entries) {
        const key = `${entry.bookingDate}|${entry.bookingTime}`;
        const alreadyInRequest = Number(inRequestCounter.get(key) || 0);
        const slotStats = countActiveForSlot.get(service.name, entry.bookingDate, entry.bookingTime) || {};
        const existing = Number(slotStats.activeTotal || 0);
        const holdCount = Number(slotStats.holdTotal || 0);
        if (existing + alreadyInRequest >= maxPerSlot) {
          throw new Error(holdCount > 0 ? buildHoldSlotMessage() : `Slot full for ${entry.bookingDate} ${entry.bookingTime}`);
        }
        inRequestCounter.set(key, alreadyInRequest + 1);

        const result = insertBooking.run(
          targetUser.id,
          null,
          targetUser.name,
          targetUser.email,
          targetUser.mobile || '-',
          service.name,
          entry.bookingDate,
          entry.bookingTime,
          'H2 House Of Health',
          bookingGroupId,
          `Hydrogen package ${packageSessions} + extra ${extraSessions} (booked by admin)`,
          getCurrentSqliteTimestamp()
        );
        createdIds.push(Number(result.lastInsertRowid));
      }

      if (addOnService) {
        const addOnSlot = entries[addOnSessionIndex];
        if (!addOnSlot) {
          throw new Error('Invalid add-on session selection');
        }
        if (hasStandaloneIvBookingOnDate(targetUser.id, addOnSlot.bookingDate)) {
          throw new Error(
            'A separate IV Therapy/IV Shot is already booked on this date. Hydrogen packages with an IV add-on cannot be combined with separate IV bookings on the same day.'
          );
        }
        if (hasConflictingAddOnBooking(targetUser.id, addOnSlot.bookingDate, addOnSlot.bookingTime)) {
          throw new Error(
            'Only 1 IV add-on (IV Therapy or IV Shot) can be booked in the same time slot. Additional add-ons are handled by admin after consultation.'
          );
        }
        const addOnStats = countActiveForSlot.get(addOnService.name, addOnSlot.bookingDate, addOnSlot.bookingTime) || {};
        const existingAddOn = Number(addOnStats.activeTotal || 0);
        const holdAddOn = Number(addOnStats.holdTotal || 0);
        const addOnCapacity = getSlotCapacityForServiceName(addOnService.name);
        if (existingAddOn >= addOnCapacity) {
          throw new Error(holdAddOn > 0 ? buildHoldSlotMessage() : `Add-on slot full for ${addOnSlot.bookingDate} ${addOnSlot.bookingTime}`);
        }

        const addOnResult = insertBooking.run(
          targetUser.id,
          null,
          targetUser.name,
          targetUser.email,
          targetUser.mobile || '-',
          addOnService.name,
          addOnSlot.bookingDate,
          addOnSlot.bookingTime,
          'H2 House Of Health',
          bookingGroupId,
          `IV add-on for ${service.name} (Session ${addOnSessionIndex + 1}) (booked by admin)`,
          getCurrentSqliteTimestamp()
        );
        createdIds.push(Number(addOnResult.lastInsertRowid));
        addOnSummary = {
          serviceName: addOnService.name,
          bookingDate: addOnSlot.bookingDate,
          bookingTime: addOnSlot.bookingTime,
          sessionNumber: addOnSessionIndex + 1,
          amountInr: Number(addOnPriceInr || 0),
        };
      }
    });

    txn(normalizedSlots);

    const bookings = db
      .prepare(
        `SELECT b.id, b.service_name AS serviceName, b.booking_date AS bookingDate, b.booking_time AS bookingTime, b.status, b.payment_status AS paymentStatus
         FROM bookings b
         WHERE b.id IN (${createdIds.map(() => '?').join(', ')})
         ORDER BY b.booking_date, b.booking_time`
      )
      .all(...createdIds);

    return res.status(201).json({
      message: 'Hydrogen bookings saved successfully.',
      summary: {
        serviceName: service.name,
        packageSessions,
        extraSessions,
        totalSessions,
        packagePriceInr,
        extraSessionPriceInr,
        totalAmountInr,
        addOn: addOnSummary,
      },
      bookings,
      customer: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        mobile: targetUser.mobile || '',
        membershipStatus: targetUser.membershipStatus || 'inactive',
        membershipExpiresAt: targetUser.membershipExpiresAt || null,
        membershipPeopleCount: targetUser.membershipPeopleCount ?? null,
      },
      paymentLinkUrl: totalAmountInr > 0 && bookings[0] ? buildBookingPaymentLink(req, bookings[0].id, targetUser.id) : '',
    });
  } catch (error) {
    return res.status(409).json({ message: error?.message || 'Unable to save hydrogen bookings' });
  }
});

app.put('/api/hydrogen/packages/:groupId', requireAuth, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'only users can edit hydrogen bookings' });
  }

  const bookingGroupId = String(req.params.groupId || '').trim();
  if (!bookingGroupId) {
    return res.status(400).json({ message: 'booking group id is required' });
  }

  const existingBookings = db
    .prepare(
      `SELECT id,
              user_id AS userId,
              service_name AS serviceName,
              booking_date AS bookingDate,
              booking_time AS bookingTime,
              status,
              payment_status AS paymentStatus
       FROM bookings
       WHERE booking_group_id = ?
       ORDER BY booking_date, booking_time, id`
    )
    .all(bookingGroupId);

  if (!existingBookings.length) {
    return res.status(404).json({ message: 'hydrogen booking package not found' });
  }

  if (existingBookings.some((entry) => !canAccessBooking(req.user, entry.userId))) {
    return res.status(403).json({ message: 'forbidden' });
  }

  if (existingBookings.some((entry) => ['completed', 'cancelled'].includes(String(entry.status || '').toLowerCase()))) {
    return res.status(409).json({ message: 'completed or cancelled package cannot be edited' });
  }

  const hydrogenBookings = existingBookings.filter((entry) => {
    const service = getServiceByName(entry.serviceName);
    return String(service?.category || '').toUpperCase() === 'HYDROGEN SESSION';
  });
  if (!hydrogenBookings.length) {
    return res.status(400).json({ message: 'invalid hydrogen booking package' });
  }

  const existingAddOnBookings = existingBookings.filter((entry) => {
    const service = getServiceByName(entry.serviceName);
    return isAddOnService(service);
  });
  if (existingAddOnBookings.length > 1) {
    return res.status(409).json({ message: 'package contains multiple add-ons and cannot be edited automatically' });
  }

  const serviceName = String(req.body?.serviceName || '').trim();
  const service = getServiceByName(serviceName);
  if (!service || String(service.category || '').toUpperCase() !== 'HYDROGEN SESSION') {
    return res.status(400).json({ message: 'Invalid hydrogen package selected.' });
  }

  const packageSessions = getHydrogenSessionCountFromServiceName(service.name);
  const extraSessions = Number(req.body?.extraSessions ?? 0);
  if (!Number.isInteger(extraSessions) || extraSessions < 0) {
    return res.status(400).json({ message: 'extraSessions must be a non-negative integer' });
  }

  const totalSessions = packageSessions + extraSessions;
  if (totalSessions !== hydrogenBookings.length) {
    return res.status(400).json({ message: 'Package size cannot be changed during edit.' });
  }

  const slots = Array.isArray(req.body?.slots) ? req.body.slots : [];
  if (slots.length !== totalSessions) {
    return res.status(400).json({ message: `Please select exactly ${totalSessions} slots.` });
  }

  const normalizedSlots = [];
  for (const slot of slots) {
    const bookingDate = String(slot?.bookingDate || '').trim();
    const bookingTime = String(slot?.bookingTime || '').trim();
    const selectedDate = new Date(`${bookingDate}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: `Invalid bookingDate: ${bookingDate}` });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({ message: 'bookingDate cannot be in the past' });
    }
    if (!ALLOWED_SLOT_START_TIMES.includes(bookingTime)) {
      return res.status(400).json({ message: `Invalid bookingTime: ${bookingTime}` });
    }
    if (isBookingSlotInPast(bookingDate, bookingTime)) {
      return res.status(400).json({ message: `bookingTime cannot be in the past for ${bookingDate}` });
    }
    normalizedSlots.push({ bookingDate, bookingTime });
  }

  const addOnServiceName = String(req.body?.addOnServiceName || '').trim();
  const addOnSessionIndexRaw = req.body?.addOnSessionIndex;
  let addOnService = null;
  let addOnSessionIndex = null;
  if (addOnServiceName) {
    addOnService = getServiceByName(addOnServiceName);
    if (!addOnService || !isAddOnService(addOnService)) {
      return res.status(400).json({ message: 'Invalid add-on selected. Choose one IV Therapy or IV Shot.' });
    }
    addOnSessionIndex = Number(addOnSessionIndexRaw);
    if (!Number.isInteger(addOnSessionIndex) || addOnSessionIndex < 0 || addOnSessionIndex >= totalSessions) {
      return res.status(400).json({ message: 'addOnSessionIndex must point to a valid session.' });
    }
  }

  const groupHasPaidBookings = existingBookings.some((entry) => String(entry.paymentStatus || '').toLowerCase() === 'paid');
  const existingAddOnServiceName = existingAddOnBookings[0]?.serviceName || '';
  if (groupHasPaidBookings && addOnServiceName !== existingAddOnServiceName) {
    return res.status(409).json({ message: 'Paid packages can only reschedule the existing add-on. Add-on pricing changes are blocked.' });
  }

  const excludeIds = existingBookings.map((entry) => Number(entry.id)).filter((id) => Number.isInteger(id));
  const hydrogenDailyLimitConflict = validateHydrogenDailySessionLimit(req.user.id, normalizedSlots, excludeIds);
  if (hydrogenDailyLimitConflict) {
    return res.status(409).json({
      message: `Only ${hydrogenDailyLimitConflict.maxAllowed} hydrogen sessions can be booked in one day.`,
    });
  }
  const excludePlaceholders = excludeIds.map(() => '?').join(', ');
  const countActiveForSlot = db.prepare(
    `SELECT
        SUM(CASE WHEN ${activeBookingSql()} THEN 1 ELSE 0 END) AS activeTotal,
        SUM(CASE WHEN ${holdBookingSql()} THEN 1 ELSE 0 END) AS holdTotal
     FROM bookings
     WHERE service_name = ?
       AND booking_date = ?
       AND booking_time = ?
       AND status IN ('pending', 'booked', 'confirmed')
       ${excludePlaceholders ? `AND id NOT IN (${excludePlaceholders})` : ''}`
  );
  const inRequestCounter = new Map();

  for (const slot of normalizedSlots) {
    const key = `${slot.bookingDate}|${slot.bookingTime}`;
    const alreadyInRequest = Number(inRequestCounter.get(key) || 0);
    const slotStats = countActiveForSlot.get(service.name, slot.bookingDate, slot.bookingTime, ...excludeIds) || {};
    const existing = Number(slotStats.activeTotal || 0);
    const holdCount = Number(slotStats.holdTotal || 0);
    if (existing + alreadyInRequest >= getSlotCapacityForServiceName(service.name)) {
      return res.status(409).json({ message: holdCount > 0 ? buildHoldSlotMessage() : `Slot full for ${slot.bookingDate} ${slot.bookingTime}` });
    }
    inRequestCounter.set(key, alreadyInRequest + 1);
  }

  let addOnSummary = null;
  if (addOnService) {
    const addOnSlot = normalizedSlots[addOnSessionIndex];
    const cooldownConflict = findIvCooldownConflict(req.user.id, addOnService.name, addOnSlot.bookingDate, excludeIds);
    if (cooldownConflict) {
      return res.status(409).json({
        message: getIvCooldownResponseMessage(cooldownConflict),
      });
    }
    if (hasStandaloneIvBookingOnDate(req.user.id, addOnSlot.bookingDate, excludeIds)) {
      return res.status(409).json({
        message:
          'A separate IV Therapy/IV Shot is already booked on this date. Hydrogen packages with an IV add-on cannot be combined with separate IV bookings on the same day.',
      });
    }
    const addOnNames = SERVICE_CATALOG.filter((entry) => isAddOnService(entry)).map((entry) => entry.name);
    const addOnNamePlaceholders = addOnNames.map(() => '?').join(', ');
    const conflictingAddOn = db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM bookings
         WHERE user_id = ?
           AND booking_date = ?
           AND booking_time = ?
           AND ${activeBookingSql()}
           AND service_name IN (${addOnNamePlaceholders})
           ${excludePlaceholders ? `AND id NOT IN (${excludePlaceholders})` : ''}`
      )
      .get(req.user.id, addOnSlot.bookingDate, addOnSlot.bookingTime, ...addOnNames, ...excludeIds);
    if (Number(conflictingAddOn?.total || 0) > 0) {
      return res.status(409).json({
        message:
          'Only 1 IV add-on (IV Therapy or IV Shot) can be booked in the same time slot. Additional add-ons are handled by admin after consultation.',
      });
    }

    const addOnSlotStats = countActiveForSlot.get(addOnService.name, addOnSlot.bookingDate, addOnSlot.bookingTime, ...excludeIds) || {};
    const existingAddOnSlotCount = Number(addOnSlotStats.activeTotal || 0);
    const holdAddOn = Number(addOnSlotStats.holdTotal || 0);
    if (existingAddOnSlotCount >= getSlotCapacityForServiceName(addOnService.name)) {
      return res.status(409).json({ message: holdAddOn > 0 ? buildHoldSlotMessage() : `Add-on slot full for ${addOnSlot.bookingDate} ${addOnSlot.bookingTime}` });
    }
    addOnSummary = {
      serviceName: addOnService.name,
      bookingDate: addOnSlot.bookingDate,
      bookingTime: addOnSlot.bookingTime,
      sessionNumber: addOnSessionIndex + 1,
      amountInr: Number(getEffectiveServicePriceInr(addOnService, req.user) || 0),
    };
  }

  const sortedHydrogenBookings = [...hydrogenBookings].sort((a, b) =>
    `${a.bookingDate}T${a.bookingTime}`.localeCompare(`${b.bookingDate}T${b.bookingTime}`) || a.id - b.id
  );
  const existingAddOnBooking = existingAddOnBookings[0] || null;
  const packagePriceInr = getEffectiveServicePriceInr(service, req.user);
  const singleSessionService =
    SERVICE_CATALOG.find(
      (item) =>
        String(item.category || '').toUpperCase() === 'HYDROGEN SESSION' &&
        getHydrogenSessionCountFromServiceName(item.name) === 1
    ) || service;
  const extraSessionPriceInr = getEffectiveServicePriceInr(singleSessionService, req.user);
  const addOnPriceInr = addOnService ? getEffectiveServicePriceInr(addOnService, req.user) : 0;
  const totalAmountInr =
    Number(packagePriceInr || 0) + Number(extraSessionPriceInr || 0) * extraSessions + Number(addOnPriceInr || 0);

  try {
    const txn = db.transaction(() => {
      const updateHydrogenBooking = db.prepare(
        `UPDATE bookings
         SET service_name = ?,
             booking_date = ?,
             booking_time = ?,
             assigned_staff = 'H2 House Of Health',
             notes = ?,
             payment_status = CASE WHEN payment_status = 'paid' THEN 'paid' ELSE 'unpaid' END,
             payment_order_id = CASE WHEN payment_status = 'paid' THEN payment_order_id ELSE NULL END,
             payment_reference = CASE WHEN payment_status = 'paid' THEN payment_reference ELSE NULL END,
             paid_at = CASE WHEN payment_status = 'paid' THEN paid_at ELSE NULL END,
             status = CASE WHEN status = 'booked' THEN 'booked' ELSE 'pending' END
         WHERE id = ?`
      );
      const updateAddOnBooking = db.prepare(
        `UPDATE bookings
         SET service_name = ?,
             booking_date = ?,
             booking_time = ?,
             assigned_staff = 'H2 House Of Health',
             notes = ?,
             payment_status = CASE WHEN payment_status = 'paid' THEN 'paid' ELSE 'unpaid' END,
             payment_order_id = CASE WHEN payment_status = 'paid' THEN payment_order_id ELSE NULL END,
             payment_reference = CASE WHEN payment_status = 'paid' THEN payment_reference ELSE NULL END,
             paid_at = CASE WHEN payment_status = 'paid' THEN paid_at ELSE NULL END,
             status = CASE WHEN status = 'booked' THEN 'booked' ELSE 'pending' END
         WHERE id = ?`
      );
      const insertAddOnBooking = db.prepare(
        `INSERT INTO bookings (
          user_id, doctor_id, client_name, client_email, client_phone,
          service_name, booking_date, booking_time, assigned_staff, status, payment_status, booking_group_id, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?, ?, ?)`
      );

      sortedHydrogenBookings.forEach((entry, index) => {
        const slot = normalizedSlots[index];
        updateHydrogenBooking.run(
          service.name,
          slot.bookingDate,
          slot.bookingTime,
          `Hydrogen package ${packageSessions} + extra ${extraSessions}`,
          entry.id
        );
      });

      if (addOnService) {
        const addOnSlot = normalizedSlots[addOnSessionIndex];
        const addOnNote = `IV add-on for ${service.name} (Session ${addOnSessionIndex + 1})`;
        if (existingAddOnBooking) {
          updateAddOnBooking.run(
            addOnService.name,
            addOnSlot.bookingDate,
            addOnSlot.bookingTime,
            addOnNote,
            existingAddOnBooking.id
          );
        } else {
          insertAddOnBooking.run(
            req.user.id,
            null,
            req.user.name,
            req.user.email,
            req.user.mobile || '-',
            addOnService.name,
            addOnSlot.bookingDate,
            addOnSlot.bookingTime,
            'H2 House Of Health',
            bookingGroupId,
            addOnNote,
            getCurrentSqliteTimestamp()
          );
        }
      } else if (existingAddOnBooking) {
        if (String(existingAddOnBooking.paymentStatus || '').toLowerCase() === 'paid') {
          throw new Error('Paid add-on cannot be removed from this package.');
        }
        db.prepare('DELETE FROM bookings WHERE id = ?').run(existingAddOnBooking.id);
      }
    });

    txn();

    const bookings = db
      .prepare(
        `SELECT id,
                service_name AS serviceName,
                booking_date AS bookingDate,
                booking_time AS bookingTime,
                status,
                payment_status AS paymentStatus,
                booking_group_id AS bookingGroupId
         FROM bookings
         WHERE booking_group_id = ?
         ORDER BY booking_date, booking_time, id`
      )
      .all(bookingGroupId);

    return res.json({
      message: 'Hydrogen package updated successfully.',
      summary: {
        serviceName: service.name,
        packageSessions,
        extraSessions,
        totalSessions,
        packagePriceInr,
        extraSessionPriceInr,
        totalAmountInr,
        addOn: addOnSummary,
      },
      bookings,
    });
  } catch (error) {
    return res.status(409).json({ message: error?.message || 'Unable to update hydrogen package' });
  }
});

app.post('/api/hydrogen/verify', requireAuth, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'only users can verify hydrogen payment' });
  }
  if (!razorpay || !RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ message: RAZORPAY_UNAVAILABLE_MESSAGE });
  }

  const razorpayOrderId = String(req.body?.razorpay_order_id || '');
  const razorpayPaymentId = String(req.body?.razorpay_payment_id || '');
  const razorpaySignature = String(req.body?.razorpay_signature || '');
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ message: 'Invalid payment verification payload' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({ message: 'Invalid payment signature' });
  }

  const bookings = db
    .prepare(
      `SELECT id
       FROM bookings
       WHERE user_id = ?
         AND payment_order_id = ?`
    )
    .all(req.user.id, razorpayOrderId);
  if (!bookings.length) {
    return res.status(404).json({ message: 'Hydrogen order bookings not found' });
  }

  db.prepare(
    `UPDATE bookings
     SET payment_status = 'paid',
         paid_at = CASE WHEN paid_at IS NULL THEN datetime('now') ELSE paid_at END,
         payment_reference = ?,
         status = CASE WHEN status = 'pending' THEN 'booked' ELSE status END
     WHERE user_id = ?
       AND payment_order_id = ?`
  ).run(razorpayPaymentId, req.user.id, razorpayOrderId);

  return res.json({ paid: true, bookingCount: bookings.length });
});

app.put('/api/bookings/:id', requireAuth, (req, res) => {
  const bookingId = Number(req.params.id);
  if (!Number.isInteger(bookingId)) {
    return res.status(400).json({ message: 'invalid booking id' });
  }

  const existing = db
    .prepare('SELECT id, user_id AS userId, status, booking_group_id AS bookingGroupId, service_name AS serviceName FROM bookings WHERE id = ?')
    .get(bookingId);

  if (!existing) {
    return res.status(404).json({ message: 'booking not found' });
  }

  if (!canAccessBooking(req.user, existing.userId)) {
    return res.status(403).json({ message: 'forbidden' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'user') {
    return res.status(403).json({ message: 'forbidden' });
  }

  if (req.user.role !== 'admin' && ['completed', 'cancelled'].includes(String(existing.status))) {
    return res.status(409).json({ message: 'completed/cancelled booking cannot be edited by user' });
  }

  const bookingOwner =
    req.user.role === 'admin'
      ? db
          .prepare(
            `SELECT membership_status AS membershipStatus, membership_expires_at AS membershipExpiresAt
             FROM users
             WHERE id = ?`
          )
          .get(existing.userId)
      : req.user;

  const payload = validateBookingPayload(req.body, bookingOwner || req.user);
  if (payload.error) return res.status(400).json({ message: payload.error });

  if (existing.bookingGroupId && payload.data.serviceName !== existing.serviceName) {
    return res.status(400).json({ message: 'Grouped hydrogen bookings can only update date, time, and notes.' });
  }

  const selectedService = getServiceByName(payload.data.serviceName);
  if (
    req.user.role !== 'admin' &&
    selectedService &&
    isAddOnService(selectedService) &&
    hasConflictingAddOnBooking(req.user.id, payload.data.bookingDate, payload.data.bookingTime, bookingId)
  ) {
    return res.status(409).json({
      message:
        'Only 1 IV add-on (IV Therapy or IV Shot) can be booked in the same time slot. Additional add-ons are handled by admin after consultation.',
    });
  }
  if (
    req.user.role !== 'admin' &&
    selectedService &&
    isAddOnService(selectedService) &&
    !existing.bookingGroupId &&
    hasHydrogenPackageAddOnOnDate(req.user.id, payload.data.bookingDate, [bookingId])
  ) {
    return res.status(409).json({
      message:
        'A hydrogen package on this date already includes an IV add-on. Separate IV Therapy/IV Shot bookings are not allowed on the same day.',
    });
  }
  if (selectedService && String(selectedService.category || '').toUpperCase() === 'HYDROGEN SESSION') {
    const dailyLimitConflict = validateHydrogenDailySessionLimit(existing.userId, [
      { bookingDate: payload.data.bookingDate, bookingTime: payload.data.bookingTime },
    ], [bookingId]);
    if (dailyLimitConflict) {
      return res.status(409).json({
        message: `Only ${dailyLimitConflict.maxAllowed} hydrogen sessions can be booked in one day.`,
      });
    }
  }
  if (req.user.role !== 'admin' && selectedService && isAddOnService(selectedService)) {
    const cooldownConflict = findIvCooldownConflict(existing.userId, payload.data.serviceName, payload.data.bookingDate, [bookingId]);
    if (cooldownConflict) {
      return res.status(409).json({
        message: getIvCooldownResponseMessage(cooldownConflict),
      });
    }
  }

  const slotStatus = getSlotCapacityStatus(
    payload.data.serviceName,
    payload.data.bookingDate,
    payload.data.bookingTime,
    bookingId
  );
  if (slotStatus.reached) {
    const message = slotStatus.holdTotal > 0
      ? buildHoldSlotMessage()
      : `This slot is full. Maximum ${slotStatus.maxPerSlot} bookings are allowed.`;
    return res.status(409).json({ message });
  }

  const nextStatus = req.user.role === 'admin'
    ? String(req.body?.status || existing.status).toLowerCase()
    : String(existing.status || 'pending');

  if (!isValidStatus(nextStatus)) {
    return res.status(400).json({ message: 'invalid status' });
  }

  db.prepare(
    `UPDATE bookings SET
      doctor_id = NULL,
      service_name = ?,
      booking_date = ?,
      booking_time = ?,
      assigned_staff = 'H2 House Of Health',
      notes = ?,
      payment_status = CASE WHEN ? = 1 THEN 'paid' ELSE payment_status END,
      status = ?
    WHERE id = ?`
  ).run(
    payload.data.serviceName,
    payload.data.bookingDate,
    payload.data.bookingTime,
    payload.data.notes,
    selectedService?.membershipOnly ? 1 : 0,
    nextStatus,
    bookingId
  );

  const booking = db
    .prepare(
      `SELECT b.id,
              b.user_id AS userId,
              b.booking_group_id AS bookingGroupId,
              u.name AS clientName,
              u.email AS clientEmail,
              u.mobile AS clientMobile,
              b.service_name AS serviceName,
              b.booking_date AS bookingDate,
              b.booking_time AS bookingTime,
              b.status,
              b.payment_status AS paymentStatus,
              b.paid_at AS paidAt,
              b.notes,
              b.created_at AS createdAt
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       WHERE b.id = ?`
    )
    .get(bookingId);

  res.json({ booking });
});

app.get('/api/payments/config', requireAuth, (_req, res) => {
  if (!razorpay) {
    return res.status(503).json({ message: RAZORPAY_UNAVAILABLE_MESSAGE });
  }

  return res.json({ keyId: RAZORPAY_KEY_ID, currency: 'INR' });
});

app.get('/api/bookings/:id/payment-link', requireAuth, (req, res) => {
  const bookingId = Number(req.params.id);
  if (!Number.isInteger(bookingId)) {
    return res.status(400).json({ message: 'invalid booking id' });
  }

  const booking = db
    .prepare(
      'SELECT id, user_id AS userId, status, payment_status AS paymentStatus, service_name AS serviceName, created_at AS createdAt FROM bookings WHERE id = ?'
    )
    .get(bookingId);
  if (!booking) {
    return res.status(404).json({ message: 'booking not found' });
  }
  if (!canAccessBooking(req.user, booking.userId)) {
    return res.status(403).json({ message: 'forbidden' });
  }

  const service = getServiceByName(booking.serviceName);
  if (!service || service.membershipOnly || booking.paymentStatus === 'paid') {
    return res.status(409).json({ message: 'payment link is not required for this booking' });
  }
  if (isHoldExpiredBooking(booking)) {
    return res.status(409).json({ message: 'This booking hold has expired. Please book another slot.' });
  }

  return res.json({
    paymentLinkUrl: buildBookingPaymentLink(req, booking.id, booking.userId),
  });
});

app.get('/api/public/payments/booking', (req, res) => {
  const access = verifyPaymentAccessToken(req.query?.token);
  if (!access || !Number.isInteger(access.bookingId) || !Number.isInteger(access.userId)) {
    return res.status(400).json({ message: 'Invalid or expired payment link' });
  }

  const booking = db
    .prepare(
      `SELECT id, user_id AS userId, booking_group_id AS bookingGroupId, service_name AS serviceName,
              booking_date AS bookingDate, booking_time AS bookingTime, status, payment_status AS paymentStatus,
              created_at AS createdAt
       FROM bookings
       WHERE id = ?`
    )
    .get(access.bookingId);
  if (!booking || Number(booking.userId) !== access.userId) {
    return res.status(404).json({ message: 'booking not found' });
  }

  const bookingOwner = getUserById(booking.userId);
  const service = getServiceByName(booking.serviceName);
  if (!service) {
    return res.status(400).json({ message: 'Invalid service configured on booking' });
  }

  const groupBookings = booking.bookingGroupId
    ? db
        .prepare(
          `SELECT id, user_id AS userId, booking_group_id AS bookingGroupId, service_name AS serviceName,
                  booking_date AS bookingDate, booking_time AS bookingTime, status, payment_status AS paymentStatus,
                  created_at AS createdAt
           FROM bookings
           WHERE booking_group_id = ?
           ORDER BY booking_date, booking_time, id`
        )
        .all(booking.bookingGroupId)
    : [booking];
  const holdMetaEntries = groupBookings.map(applyHoldMeta);
  const holdActiveEntries = holdMetaEntries.filter((entry) => entry.holdActive);
  const holdExpired = holdMetaEntries.some((entry) => entry.holdExpired);
  const holdActive = holdActiveEntries.length > 0;
  const holdRemainingMinutes = holdActive
    ? Math.min(...holdActiveEntries.map((entry) => Number(entry.holdRemainingMinutes || 0)).filter((value) => value > 0))
    : 0;
  const holdExpiresAt = holdActive
    ? holdActiveEntries
        .map((entry) => entry.holdExpiresAt)
        .filter(Boolean)
        .sort()[0] || ''
    : '';
  const activeBookings = groupBookings.filter((entry) => entry.status !== 'cancelled');
  const pricingUser = {
    membershipStatus: bookingOwner?.membershipStatus || 'inactive',
    membershipExpiresAt: bookingOwner?.membershipExpiresAt || null,
  };
  const summary = booking.bookingGroupId
    ? buildHydrogenGroupPaymentSummary(activeBookings, pricingUser)
    : {
        serviceName: booking.serviceName,
        amountInr: getEffectiveServicePriceInr(service, pricingUser),
        totalAmountInr: getEffectiveServicePriceInr(service, pricingUser),
        bookingCount: 1,
      };

  return res.json({
    bookingId: booking.id,
    bookingGroupId: booking.bookingGroupId || '',
    status: booking.status,
    paymentStatus: booking.paymentStatus || 'unpaid',
    customer: {
      name: bookingOwner?.name || '',
      email: bookingOwner?.email || '',
      mobile: bookingOwner?.mobile || '',
    },
    booking: {
      serviceName: summary.serviceName || booking.serviceName,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
    },
    summary,
    hold: {
      active: holdActive,
      expired: holdExpired,
      remainingMinutes: holdRemainingMinutes,
      expiresAt: holdExpiresAt,
      holdMinutes: BOOKING_HOLD_MINUTES,
    },
    keyId: RAZORPAY_KEY_ID,
  });
});

app.post('/api/public/payments/create-order', async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ message: RAZORPAY_UNAVAILABLE_MESSAGE });
  }

  const access = verifyPaymentAccessToken(req.body?.token);
  if (!access || !Number.isInteger(access.bookingId) || !Number.isInteger(access.userId)) {
    return res.status(400).json({ message: 'Invalid or expired payment link' });
  }

  const booking = db
    .prepare(
      `SELECT id, user_id AS userId, booking_group_id AS bookingGroupId, status, payment_status AS paymentStatus,
              service_name AS serviceName, booking_date AS bookingDate, booking_time AS bookingTime,
              created_at AS createdAt
       FROM bookings
       WHERE id = ?`
    )
    .get(access.bookingId);
  if (!booking || Number(booking.userId) !== access.userId) {
    return res.status(404).json({ message: 'booking not found' });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({ message: 'cannot pay for a cancelled booking' });
  }

  if (booking.paymentStatus === 'paid') {
    return res.status(409).json({ message: 'booking is already paid' });
  }

  const service = getServiceByName(booking.serviceName);
  if (!service) {
    return res.status(400).json({ message: 'Invalid service configured on booking' });
  }
  if (service.membershipOnly) {
    return res.status(409).json({ message: 'This membership service is included. Payment is not required.' });
  }

  const bookingOwner = getUserById(booking.userId);
  const pricingUser = {
    membershipStatus: bookingOwner?.membershipStatus || 'inactive',
    membershipExpiresAt: bookingOwner?.membershipExpiresAt || null,
  };
  const groupBookings = booking.bookingGroupId
    ? db
        .prepare(
          `SELECT id, user_id AS userId, booking_group_id AS bookingGroupId, service_name AS serviceName,
                  booking_date AS bookingDate, booking_time AS bookingTime, status, payment_status AS paymentStatus
           FROM bookings
           WHERE booking_group_id = ?
           ORDER BY booking_date, booking_time, id`
        )
        .all(booking.bookingGroupId)
    : [];
  const payableBookings = booking.bookingGroupId
    ? groupBookings.filter((entry) => entry.status !== 'cancelled' && entry.paymentStatus !== 'paid')
    : [booking];

  if (!payableBookings.length) {
    return res.status(409).json({ message: 'All bookings in this package are already paid or cancelled.' });
  }
  if (payableBookings.some((entry) => isHoldExpiredBooking(entry))) {
    return res.status(409).json({ message: 'This booking hold has expired. Please book another slot.' });
  }

  const paymentSummary = booking.bookingGroupId
    ? buildHydrogenGroupPaymentSummary(payableBookings, pricingUser)
    : {
        serviceName: booking.serviceName,
        amountInr: getEffectiveServicePriceInr(service, pricingUser),
        totalAmountInr: getEffectiveServicePriceInr(service, pricingUser),
        bookingCount: 1,
      };
  const amountInPaise = Math.max(100, Math.round(Number(paymentSummary.totalAmountInr || 0) * 100));

  try {
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: buildRazorpayReceipt(booking.bookingGroupId ? 'bkgroup' : 'booking', booking.bookingGroupId || booking.id),
      notes: {
        bookingId: String(booking.id),
        userId: String(booking.userId),
        bookingGroupId: String(booking.bookingGroupId || ''),
      },
    });

    if (booking.bookingGroupId) {
      db.prepare(
        `UPDATE bookings
         SET payment_status = CASE WHEN payment_status = 'unpaid' THEN 'payment_pending' ELSE payment_status END,
             payment_order_id = ?
         WHERE booking_group_id = ?
           AND status <> 'cancelled'
           AND payment_status <> 'paid'`
      ).run(order.id, booking.bookingGroupId);
    } else {
      db.prepare(
        `UPDATE bookings
         SET payment_status = CASE WHEN payment_status = 'unpaid' THEN 'payment_pending' ELSE payment_status END,
             payment_order_id = ?
         WHERE id = ?`
      ).run(order.id, booking.id);
    }

    return res.json({
      keyId: RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId: booking.id,
      bookingCount: Number(paymentSummary.bookingCount || 1),
      summary: paymentSummary,
      booking: {
        serviceName: paymentSummary.serviceName || booking.serviceName,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        amountInr: Number(paymentSummary.totalAmountInr || 0),
      },
      customer: {
        name: bookingOwner?.name || '',
        email: bookingOwner?.email || '',
      },
    });
  } catch (error) {
    console.error('Razorpay public booking order create failed:', getRazorpayOrderErrorMessage(error, 'Unable to create Razorpay order'));
    return res.status(500).json({ message: getRazorpayOrderErrorMessage(error, 'Unable to create Razorpay order') });
  }
});

app.post('/api/public/payments/verify', (req, res) => {
  const access = verifyPaymentAccessToken(req.body?.token);
  const razorpayOrderId = String(req.body?.razorpay_order_id || '');
  const razorpayPaymentId = String(req.body?.razorpay_payment_id || '');
  const razorpaySignature = String(req.body?.razorpay_signature || '');

  if (!razorpay || !RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ message: RAZORPAY_UNAVAILABLE_MESSAGE });
  }

  if (!access || !Number.isInteger(access.bookingId) || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ message: 'Invalid payment verification payload' });
  }

  const booking = db
    .prepare(
      'SELECT id, user_id AS userId, booking_group_id AS bookingGroupId, payment_order_id AS paymentOrderId FROM bookings WHERE id = ?'
    )
    .get(access.bookingId);

  if (!booking || Number(booking.userId) !== access.userId) {
    return res.status(404).json({ message: 'booking not found' });
  }

  if (booking.paymentOrderId && booking.paymentOrderId !== razorpayOrderId) {
    return res.status(400).json({ message: 'Order mismatch' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({ message: 'Invalid payment signature' });
  }

  if (booking.bookingGroupId) {
    const groupBookings = db
      .prepare(
        `SELECT id
         FROM bookings
         WHERE booking_group_id = ?
           AND status <> 'cancelled'
           AND payment_status <> 'paid'`
      )
      .all(booking.bookingGroupId);

    db.prepare(
      `UPDATE bookings
       SET payment_status = 'paid',
           paid_at = CASE WHEN paid_at IS NULL THEN datetime('now') ELSE paid_at END,
           payment_order_id = CASE WHEN ? <> '' THEN ? ELSE payment_order_id END,
           payment_reference = CASE WHEN ? <> '' THEN ? ELSE payment_reference END,
           status = CASE WHEN status = 'pending' THEN 'booked' ELSE status END
       WHERE booking_group_id = ?
         AND status <> 'cancelled'
         AND payment_status <> 'paid'`
    ).run(razorpayOrderId, razorpayOrderId, razorpayPaymentId, razorpayPaymentId, booking.bookingGroupId);

    return res.json({ bookingId: access.bookingId, paid: true, bookingCount: groupBookings.length });
  }

  markBookingPaid(access.bookingId, razorpayOrderId, razorpayPaymentId);
  return res.json({ bookingId: access.bookingId, paid: true });
});

app.post('/api/payments/preview-cart-coupon', requireAuth, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'forbidden' });
  }

  const pricingUser = {
    membershipStatus: req.user.membershipStatus || 'inactive',
    membershipExpiresAt: req.user.membershipExpiresAt || null,
  };
  const payableBookings = getPayableUserBookings(req.user.id);
  if (!payableBookings.length) {
    return res.status(409).json({ message: 'No unpaid payable bookings found.' });
  }

  let paymentSummary;
  try {
    paymentSummary = buildAggregatePaymentSummary(payableBookings, pricingUser);
  } catch (error) {
    return res.status(409).json({ message: error?.message || 'Unable to calculate payment total for current bookings.' });
  }

  const couponResult = validateCouponForUser({
    code: req.body?.couponCode,
    userId: req.user.id,
    appliesTo: 'services',
    subtotalAmountPaise: Math.round(Number(paymentSummary.totalAmountInr || 0) * 100),
  });
  if (couponResult.error) {
    return res.status(400).json({ message: couponResult.error });
  }

  return res.json({ coupon: serializeCouponPreview(couponResult), summary: paymentSummary });
});

app.post('/api/payments/create-cart-order', requireAuth, async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ message: RAZORPAY_UNAVAILABLE_MESSAGE });
  }
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'forbidden' });
  }

  const pricingUser = {
    membershipStatus: req.user.membershipStatus || 'inactive',
    membershipExpiresAt: req.user.membershipExpiresAt || null,
  };
  const payableBookings = getPayableUserBookings(req.user.id);
  if (!payableBookings.length) {
    return res.status(409).json({ message: 'No unpaid payable bookings found.' });
  }

  let paymentSummary;
  try {
    paymentSummary = buildAggregatePaymentSummary(payableBookings, pricingUser);
  } catch (error) {
    return res.status(409).json({ message: error?.message || 'Unable to calculate payment total for current bookings.' });
  }

  const subtotalAmountPaise = Math.round(Number(paymentSummary.totalAmountInr || 0) * 100);
  const couponResult = validateCouponForUser({
    code: req.body?.couponCode,
    userId: req.user.id,
    appliesTo: 'services',
    subtotalAmountPaise,
  });
  if (couponResult.error) {
    return res.status(400).json({ message: couponResult.error });
  }
  const amountInPaise = Math.max(100, Number(couponResult.finalAmountPaise || subtotalAmountPaise));

  try {
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: buildRazorpayReceipt('cart', req.user.id),
      notes: {
        userId: String(req.user.id),
        scope: 'cart',
        couponCode: String(couponResult.couponCode || ''),
      },
    });

    const ids = payableBookings.map((entry) => Number(entry.id)).filter((id) => Number.isInteger(id));
    db.prepare(
      `INSERT OR REPLACE INTO cart_payment_orders (
        order_id, user_id, original_amount_paise, discount_amount_paise, coupon_id, coupon_code, amount_paise, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`
    ).run(
      order.id,
      req.user.id,
      Number(couponResult.originalAmountPaise || subtotalAmountPaise),
      Number(couponResult.discountAmountPaise || 0),
      couponResult.coupon?.id || null,
      couponResult.couponCode || null,
      amountInPaise
    );

    db.prepare(
      `UPDATE bookings
       SET payment_status = CASE WHEN payment_status = 'unpaid' THEN 'payment_pending' ELSE payment_status END,
           payment_order_id = ?
       WHERE id IN (${ids.map(() => '?').join(', ')})`
    ).run(order.id, ...ids);

    return res.json({
      keyId: RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      summary: paymentSummary,
      coupon: serializeCouponPreview(couponResult),
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error('Razorpay cart order create failed:', getRazorpayOrderErrorMessage(error, 'Unable to create Razorpay order'));
    return res.status(500).json({ message: getRazorpayOrderErrorMessage(error, 'Unable to create Razorpay order') });
  }
});

app.post('/api/payments/create-order', requireAuth, async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ message: RAZORPAY_UNAVAILABLE_MESSAGE });
  }

  const bookingId = Number(req.body?.bookingId);
  if (!Number.isInteger(bookingId)) {
    return res.status(400).json({ message: 'bookingId is required' });
  }

  const booking = db.prepare(
    `SELECT b.id, b.user_id AS userId, b.booking_group_id AS bookingGroupId, b.status, b.payment_status AS paymentStatus,
            b.service_name AS serviceName, b.booking_date AS bookingDate, b.booking_time AS bookingTime,
            b.created_at AS createdAt
     FROM bookings b
     WHERE b.id = ?`
  ).get(bookingId);

  if (!booking) {
    return res.status(404).json({ message: 'booking not found' });
  }

  if (!canAccessBooking(req.user, booking.userId)) {
    return res.status(403).json({ message: 'forbidden' });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({ message: 'cannot pay for a cancelled booking' });
  }

  if (booking.paymentStatus === 'paid') {
    return res.status(409).json({ message: 'booking is already paid' });
  }

  const service = getServiceByName(booking.serviceName);
  if (!service) {
    return res.status(400).json({ message: 'Invalid service configured on booking' });
  }
  if (service.membershipOnly) {
    return res.status(409).json({ message: 'This membership service is included. Payment is not required.' });
  }

  const bookingOwner = db
    .prepare(
      `SELECT membership_status AS membershipStatus, membership_expires_at AS membershipExpiresAt
       FROM users
       WHERE id = ?`
    )
    .get(booking.userId);
  const pricingUser = {
    membershipStatus: bookingOwner?.membershipStatus || req.user.membershipStatus || 'inactive',
    membershipExpiresAt: bookingOwner?.membershipExpiresAt || req.user.membershipExpiresAt || null,
  };
  const groupBookings = booking.bookingGroupId
    ? db
        .prepare(
          `SELECT id,
                  user_id AS userId,
                  booking_group_id AS bookingGroupId,
                  service_name AS serviceName,
                  booking_date AS bookingDate,
                  booking_time AS bookingTime,
                  status,
                  payment_status AS paymentStatus,
                  created_at AS createdAt
           FROM bookings
           WHERE booking_group_id = ?
           ORDER BY booking_date, booking_time, id`
        )
        .all(booking.bookingGroupId)
    : [];

  if (groupBookings.some((entry) => !canAccessBooking(req.user, entry.userId))) {
    return res.status(403).json({ message: 'forbidden' });
  }

  const payableBookings = booking.bookingGroupId
    ? groupBookings.filter((entry) => entry.status !== 'cancelled' && entry.paymentStatus !== 'paid')
    : [booking];

  if (!payableBookings.length) {
    return res.status(409).json({ message: 'All bookings in this package are already paid or cancelled.' });
  }
  if (payableBookings.some((entry) => isHoldExpiredBooking(entry))) {
    return res.status(409).json({ message: 'This booking hold has expired. Please book another slot.' });
  }

  let paymentSummary;
  try {
    paymentSummary = booking.bookingGroupId
      ? buildHydrogenGroupPaymentSummary(payableBookings, pricingUser)
      : {
          serviceName: booking.serviceName,
          amountInr: getEffectiveServicePriceInr(service, pricingUser),
          totalAmountInr: getEffectiveServicePriceInr(service, pricingUser),
          bookingCount: 1,
        };
  } catch (error) {
    return res.status(409).json({ message: error?.message || 'Unable to calculate payment total for this booking.' });
  }
  const amountInPaise = Math.max(100, Math.round(Number(paymentSummary.totalAmountInr || 0) * 100));

  try {
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: buildRazorpayReceipt(booking.bookingGroupId ? 'bkgroup' : 'booking', booking.bookingGroupId || booking.id),
      notes: {
        bookingId: String(booking.id),
        userId: String(booking.userId),
        bookingGroupId: String(booking.bookingGroupId || ''),
      },
    });

    if (booking.bookingGroupId) {
      db.prepare(
        `UPDATE bookings
         SET payment_status = CASE WHEN payment_status = 'unpaid' THEN 'payment_pending' ELSE payment_status END,
             payment_order_id = ?
         WHERE booking_group_id = ?
           AND status <> 'cancelled'
           AND payment_status <> 'paid'`
      ).run(order.id, booking.bookingGroupId);
    } else {
      db.prepare(
        `UPDATE bookings
         SET payment_status = CASE WHEN payment_status = 'unpaid' THEN 'payment_pending' ELSE payment_status END,
             payment_order_id = ?
         WHERE id = ?`
      ).run(order.id, booking.id);
    }

    return res.json({
      keyId: RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId: booking.id,
      bookingCount: Number(paymentSummary.bookingCount || 1),
      summary: paymentSummary,
      booking: {
        serviceName: paymentSummary.serviceName || booking.serviceName,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        amountInr: Number(paymentSummary.totalAmountInr || 0),
      },
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error('Razorpay booking order create failed:', getRazorpayOrderErrorMessage(error, 'Unable to create Razorpay order'));
    return res.status(500).json({ message: getRazorpayOrderErrorMessage(error, 'Unable to create Razorpay order') });
  }
});

app.post('/api/payments/verify', requireAuth, (req, res) => {
  const bookingId = Number(req.body?.bookingId);
  const razorpayOrderId = String(req.body?.razorpay_order_id || '');
  const razorpayPaymentId = String(req.body?.razorpay_payment_id || '');
  const razorpaySignature = String(req.body?.razorpay_signature || '');

  if (!razorpay || !RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ message: RAZORPAY_UNAVAILABLE_MESSAGE });
  }

  if (!Number.isInteger(bookingId) || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ message: 'Invalid payment verification payload' });
  }

  const booking = db
    .prepare(
      'SELECT id, user_id AS userId, booking_group_id AS bookingGroupId, payment_order_id AS paymentOrderId FROM bookings WHERE id = ?'
    )
    .get(bookingId);

  if (!booking) {
    return res.status(404).json({ message: 'booking not found' });
  }

  if (!canAccessBooking(req.user, booking.userId)) {
    return res.status(403).json({ message: 'forbidden' });
  }

  if (booking.paymentOrderId && booking.paymentOrderId !== razorpayOrderId) {
    return res.status(400).json({ message: 'Order mismatch' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({ message: 'Invalid payment signature' });
  }

  if (booking.bookingGroupId) {
    const groupBookings = db
      .prepare(
        `SELECT id
         FROM bookings
         WHERE booking_group_id = ?
           AND status <> 'cancelled'
           AND payment_status <> 'paid'`
      )
      .all(booking.bookingGroupId);

    db.prepare(
      `UPDATE bookings
       SET payment_status = 'paid',
           paid_at = CASE WHEN paid_at IS NULL THEN datetime('now') ELSE paid_at END,
           payment_order_id = CASE WHEN ? <> '' THEN ? ELSE payment_order_id END,
           payment_reference = CASE WHEN ? <> '' THEN ? ELSE payment_reference END,
           status = CASE WHEN status = 'pending' THEN 'booked' ELSE status END
       WHERE booking_group_id = ?
         AND status <> 'cancelled'
         AND payment_status <> 'paid'`
    ).run(razorpayOrderId, razorpayOrderId, razorpayPaymentId, razorpayPaymentId, booking.bookingGroupId);

    return res.json({ bookingId, paid: true, bookingCount: groupBookings.length });
  }

  markBookingPaid(bookingId, razorpayOrderId, razorpayPaymentId);
  return res.json({ bookingId, paid: true });
});

app.post('/api/payments/verify-cart', requireAuth, (req, res) => {
  const razorpayOrderId = String(req.body?.razorpay_order_id || '');
  const razorpayPaymentId = String(req.body?.razorpay_payment_id || '');
  const razorpaySignature = String(req.body?.razorpay_signature || '');

  if (!razorpay || !RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ message: RAZORPAY_UNAVAILABLE_MESSAGE });
  }
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'forbidden' });
  }
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ message: 'Invalid payment verification payload' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({ message: 'Invalid payment signature' });
  }

  const cartOrder = db
    .prepare(
      `SELECT order_id AS orderId, user_id AS userId, coupon_id AS couponId, discount_amount_paise AS discountAmountPaise
       FROM cart_payment_orders
       WHERE order_id = ?`
    )
    .get(razorpayOrderId);
  if (!cartOrder || Number(cartOrder.userId) !== Number(req.user.id)) {
    return res.status(404).json({ message: 'Cart payment order not found.' });
  }

  const matchedBookings = db
    .prepare(
      `SELECT id,
              user_id AS userId,
              booking_group_id AS bookingGroupId,
              service_name AS serviceName,
              booking_date AS bookingDate,
              booking_time AS bookingTime,
              status,
              payment_status AS paymentStatus
       FROM bookings
       WHERE user_id = ?
         AND payment_order_id = ?
         AND status <> 'cancelled'
         AND payment_status <> 'paid'
       ORDER BY booking_date, booking_time, id`
    )
    .all(req.user.id, razorpayOrderId);

  if (!matchedBookings.length) {
    return res.status(404).json({ message: 'No payable bookings found for this payment order.' });
  }

  const pricingUser = {
    membershipStatus: req.user.membershipStatus || 'inactive',
    membershipExpiresAt: req.user.membershipExpiresAt || null,
  };
  const summary = buildAggregatePaymentSummary(matchedBookings, pricingUser);

  db.prepare(
    `UPDATE bookings
     SET payment_status = 'paid',
         paid_at = CASE WHEN paid_at IS NULL THEN datetime('now') ELSE paid_at END,
         payment_order_id = CASE WHEN ? <> '' THEN ? ELSE payment_order_id END,
         payment_reference = CASE WHEN ? <> '' THEN ? ELSE payment_reference END,
         status = CASE WHEN status = 'pending' THEN 'booked' ELSE status END
     WHERE user_id = ?
       AND payment_order_id = ?
       AND status <> 'cancelled'
       AND payment_status <> 'paid'`
  ).run(razorpayOrderId, razorpayOrderId, razorpayPaymentId, razorpayPaymentId, req.user.id, razorpayOrderId);

  db.prepare(
    `UPDATE cart_payment_orders
     SET status = 'paid',
         payment_reference = ?,
         paid_at = datetime('now')
     WHERE order_id = ?`
  ).run(razorpayPaymentId, razorpayOrderId);

  if (Number(cartOrder.couponId || 0) > 0 && Number(cartOrder.discountAmountPaise || 0) > 0) {
    recordCouponRedemption({
      couponId: Number(cartOrder.couponId),
      userId: req.user.id,
      contextType: 'cart',
      contextRef: razorpayOrderId,
      discountAmountPaise: Number(cartOrder.discountAmountPaise || 0),
    });
  }

  return res.json({
    paid: true,
    bookingCount: matchedBookings.length,
    unitCount: Number(summary.unitCount || 0),
    totalAmountInr: Number(summary.totalAmountInr || 0),
  });
});

app.patch('/api/bookings/:id/status', requireAuth, (req, res) => {
  const bookingId = Number(req.params.id);
  const status = String(req.body?.status || '').toLowerCase();

  if (!Number.isInteger(bookingId)) {
    return res.status(400).json({ message: 'invalid booking id' });
  }

  if (!isValidStatus(status)) {
    return res.status(400).json({ message: 'invalid status' });
  }

  const existing = db
    .prepare(
      'SELECT id, user_id AS userId, payment_status AS paymentStatus, booking_group_id AS bookingGroupId FROM bookings WHERE id = ?'
    )
    .get(bookingId);

  if (!existing) {
    return res.status(404).json({ message: 'booking not found' });
  }

  if (!canAccessBooking(req.user, existing.userId)) {
    return res.status(403).json({ message: 'forbidden' });
  }

  if (req.user.role !== 'admin' && status !== 'cancelled') {
    return res.status(403).json({ message: 'only admin can set this status' });
  }

  if (status === 'confirmed' && existing.paymentStatus !== 'paid') {
    return res.status(400).json({ message: 'booking must be paid before confirming' });
  }

  if (status === 'cancelled' && existing.bookingGroupId) {
    db.prepare('UPDATE bookings SET status = ? WHERE booking_group_id = ?').run(status, existing.bookingGroupId);
  } else {
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, bookingId);
  }
  res.status(204).send();
});

app.post('/api/bookings/:id/pay', requireAuth, (req, res) => {
  return res.status(410).json({ message: 'Use /api/payments/create-order and /api/payments/verify for Razorpay.' });
});

app.delete('/api/bookings/:id', requireAuth, (req, res) => {
  const bookingId = Number(req.params.id);
  if (!Number.isInteger(bookingId)) {
    return res.status(400).json({ message: 'invalid booking id' });
  }

  const existing = db
    .prepare('SELECT id, user_id AS userId, booking_group_id AS bookingGroupId FROM bookings WHERE id = ?')
    .get(bookingId);

  if (!existing) {
    return res.status(404).json({ message: 'booking not found' });
  }

  if (!canAccessBooking(req.user, existing.userId)) {
    return res.status(403).json({ message: 'forbidden' });
  }

  if (existing.bookingGroupId) {
    db.prepare('DELETE FROM bookings WHERE booking_group_id = ?').run(existing.bookingGroupId);
  } else {
    db.prepare('DELETE FROM bookings WHERE id = ?').run(bookingId);
  }
  res.status(204).send();
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
  if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
    console.log(`SendGrid OTP mailer configured with sender ${SENDGRID_FROM_EMAIL}`);
  } else {
    console.warn('SendGrid OTP mailer is not fully configured. Check SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.');
  }
});
function canAccessBooking(user, ownerId) {
  return user.role === 'admin' || user.id === Number(ownerId);
}

function getUserById(userId) {
  if (!Number.isInteger(Number(userId))) return null;
  return db
    .prepare(
      `SELECT id, role, name, email, mobile,
              membership_status AS membershipStatus,
              membership_expires_at AS membershipExpiresAt,
              membership_people_count AS membershipPeopleCount
       FROM users
       WHERE id = ?`
    )
    .get(Number(userId));
}

function getUserByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;
  return db
    .prepare(
      `SELECT id, role, name, email, mobile,
              membership_status AS membershipStatus,
              membership_expires_at AS membershipExpiresAt,
              membership_people_count AS membershipPeopleCount
       FROM users
       WHERE email = ?`
    )
    .get(normalizedEmail);
}

function normalizeDiscountPhoneKey(phone) {
  const digits = String(phone || '').replace(/\D+/g, '');
  if (digits.length < 7) return '';
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function getDiscountPercentForPhone(phone) {
  const phoneKey = normalizeDiscountPhoneKey(phone);
  if (!phoneKey) return 0;
  const row = db
    .prepare(
      `SELECT discount_percent AS discountPercent
       FROM admin_discount_phones
       WHERE phone_key = ?`
    )
    .get(phoneKey);
  const percent = Number(row?.discountPercent || 0);
  if (!Number.isFinite(percent) || percent <= 0) return 0;
  return Math.min(100, percent);
}

function applyPhoneDiscount(amountInr, phone) {
  const baseAmount = Number(amountInr || 0);
  if (!Number.isFinite(baseAmount) || baseAmount <= 0) return 0;
  const discountPercent = getDiscountPercentForPhone(phone);
  if (discountPercent <= 0) return baseAmount;
  return Math.max(0, Math.round(baseAmount * (1 - discountPercent / 100)));
}

function normalizeCouponCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9_-]/g, '');
}

function generateCouponCode(prefix = 'H2') {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  const suffix = Array.from(bytes)
    .map((value) => alphabet[value % alphabet.length])
    .join('');
  return prefix ? `${prefix}-${suffix}` : suffix;
}

function getCouponByCode(code) {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) return null;
  const row = db
    .prepare(
      `SELECT id,
              code,
              description,
              discount_type AS discountType,
              discount_value AS discountValue,
              applies_to AS appliesTo,
              max_redemptions AS maxRedemptions,
              per_user_limit AS perUserLimit,
              expires_at AS expiresAt,
              active,
              recipient_email AS recipientEmail,
              recipient_name AS recipientName,
              emailed_at AS emailedAt,
              email_status AS emailStatus,
              email_error AS emailError,
              created_at AS createdAt
       FROM coupons
       WHERE code = ?`
    )
    .get(normalizedCode);
  if (!row) return null;
  return {
    id: Number(row.id),
    code: row.code || '',
    description: row.description || '',
    discountType: row.discountType || 'percent',
    discountValue: Number(row.discountValue || 0),
    appliesTo: row.appliesTo || 'all',
    maxRedemptions: row.maxRedemptions == null ? null : Number(row.maxRedemptions),
    perUserLimit: Number(row.perUserLimit || 1),
    expiresAt: row.expiresAt || null,
    active: Number(row.active || 0) === 1,
    recipientEmail: row.recipientEmail || '',
    recipientName: row.recipientName || '',
    emailedAt: row.emailedAt || null,
    emailStatus: row.emailStatus || '',
    emailError: row.emailError || '',
    createdAt: row.createdAt || null,
  };
}

function getCouponById(couponId) {
  const id = Number(couponId);
  if (!Number.isInteger(id)) return null;
  const row = db
    .prepare(
      `SELECT id,
              code,
              description,
              discount_type AS discountType,
              discount_value AS discountValue,
              applies_to AS appliesTo,
              max_redemptions AS maxRedemptions,
              per_user_limit AS perUserLimit,
              expires_at AS expiresAt,
              active,
              recipient_email AS recipientEmail,
              recipient_name AS recipientName,
              emailed_at AS emailedAt,
              email_status AS emailStatus,
              email_error AS emailError,
              created_at AS createdAt
       FROM coupons
       WHERE id = ?`
    )
    .get(id);
  if (!row) return null;
  return {
    id: Number(row.id),
    code: row.code || '',
    description: row.description || '',
    discountType: row.discountType || 'percent',
    discountValue: Number(row.discountValue || 0),
    appliesTo: row.appliesTo || 'all',
    maxRedemptions: row.maxRedemptions == null ? null : Number(row.maxRedemptions),
    perUserLimit: Number(row.perUserLimit || 1),
    expiresAt: row.expiresAt || null,
    active: Number(row.active || 0) === 1,
    recipientEmail: row.recipientEmail || '',
    recipientName: row.recipientName || '',
    emailedAt: row.emailedAt || null,
    emailStatus: row.emailStatus || '',
    emailError: row.emailError || '',
    createdAt: row.createdAt || null,
  };
}

function generateUniqueCouponCode() {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = generateCouponCode('H2');
    if (!getCouponByCode(candidate)) return candidate;
  }
  return generateCouponCode(`H2${Date.now().toString(36).toUpperCase()}`);
}

function getCouponRedemptionStats(couponId, userId) {
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) AS userTotal
       FROM coupon_redemptions
       WHERE coupon_id = ?`
    )
    .get(Number(userId), Number(couponId));
  return {
    total: Number(totals?.total || 0),
    userTotal: Number(totals?.userTotal || 0),
  };
}

function calculateCouponDiscountPaise(coupon, subtotalAmountPaise) {
  const subtotal = Math.max(0, Math.round(Number(subtotalAmountPaise || 0)));
  if (!coupon || subtotal <= 0) return 0;

  let discountPaise = 0;
  if (coupon.discountType === 'flat') {
    discountPaise = Math.round(Number(coupon.discountValue || 0) * 100);
  } else {
    discountPaise = Math.round(subtotal * (Number(coupon.discountValue || 0) / 100));
  }

  if (!Number.isFinite(discountPaise) || discountPaise <= 0) return 0;
  return Math.min(discountPaise, Math.max(0, subtotal - 100));
}

function validateCouponForUser({ code, userId, appliesTo, subtotalAmountPaise }) {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) {
    return {
      coupon: null,
      couponCode: '',
      discountAmountPaise: 0,
      finalAmountPaise: Math.max(0, Math.round(Number(subtotalAmountPaise || 0))),
      originalAmountPaise: Math.max(0, Math.round(Number(subtotalAmountPaise || 0))),
    };
  }

  const coupon = getCouponByCode(normalizedCode);
  if (!coupon || !coupon.active) {
    return { error: 'Invalid coupon code.' };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= Date.now()) {
    return { error: 'This coupon has expired.' };
  }
  if (!['all', appliesTo].includes(String(coupon.appliesTo || 'all'))) {
    return { error: 'This coupon is not valid for this payment.' };
  }

  const stats = getCouponRedemptionStats(coupon.id, userId);
  if (Number.isFinite(coupon.maxRedemptions) && coupon.maxRedemptions > 0 && stats.total >= coupon.maxRedemptions) {
    return { error: 'This coupon has reached its maximum usage limit.' };
  }
  if (Number(coupon.perUserLimit || 1) > 0 && stats.userTotal >= Number(coupon.perUserLimit || 1)) {
    return { error: 'You have already used this coupon.' };
  }

  const originalAmountPaise = Math.max(0, Math.round(Number(subtotalAmountPaise || 0)));
  const discountAmountPaise = calculateCouponDiscountPaise(coupon, originalAmountPaise);
  if (discountAmountPaise <= 0) {
    return { error: 'This coupon does not apply to the current payable amount.' };
  }

  return {
    coupon,
    couponCode: normalizedCode,
    originalAmountPaise,
    discountAmountPaise,
    finalAmountPaise: Math.max(100, originalAmountPaise - discountAmountPaise),
  };
}

function serializeCouponPreview(result) {
  return {
    code: result?.coupon?.code || result?.couponCode || '',
    description: result?.coupon?.description || '',
    discountType: result?.coupon?.discountType || '',
    appliesTo: result?.coupon?.appliesTo || '',
    originalAmountInr: Math.round(Number(result?.originalAmountPaise || 0) / 100),
    discountAmountInr: Math.round(Number(result?.discountAmountPaise || 0) / 100),
    payableAmountInr: Math.round(Number(result?.finalAmountPaise || 0) / 100),
  };
}

function recordCouponRedemption({ couponId, userId, contextType, contextRef, discountAmountPaise }) {
  if (!Number.isInteger(Number(couponId)) || !Number.isInteger(Number(userId))) return;
  const normalizedContextRef = String(contextRef || '').trim();
  const exists = db
    .prepare(
      `SELECT id
       FROM coupon_redemptions
       WHERE coupon_id = ?
         AND user_id = ?
         AND context_type = ?
         AND context_ref = ?`
    )
    .get(Number(couponId), Number(userId), String(contextType || '').trim(), normalizedContextRef);
  if (exists) return;

  db.prepare(
    `INSERT INTO coupon_redemptions (
      coupon_id, user_id, context_type, context_ref, discount_amount_paise, created_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).run(
    Number(couponId),
    Number(userId),
    String(contextType || '').trim(),
    normalizedContextRef,
    Math.max(0, Math.round(Number(discountAmountPaise || 0)))
  );
}

function resolveAdminCustomerContext({ userId, customerName, customerEmail, customerPhone, createIfMissing = false } = {}) {
  const normalizedName = String(customerName || '').trim();
  const normalizedEmail = String(customerEmail || '').trim().toLowerCase();
  const normalizedPhone = String(customerPhone || '').trim();
  const numericUserId = Number(userId);

  if (normalizedEmail && !isValidEmail(normalizedEmail)) {
    return { error: 'valid customerEmail is required' };
  }

  let existingUser = null;
  if (Number.isInteger(numericUserId)) {
    existingUser = getUserById(numericUserId);
  } else if (normalizedEmail) {
    existingUser = getUserByEmail(normalizedEmail);
  }

  if (existingUser) {
    if (String(existingUser.role || '').toLowerCase() !== 'user') {
      return { error: 'customer account is invalid' };
    }

    const nextName = normalizedName || existingUser.name;
    const nextPhone = normalizedPhone || existingUser.mobile || '';
    if (nextName !== existingUser.name || nextPhone !== (existingUser.mobile || '')) {
      db.prepare('UPDATE users SET name = ?, mobile = ? WHERE id = ?').run(nextName, nextPhone, existingUser.id);
      existingUser = getUserById(existingUser.id);
    }
    return { user: existingUser, existingUser: true };
  }

  if (!createIfMissing) {
    if (!normalizedEmail) {
      return { user: null, existingUser: false };
    }
    return {
      user: {
        id: null,
        role: 'user',
        name: normalizedName || 'Customer',
        email: normalizedEmail,
        mobile: normalizedPhone,
        membershipStatus: 'inactive',
        membershipExpiresAt: null,
        membershipPeopleCount: null,
      },
      existingUser: false,
    };
  }

  if (!normalizedName || !normalizedEmail || !normalizedPhone) {
    return { error: 'customerName, customerEmail, and customerPhone are required' };
  }

  const passwordHash = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 10);
  try {
    const insert = db
      .prepare(
        `INSERT INTO users (name, email, mobile, password_hash, role, created_at)
         VALUES (?, ?, ?, ?, 'user', datetime('now'))`
      )
      .run(normalizedName, normalizedEmail, normalizedPhone, passwordHash);
    return { user: getUserById(insert.lastInsertRowid), existingUser: false, createdUser: true };
  } catch {
    const fallbackUser = getUserByEmail(normalizedEmail);
    if (!fallbackUser || String(fallbackUser.role || '').toLowerCase() !== 'user') {
      return { error: 'Unable to create customer account' };
    }
    db.prepare('UPDATE users SET name = ?, mobile = ? WHERE id = ?').run(normalizedName, normalizedPhone, fallbackUser.id);
    return { user: getUserById(fallbackUser.id), existingUser: true };
  }
}

function createPaymentAccessToken(bookingId, userId) {
  return jwt.sign(
    {
      scope: 'booking_payment',
      bookingId: Number(bookingId),
      userId: Number(userId),
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function verifyPaymentAccessToken(token) {
  try {
    const payload = jwt.verify(String(token || ''), JWT_SECRET);
    if (payload?.scope !== 'booking_payment') return null;
    return {
      bookingId: Number(payload.bookingId),
      userId: Number(payload.userId),
    };
  } catch {
    return null;
  }
}

function getRequestOrigin(req) {
  return `${req.protocol}://${req.get('host')}`;
}

function buildBookingPaymentLink(req, bookingId, userId) {
  const token = createPaymentAccessToken(bookingId, userId);
  return `${getRequestOrigin(req)}/payment.html?token=${encodeURIComponent(token)}`;
}

function buildRazorpayReceipt(prefix, identifier = '') {
  const safePrefix = String(prefix || 'ord')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8) || 'ord';
  const safeIdentifier = String(identifier || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(-12);
  const stamp = Date.now().toString(36);
  return [safePrefix, safeIdentifier, stamp].filter(Boolean).join('_').slice(0, 40);
}

function getCurrentSqliteTimestamp() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function getRazorpayOrderErrorMessage(error, fallbackMessage) {
  const message =
    error?.error?.description ||
    error?.description ||
    error?.error?.message ||
    error?.message ||
    fallbackMessage;
  return String(message || fallbackMessage || 'Razorpay request failed');
}

function parseSqliteDateToUtcMs(value) {
  const raw = String(value || '').trim();
  if (!raw) return NaN;
  if (raw.includes('T')) {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? NaN : parsed;
  }
  const parsed = Date.parse(`${raw.replace(' ', 'T')}Z`);
  return Number.isNaN(parsed) ? NaN : parsed;
}

function isHoldEligible(status, paymentStatus) {
  const normalizedStatus = String(status || '').toLowerCase();
  if (normalizedStatus !== 'pending') return false;
  const normalizedPayment = String(paymentStatus || '').toLowerCase();
  return normalizedPayment !== 'paid';
}

function getBookingHoldMeta(booking) {
  if (!booking || !isHoldEligible(booking.status, booking.paymentStatus)) {
    return {
      holdActive: false,
      holdExpired: false,
      holdExpiresAt: '',
      holdRemainingMinutes: 0,
    };
  }

  const createdMs = parseSqliteDateToUtcMs(booking.createdAt);
  if (!Number.isFinite(createdMs)) {
    return {
      holdActive: false,
      holdExpired: false,
      holdExpiresAt: '',
      holdRemainingMinutes: 0,
    };
  }

  const expiresMs = createdMs + BOOKING_HOLD_MINUTES * 60 * 1000;
  const remainingMs = expiresMs - Date.now();
  const holdExpired = remainingMs <= 0;
  return {
    holdActive: !holdExpired,
    holdExpired,
    holdExpiresAt: new Date(expiresMs).toISOString(),
    holdRemainingMinutes: holdExpired ? 0 : Math.ceil(remainingMs / 60000),
  };
}

function isHoldExpiredBooking(booking) {
  return Boolean(getBookingHoldMeta(booking).holdExpired);
}

function applyHoldMeta(booking) {
  const meta = getBookingHoldMeta(booking);
  return { ...booking, ...meta };
}

function activeBookingSql(alias = '') {
  const prefix = alias ? `${alias}.` : '';
  return `(${prefix}status IN ('booked', 'confirmed') OR (${prefix}status = 'pending' AND (${prefix}payment_status = 'paid' OR ${prefix}created_at >= ${BOOKING_HOLD_CUTOFF_SQL})))`;
}

function holdBookingSql(alias = '') {
  const prefix = alias ? `${alias}.` : '';
  return `(${prefix}status = 'pending' AND COALESCE(${prefix}payment_status, '') <> 'paid' AND ${prefix}created_at >= ${BOOKING_HOLD_CUTOFF_SQL})`;
}

function buildHoldSlotMessage() {
  return `This slot is currently on hold. Please try again in ${BOOKING_HOLD_MINUTES} minutes or choose another slot.`;
}

function createSingleBookingResponse(req, res, { targetUser, defaultNotes = '', includeAdminMeta = false } = {}) {
  const payload = validateBookingPayload(req.body, targetUser);
  if (payload.error) return res.status(400).json({ message: payload.error });

  const selectedService = getServiceByName(payload.data.serviceName);
  if (
    selectedService &&
    isAddOnService(selectedService) &&
    hasConflictingAddOnBooking(targetUser.id, payload.data.bookingDate, payload.data.bookingTime)
  ) {
    return res.status(409).json({
      message:
        'Only 1 IV add-on (IV Therapy or IV Shot) can be booked in the same time slot. Additional add-ons are handled by admin after consultation.',
    });
  }
  if (
    selectedService &&
    isAddOnService(selectedService) &&
    hasHydrogenPackageAddOnOnDate(targetUser.id, payload.data.bookingDate)
  ) {
    return res.status(409).json({
      message:
        'A hydrogen package on this date already includes an IV add-on. Separate IV Therapy/IV Shot bookings are not allowed on the same day.',
    });
  }
  if (!includeAdminMeta && selectedService && isAddOnService(selectedService)) {
    const cooldownConflict = findIvCooldownConflict(targetUser.id, payload.data.serviceName, payload.data.bookingDate);
    if (cooldownConflict) {
      return res.status(409).json({
        message: getIvCooldownResponseMessage(cooldownConflict),
      });
    }
  }
  if (selectedService && String(selectedService.category || '').toUpperCase() === 'HYDROGEN SESSION') {
    const dailyLimitConflict = validateHydrogenDailySessionLimit(targetUser.id, [
      { bookingDate: payload.data.bookingDate, bookingTime: payload.data.bookingTime },
    ]);
    if (dailyLimitConflict) {
      return res.status(409).json({
        message: `Only ${dailyLimitConflict.maxAllowed} hydrogen sessions can be booked in one day.`,
      });
    }
  }

  const slotStatus = getSlotCapacityStatus(payload.data.serviceName, payload.data.bookingDate, payload.data.bookingTime);
  if (slotStatus.reached) {
    const message = slotStatus.holdTotal > 0
      ? buildHoldSlotMessage()
      : `This slot is full. Maximum ${slotStatus.maxPerSlot} bookings are allowed.`;
    return res.status(409).json({ message });
  }

  const result = db
    .prepare(
      `INSERT INTO bookings (
        user_id, doctor_id, client_name, client_email, client_phone,
        service_name, booking_date, booking_time, assigned_staff, status, payment_status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
    )
    .run(
      targetUser.id,
      null,
      targetUser.name,
      targetUser.email,
      targetUser.mobile || '-',
      payload.data.serviceName,
      payload.data.bookingDate,
      payload.data.bookingTime,
      'H2 House Of Health',
      selectedService?.membershipOnly ? 'paid' : 'unpaid',
      payload.data.notes || defaultNotes,
      getCurrentSqliteTimestamp()
    );

  const booking = db
    .prepare(
      `SELECT b.id,
              b.user_id AS userId,
              u.name AS clientName,
              u.email AS clientEmail,
              u.mobile AS clientMobile,
              b.service_name AS serviceName,
              b.booking_date AS bookingDate,
              b.booking_time AS bookingTime,
              b.status,
              b.payment_status AS paymentStatus,
              b.paid_at AS paidAt,
              b.notes,
              b.created_at AS createdAt
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       WHERE b.id = ?`
    )
    .get(result.lastInsertRowid);

  if (!includeAdminMeta) {
    return res.status(201).json({ booking });
  }

  return res.status(201).json({
    booking,
    customer: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      mobile: targetUser.mobile || '',
      membershipStatus: targetUser.membershipStatus || 'inactive',
      membershipExpiresAt: targetUser.membershipExpiresAt || null,
      membershipPeopleCount: targetUser.membershipPeopleCount ?? null,
    },
    paymentLinkUrl: selectedService?.membershipOnly ? '' : buildBookingPaymentLink(req, booking.id, targetUser.id),
  });
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'admin only' });
  }
  return next();
}

function requireDoctor(req, res, next) {
  if (req.user?.role !== 'doctor') {
    return res.status(403).json({ message: 'doctor only' });
  }
  return next();
}

function getSlotCapacityStatus(serviceName, bookingDate, bookingTime, excludeBookingId = null) {
  const maxPerSlot = getSlotCapacityForServiceName(serviceName);
  const params = [serviceName, bookingDate, bookingTime];
  let excludeClause = '';
  if (excludeBookingId) {
    excludeClause = 'AND id <> ?';
    params.push(excludeBookingId);
  }
  const row = db
    .prepare(
      `SELECT
          SUM(CASE WHEN ${activeBookingSql()} THEN 1 ELSE 0 END) AS activeTotal,
          SUM(CASE WHEN ${holdBookingSql()} THEN 1 ELSE 0 END) AS holdTotal
       FROM bookings
       WHERE service_name = ?
         AND booking_date = ?
         AND booking_time = ?
         AND status IN ('pending', 'booked', 'confirmed')
         ${excludeClause}`
    )
    .get(...params);
  const activeTotal = Number(row?.activeTotal || 0);
  const holdTotal = Number(row?.holdTotal || 0);
  return {
    maxPerSlot,
    activeTotal,
    holdTotal,
    reached: activeTotal >= maxPerSlot,
  };
}

function isSlotCapacityReached(serviceName, bookingDate, bookingTime, excludeBookingId = null) {
  return getSlotCapacityStatus(serviceName, bookingDate, bookingTime, excludeBookingId).reached;
}

function getSlotCapacityForServiceName(serviceName) {
  const service = getServiceByName(serviceName);
  const category = String(service?.category || '').toUpperCase();
  if (category === 'HYDROGEN SESSION') return MAX_BOOKINGS_PER_SLOT_HYDROGEN;
  if (category === 'IV THERAPIES' || category === 'IV SHOTS') return MAX_BOOKINGS_PER_SLOT_IV;
  return MAX_BOOKINGS_PER_SLOT_HYDROGEN;
}

function getVisibleServicesForUser(user) {
  if (String(user?.role || '').toLowerCase() === 'admin') {
    return SERVICE_CATALOG;
  }
  return SERVICE_CATALOG;
}

function isAddOnService(service) {
  const category = String(service?.category || '').toUpperCase();
  return category === 'IV THERAPIES' || category === 'IV SHOTS';
}

function getAddOnServiceNames() {
  return SERVICE_CATALOG.filter((service) => isAddOnService(service)).map((service) => service.name);
}

function buildExcludedBookingIdsClause(excludeBookingIds = []) {
  const ids = Array.isArray(excludeBookingIds)
    ? excludeBookingIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
    : [];
  if (!ids.length) {
    return { clause: '', params: [] };
  }
  return {
    clause: ` AND id NOT IN (${ids.map(() => '?').join(', ')})`,
    params: ids,
  };
}

function hasConflictingAddOnBooking(userId, bookingDate, bookingTime, excludeBookingId = null) {
  const addOnNames = getAddOnServiceNames();
  if (!addOnNames.length) return false;

  const placeholders = addOnNames.map(() => '?').join(', ');
  if (excludeBookingId) {
    const row = db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM bookings
         WHERE user_id = ?
           AND booking_date = ?
           AND booking_time = ?
           AND ${activeBookingSql()}
           AND service_name IN (${placeholders})
           AND id <> ?`
      )
      .get(userId, bookingDate, bookingTime, ...addOnNames, Number(excludeBookingId));
    return Number(row?.total || 0) > 0;
  }

  const row = db
    .prepare(
      `SELECT COUNT(*) AS total
       FROM bookings
       WHERE user_id = ?
         AND booking_date = ?
         AND booking_time = ?
         AND ${activeBookingSql()}
         AND service_name IN (${placeholders})`
    )
    .get(userId, bookingDate, bookingTime, ...addOnNames);

  return Number(row?.total || 0) > 0;
}

function hasHydrogenPackageAddOnOnDate(userId, bookingDate, excludeBookingIds = []) {
  const addOnNames = getAddOnServiceNames();
  if (!addOnNames.length) return false;

  const placeholders = addOnNames.map(() => '?').join(', ');
  const exclusion = buildExcludedBookingIdsClause(excludeBookingIds);
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total
       FROM bookings
       WHERE user_id = ?
         AND booking_date = ?
         AND booking_group_id IS NOT NULL
         AND ${activeBookingSql()}
         AND service_name IN (${placeholders})
         ${exclusion.clause}`
    )
    .get(userId, bookingDate, ...addOnNames, ...exclusion.params);

  return Number(row?.total || 0) > 0;
}

function hasStandaloneIvBookingOnDate(userId, bookingDate, excludeBookingIds = []) {
  const addOnNames = getAddOnServiceNames();
  if (!addOnNames.length) return false;

  const placeholders = addOnNames.map(() => '?').join(', ');
  const exclusion = buildExcludedBookingIdsClause(excludeBookingIds);
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total
       FROM bookings
       WHERE user_id = ?
         AND booking_date = ?
         AND (booking_group_id IS NULL OR booking_group_id = '')
         AND ${activeBookingSql()}
         AND service_name IN (${placeholders})
         ${exclusion.clause}`
    )
    .get(userId, bookingDate, ...addOnNames, ...exclusion.params);

  return Number(row?.total || 0) > 0;
}

function getIvCooldownResponseMessage(conflict) {
  return `An IV Therapy/IV Shot can be booked again only after 2 weeks. Existing IV booking found on ${conflict?.bookingDate}. Reach out to us to book if you still want this.`;
}

function startOfDayUtcMs(dateString) {
  return new Date(`${String(dateString || '').trim()}T00:00:00`).getTime();
}

function findIvCooldownConflict(userId, serviceName, bookingDate, excludeBookingIds = []) {
  const service = getServiceByName(serviceName);
  if (!isAddOnService(service)) return null;

  const addOnNames = getAddOnServiceNames();
  if (!addOnNames.length) return null;

  const exclusion = buildExcludedBookingIdsClause(excludeBookingIds);
  const placeholders = addOnNames.map(() => '?').join(', ');
  const rows = db
    .prepare(
      `SELECT id, service_name AS serviceName, booking_date AS bookingDate, booking_time AS bookingTime
       FROM bookings
       WHERE user_id = ?
         AND service_name IN (${placeholders})
         AND (status = 'completed' OR ${activeBookingSql()})
         ${exclusion.clause}
       ORDER BY booking_date ASC, booking_time ASC`
    )
    .all(userId, ...addOnNames, ...exclusion.params);

  const targetMs = startOfDayUtcMs(bookingDate);
  if (Number.isNaN(targetMs)) return null;

  for (const row of rows) {
    const existingMs = startOfDayUtcMs(row.bookingDate);
    if (Number.isNaN(existingMs)) continue;
    const diffDays = Math.abs(Math.round((existingMs - targetMs) / 86400000));
    if (diffDays < IV_REBOOK_COOLDOWN_DAYS) {
      return {
        bookingId: Number(row.id),
        bookingDate: row.bookingDate,
        bookingTime: row.bookingTime,
        diffDays,
      };
    }
  }

  return null;
}

function validateHydrogenDailySessionLimit(userId, slots, excludeBookingIds = []) {
  const exclusion = buildExcludedBookingIdsClause(excludeBookingIds);
  const existingRows = db
    .prepare(
      `SELECT booking_date AS bookingDate, COUNT(*) AS total
       FROM bookings
       WHERE user_id = ?
         AND (status = 'completed' OR ${activeBookingSql()})
         AND service_name IN (${SERVICE_CATALOG.filter((item) => String(item.category || '').toUpperCase() === 'HYDROGEN SESSION')
           .map(() => '?')
           .join(', ')})
         ${exclusion.clause}
       GROUP BY booking_date`
    )
    .all(
      userId,
      ...SERVICE_CATALOG.filter((item) => String(item.category || '').toUpperCase() === 'HYDROGEN SESSION').map((item) => item.name),
      ...exclusion.params
    );

  const existingByDate = new Map(existingRows.map((row) => [String(row.bookingDate), Number(row.total || 0)]));
  const requestedByDate = new Map();
  for (const slot of Array.isArray(slots) ? slots : []) {
    const date = String(slot?.bookingDate || '').trim();
    if (!date) continue;
    requestedByDate.set(date, Number(requestedByDate.get(date) || 0) + 1);
  }

  for (const [bookingDate, requestedTotal] of requestedByDate.entries()) {
    const existingTotal = Number(existingByDate.get(bookingDate) || 0);
    if (existingTotal + requestedTotal > MAX_HYDROGEN_SESSIONS_PER_DAY_PER_USER) {
      return {
        bookingDate,
        existingTotal,
        requestedTotal,
        maxAllowed: MAX_HYDROGEN_SESSIONS_PER_DAY_PER_USER,
      };
    }
  }

  return null;
}

function getHydrogenSessionCountFromServiceName(serviceName) {
  const raw = String(serviceName || '').trim();
  const normalized = raw.toLowerCase();
  if (normalized.includes('single')) return 1;

  let match = raw.match(/\((\d+)\s*session/i);
  if (match) return Number(match[1]);

  match = raw.match(/\b(\d+)\s*session/i);
  if (match) return Number(match[1]);

  const cleaned = normalized.replace(/\bh2\b/g, ' ');
  match = cleaned.match(/\b(\d+)\b/);
  return match ? Number(match[1]) : 1;
}

function createBookingGroupId(prefix = 'group') {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function buildHydrogenGroupPaymentSummary(bookings, user) {
  if (!Array.isArray(bookings) || !bookings.length) {
    throw new Error('No bookings available for payment.');
  }

  const hydrogenBookings = bookings.filter((entry) => {
    const service = getServiceByName(entry.serviceName);
    return String(service?.category || '').toUpperCase() === 'HYDROGEN SESSION';
  });
  if (!hydrogenBookings.length) {
    throw new Error('Grouped payment is only supported for hydrogen package bookings.');
  }

  const baseService = getServiceByName(hydrogenBookings[0].serviceName);
  if (!baseService) {
    throw new Error('Invalid hydrogen service configured on booking group.');
  }

  const packageSessions = getHydrogenSessionCountFromServiceName(baseService.name);
  const singleSessionService =
    SERVICE_CATALOG.find(
      (item) =>
        String(item.category || '').toUpperCase() === 'HYDROGEN SESSION' &&
        getHydrogenSessionCountFromServiceName(item.name) === 1
    ) || baseService;
  const extraSessions = Math.max(0, hydrogenBookings.length - packageSessions);
  const packagePriceInr = getEffectiveServicePriceInr(baseService, user);
  const extraSessionPriceInr = getEffectiveServicePriceInr(singleSessionService, user);
  const addOnBookings = bookings.filter((entry) => {
    const service = getServiceByName(entry.serviceName);
    return isAddOnService(service);
  });
  const addOnItems = addOnBookings.map((entry) => {
    const service = getServiceByName(entry.serviceName);
    return {
      bookingId: entry.id,
      serviceName: entry.serviceName,
      amountInr: getEffectiveServicePriceInr(service, user),
      bookingDate: entry.bookingDate,
      bookingTime: entry.bookingTime,
    };
  });
  const addOnAmountInr = addOnItems.reduce((sum, item) => sum + Number(item.amountInr || 0), 0);
  const totalAmountInr =
    Number(packagePriceInr || 0) + Number(extraSessionPriceInr || 0) * extraSessions + Number(addOnAmountInr || 0);

  return {
    serviceName: baseService.name,
    packageSessions,
    extraSessions,
    packagePriceInr,
    extraSessionPriceInr,
    addOnItems,
    totalAmountInr,
    bookingCount: bookings.length,
  };
}

function getPayableUserBookings(userId) {
  const rows = db
    .prepare(
      `SELECT id,
              user_id AS userId,
              booking_group_id AS bookingGroupId,
              service_name AS serviceName,
              booking_date AS bookingDate,
              booking_time AS bookingTime,
              status,
              payment_status AS paymentStatus,
              created_at AS createdAt
       FROM bookings
       WHERE user_id = ?
         AND status <> 'cancelled'
         AND payment_status <> 'paid'
       ORDER BY booking_date, booking_time, id`
    )
    .all(userId);

  return rows.filter((entry) => {
    if (isHoldExpiredBooking(entry)) return false;
    const service = getServiceByName(entry.serviceName);
    return service && !service.membershipOnly;
  });
}

function buildAggregatePaymentSummary(bookings, user) {
  if (!Array.isArray(bookings) || !bookings.length) {
    throw new Error('No bookings available for payment.');
  }

  const byKey = new Map();
  for (const booking of bookings) {
    const key = booking.bookingGroupId || `single_${booking.id}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(booking);
  }

  const units = [];
  let totalAmountInr = 0;
  for (const [groupKey, entries] of byKey.entries()) {
    const hydrogenEntries = entries.filter((entry) => {
      const service = getServiceByName(entry.serviceName);
      return String(service?.category || '').toUpperCase() === 'HYDROGEN SESSION';
    });

    if (groupKey.startsWith('hydrogen_') || hydrogenEntries.length) {
      const summary = buildHydrogenGroupPaymentSummary(entries, user);
      units.push({
        type: 'hydrogen_package',
        key: groupKey,
        label: summary.serviceName,
        amountInr: Number(summary.totalAmountInr || 0),
        bookingCount: Number(summary.bookingCount || entries.length),
      });
      totalAmountInr += Number(summary.totalAmountInr || 0);
      continue;
    }

    const booking = entries[0];
    const service = getServiceByName(booking.serviceName);
    if (!service || service.membershipOnly) continue;
    const amountInr = Number(getEffectiveServicePriceInr(service, user) || 0);
    units.push({
      type: 'single',
      key: groupKey,
      label: booking.serviceName,
      amountInr,
      bookingCount: 1,
    });
    totalAmountInr += amountInr;
  }

  return {
    unitCount: units.length,
    bookingCount: bookings.length,
    totalAmountInr,
    units,
  };
}

function markBookingPaid(bookingId, paymentOrderId, paymentRef) {
  if (!Number.isInteger(Number(bookingId))) return;

  const orderId = String(paymentOrderId || '');
  const paymentId = String(paymentRef || '');
  db.prepare(
    `UPDATE bookings
     SET payment_status = 'paid',
         paid_at = CASE WHEN paid_at IS NULL THEN datetime('now') ELSE paid_at END,
         payment_order_id = CASE WHEN ? <> '' THEN ? ELSE payment_order_id END,
         payment_reference = CASE WHEN ? <> '' THEN ? ELSE payment_reference END,
         status = CASE WHEN status = 'pending' THEN 'booked' ELSE status END
     WHERE id = ?`
  ).run(orderId, orderId, paymentId, paymentId, Number(bookingId));
}

const USER_PROFILE_SELECT = `SELECT id, name, email, role, age, gender, mobile, avatar_url AS avatarUrl,
        membership_status AS membershipStatus, membership_plan AS membershipPlan,
        membership_started_at AS membershipStartedAt, membership_expires_at AS membershipExpiresAt,
        membership_people_count AS membershipPeopleCount, membership_subscription_id AS membershipSubscriptionId
 FROM users`;

function getMembershipSubscriptionId(ownerUserId) {
  return Number.isInteger(Number(ownerUserId)) ? `membership:${Number(ownerUserId)}` : '';
}

function getUserProfileById(userId) {
  if (!Number.isInteger(Number(userId))) return null;
  return db.prepare(`${USER_PROFILE_SELECT} WHERE id = ?`).get(Number(userId));
}

function getUserProfileByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;
  return db.prepare(`${USER_PROFILE_SELECT} WHERE email = ?`).get(normalizedEmail);
}

function refreshMembershipSubscriptionStates() {
  db.prepare(
    `UPDATE membership_subscriptions
     SET status = CASE
       WHEN datetime(expires_at) <= datetime('now') THEN 'expired'
       ELSE 'active'
     END,
         updated_at = datetime('now')`
  ).run();
}

function getMembershipSubscriptionById(subscriptionId) {
  const normalizedId = String(subscriptionId || '').trim();
  if (!normalizedId) return null;
  refreshMembershipSubscriptionStates();
  return db
    .prepare(
      `SELECT subscription_id AS subscriptionId, owner_user_id AS ownerUserId, plan_id AS planId,
              people_count AS peopleCount, status, started_at AS startedAt, expires_at AS expiresAt
       FROM membership_subscriptions
       WHERE subscription_id = ?`
    )
    .get(normalizedId);
}

function isMembershipSubscriptionActive(subscription) {
  if (!subscription) return false;
  if (String(subscription.status || '').toLowerCase() !== 'active') return false;
  const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt).getTime() : NaN;
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

function findMembershipMemberByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;
  refreshMembershipSubscriptionStates();
  return db
    .prepare(
      `SELECT mm.id, mm.subscription_id AS subscriptionId, mm.user_id AS userId, mm.email, mm.name, mm.place,
              mm.contact_number AS contactNumber, mm.is_registered AS isRegistered,
              ms.owner_user_id AS ownerUserId, ms.plan_id AS planId, ms.people_count AS peopleCount,
              ms.status, ms.started_at AS startedAt, ms.expires_at AS expiresAt
       FROM membership_subscription_members mm
       JOIN membership_subscriptions ms ON ms.subscription_id = mm.subscription_id
       WHERE mm.email = ?
       ORDER BY CASE WHEN ms.status = 'active' THEN 0 ELSE 1 END, datetime(ms.expires_at) DESC, mm.id DESC
       LIMIT 1`
    )
    .get(normalizedEmail);
}

function setUserMembershipState(userId, subscription) {
  if (!Number.isInteger(Number(userId))) return;
  if (subscription && isMembershipSubscriptionActive(subscription)) {
    db.prepare(
      `UPDATE users
       SET membership_status = 'active',
           membership_plan = ?,
           membership_started_at = ?,
           membership_expires_at = ?,
           membership_people_count = ?,
           membership_subscription_id = ?
       WHERE id = ?`
    ).run(
      String(subscription.planId || ''),
      subscription.startedAt || null,
      subscription.expiresAt || null,
      Number(subscription.peopleCount || 1),
      String(subscription.subscriptionId || ''),
      Number(userId)
    );
    return;
  }

  db.prepare(
    `UPDATE users
     SET membership_status = 'inactive',
         membership_plan = NULL,
         membership_started_at = NULL,
         membership_expires_at = NULL,
         membership_people_count = NULL,
         membership_subscription_id = NULL
     WHERE id = ?`
  ).run(Number(userId));
}

function syncMembershipStatusForSubscription(subscriptionId) {
  const subscription = getMembershipSubscriptionById(subscriptionId);
  const members = db
    .prepare(
      `SELECT user_id AS userId
       FROM membership_subscription_members
       WHERE subscription_id = ?
         AND user_id IS NOT NULL`
    )
    .all(String(subscriptionId || ''));

  members.forEach((member) => {
    if (Number.isInteger(Number(member.userId))) {
      setUserMembershipState(member.userId, subscription);
    }
  });
}

function syncMembershipForUser({ userId, email } = {}) {
  const numericUserId = Number(userId);
  let user = Number.isInteger(numericUserId) ? getUserProfileById(numericUserId) : null;
  const normalizedEmail = String(email || user?.email || '').trim().toLowerCase();
  if (!user && normalizedEmail) {
    user = getUserProfileByEmail(normalizedEmail);
  }
  if (!user) return null;

  const linkedMember = findMembershipMemberByEmail(normalizedEmail);
  if (!linkedMember) {
    if (user.membershipSubscriptionId) {
      setUserMembershipState(user.id, null);
    }
    return getUserProfileById(user.id);
  }

  if (!linkedMember.userId || Number(linkedMember.userId) !== Number(user.id) || Number(linkedMember.isRegistered) !== 1) {
    db.prepare(
      `UPDATE membership_subscription_members
       SET user_id = ?, is_registered = 1, updated_at = datetime('now')
       WHERE id = ?`
    ).run(Number(user.id), Number(linkedMember.id));
  }

  setUserMembershipState(user.id, linkedMember);
  return getUserProfileById(user.id);
}

function validateSubscriptionMemberConflicts(subscriptionId, members) {
  for (const member of Array.isArray(members) ? members : []) {
    const existing = db
      .prepare(
        `SELECT mm.email, mm.subscription_id AS subscriptionId
         FROM membership_subscription_members mm
         JOIN membership_subscriptions ms ON ms.subscription_id = mm.subscription_id
         WHERE mm.email = ?
           AND mm.subscription_id <> ?
           AND ms.status = 'active'
           AND datetime(ms.expires_at) > datetime('now')
         LIMIT 1`
      )
      .get(String(member?.email || '').trim().toLowerCase(), String(subscriptionId || ''));

    if (existing) {
      return {
        error: `${member.email} is already linked to another active subscription. Remove it there before reusing it here.`,
      };
    }
  }

  return { ok: true };
}

function saveMembershipSubscriptionMembers({ ownerUserId, subscriptionId, planId, peopleCount, startedAt, expiresAt, members }) {
  const normalizedSubscriptionId = String(subscriptionId || '').trim();
  if (!normalizedSubscriptionId) {
    return { error: 'Missing subscription id.' };
  }

  const conflict = validateSubscriptionMemberConflicts(normalizedSubscriptionId, members);
  if (conflict.error) return conflict;

  db.prepare(
    `INSERT INTO membership_subscriptions (
      subscription_id, owner_user_id, plan_id, people_count, status, started_at, expires_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'active', ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(subscription_id) DO UPDATE SET
      owner_user_id = excluded.owner_user_id,
      plan_id = excluded.plan_id,
      people_count = excluded.people_count,
      status = 'active',
      started_at = excluded.started_at,
      expires_at = excluded.expires_at,
      updated_at = datetime('now')`
  ).run(
    normalizedSubscriptionId,
    Number(ownerUserId),
    String(planId || ''),
    Number(peopleCount || 1),
    startedAt || null,
    expiresAt || null
  );

  const previousMembers = db
    .prepare(
      `SELECT DISTINCT user_id AS userId
       FROM membership_subscription_members
       WHERE subscription_id = ?
         AND user_id IS NOT NULL`
    )
    .all(normalizedSubscriptionId);

  db.prepare('DELETE FROM membership_subscription_members WHERE subscription_id = ?').run(normalizedSubscriptionId);

  const insertMember = db.prepare(
    `INSERT INTO membership_subscription_members (
      subscription_id, user_id, email, name, place, contact_number, is_registered, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  );

  for (const member of members) {
    const matchedUser = getUserByEmail(member.email);
    const userId = Number(matchedUser?.id || 0) || null;
    const isRegistered = userId ? 1 : 0;
    insertMember.run(
      normalizedSubscriptionId,
      userId,
      String(member.email || '').trim().toLowerCase(),
      String(member.name || '').trim(),
      String(member.place || '').trim(),
      String(member.contactNumber || '').trim(),
      isRegistered
    );
  }

  syncMembershipStatusForSubscription(normalizedSubscriptionId);
  previousMembers.forEach((member) => {
    if (Number.isInteger(Number(member.userId))) {
      syncMembershipForUser({ userId: Number(member.userId) });
    }
  });
  return { ok: true };
}

function backfillMembershipSubscriptionsFromOrders() {
  const paidOrders = db
    .prepare(
      `SELECT mpo.order_id AS orderId, mpo.user_id AS userId, mpo.plan_id AS planId,
              mpo.people_count AS peopleCount, mpo.member_details_json AS memberDetailsJson,
              mpo.paid_at AS paidAt, mpo.created_at AS createdAt,
              u.email AS ownerEmail,
              u.membership_plan AS membershipPlan,
              u.membership_started_at AS membershipStartedAt,
              u.membership_expires_at AS membershipExpiresAt
       FROM membership_payment_orders mpo
       JOIN users u ON u.id = mpo.user_id
       WHERE mpo.status = 'paid'
       ORDER BY mpo.user_id ASC, datetime(COALESCE(mpo.paid_at, mpo.created_at)) DESC, mpo.created_at DESC`
    )
    .all();

  const processedOwners = new Set();
  for (const order of paidOrders) {
    const ownerUserId = Number(order.userId);
    if (!Number.isInteger(ownerUserId) || processedOwners.has(ownerUserId)) continue;
    processedOwners.add(ownerUserId);

    const subscriptionId = getMembershipSubscriptionId(ownerUserId);
    const existingMembers = db
      .prepare(
        `SELECT COUNT(1) AS count
         FROM membership_subscription_members
         WHERE subscription_id = ?`
      )
      .get(subscriptionId);
    if (Number(existingMembers?.count || 0) > 0) continue;

    let members = [];
    try {
      members = order.memberDetailsJson ? JSON.parse(order.memberDetailsJson) : [];
    } catch {
      members = [];
    }

    const expectedCount = Number(order.peopleCount || 1);
    const membersResult = normalizeMembershipMembers(members, expectedCount);
    if (membersResult.error) continue;

    const normalizedMembers = membersResult.data;
    const ownerEmail = String(order.ownerEmail || '').trim().toLowerCase();
    if (!normalizedMembers.some((member) => String(member.email || '').trim().toLowerCase() === ownerEmail)) {
      continue;
    }

    const startedAt = order.membershipStartedAt || order.paidAt || order.createdAt || new Date().toISOString();
    const planId =
      String(order.membershipPlan || '').trim() ||
      (String(order.planId || '').trim() === 'h2_add_person' ? 'h2_single' : String(order.planId || '').trim());
    const plan = MEMBERSHIP_PLANS.find((item) => item.id === planId) || MEMBERSHIP_PLANS.find((item) => item.id === 'h2_single');
    const expiresAt =
      order.membershipExpiresAt ||
      new Date(
        new Date(startedAt).getTime() + Number(plan?.validityDays || MEMBERSHIP_VALIDITY_DAYS) * 24 * 60 * 60 * 1000
      ).toISOString();

    saveMembershipSubscriptionMembers({
      ownerUserId,
      subscriptionId,
      planId,
      peopleCount: expectedCount,
      startedAt,
      expiresAt,
      members: normalizedMembers,
    });
  }
}

function setAuthCookie(res, user) {
  const token = jwt.sign(
    { sub: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function requireAuth(req, res, next) {
  const token = req.cookies[TOKEN_COOKIE];
  if (!token) return res.status(401).json({ message: 'unauthorized' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    syncMembershipForUser({ userId: Number(payload.sub) });
    const user = getUserProfileById(Number(payload.sub));

    if (!user) return res.status(401).json({ message: 'unauthorized' });

    req.user = {
      id: Number(user.id),
      name: String(user.name),
      email: String(user.email),
      role: String(user.role || 'user'),
      age: user.age ?? null,
      gender: user.gender || '',
      mobile: user.mobile || '',
      avatarUrl: user.avatarUrl || '',
      membershipStatus: user.membershipStatus || 'inactive',
      membershipPlan: user.membershipPlan || '',
      membershipStartedAt: user.membershipStartedAt || null,
      membershipExpiresAt: user.membershipExpiresAt || null,
      membershipPeopleCount: user.membershipPeopleCount ?? null,
      membershipSubscriptionId: user.membershipSubscriptionId || null,
    };

    return next();
  } catch {
    return res.status(401).json({ message: 'unauthorized' });
  }
}

function validateBookingPayload(body, user) {
  if (!body || typeof body !== 'object') {
    return { error: 'invalid payload' };
  }

  const serviceName = String(body.serviceName || '').trim();
  const bookingDate = String(body.bookingDate || '').trim();
  const bookingTime = String(body.bookingTime || '').trim();
  const notes = String(body.notes || '').trim();

  if (!serviceName || !bookingDate || !bookingTime) {
    return { error: 'serviceName, bookingDate, bookingTime are required' };
  }

  const service = getServiceByName(serviceName);
  if (!service) {
    return { error: 'Invalid service selected.' };
  }

  if (service.membershipOnly && !isMembershipActiveForUser(user)) {
    return { error: '✨ An exclusive benefit for our members. Activate your membership to enjoy this service at no cost.' };
  }

  const selectedDate = new Date(`${bookingDate}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) {
    return { error: 'bookingDate is invalid' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    return { error: 'bookingDate cannot be in the past' };
  }

  if (!ALLOWED_SLOT_START_TIMES.includes(bookingTime)) {
    return { error: 'bookingTime must be one of the allowed 1-hour slots' };
  }

  if (isBookingSlotInPast(bookingDate, bookingTime)) {
    return { error: 'bookingTime cannot be in the past for the selected date' };
  }

  return {
    data: {
      serviceName,
      bookingDate,
      bookingTime,
      notes,
    },
  };
}

function isBookingSlotInPast(bookingDate, bookingTime) {
  const normalizedDate = String(bookingDate || '').trim();
  const normalizedTime = String(bookingTime || '').trim();
  if (!normalizedDate || !normalizedTime) return false;
  const slotDateTime = new Date(`${normalizedDate}T${normalizedTime}:00`);
  if (Number.isNaN(slotDateTime.getTime())) return false;
  return slotDateTime.getTime() < Date.now();
}

function normalizeMembershipMembers(rawMembers, expectedCount) {
  if (!Number.isInteger(expectedCount) || expectedCount <= 0) {
    return { error: 'Invalid people count for membership.' };
  }

  if (!Array.isArray(rawMembers)) {
    return { error: 'memberDetails must be provided for all members.' };
  }

  if (rawMembers.length !== expectedCount) {
    return { error: `Please provide details for exactly ${expectedCount} member(s).` };
  }

  const normalized = [];
  const seenEmails = new Set();
  for (let i = 0; i < rawMembers.length; i += 1) {
    const item = rawMembers[i] || {};
    const name = String(item.name || '').trim();
    const place = String(item.place || '').trim();
    const email = String(item.email || '').trim().toLowerCase();
    const contactNumber = String(item.contactNumber || '').trim();

    if (!name || !place || !email || !contactNumber) {
      return { error: `Member ${i + 1}: name, place, email, and contact number are required.` };
    }
    if (!isValidEmail(email)) {
      return { error: `Member ${i + 1}: valid email is required.` };
    }
    if (seenEmails.has(email)) {
      return { error: `Member ${i + 1}: duplicate email entries are not allowed.` };
    }
    seenEmails.add(email);

    normalized.push({ name, place, email, contactNumber });
  }

  return { data: normalized };
}

function isMembershipActiveForUser(user) {
  if (!user) return false;
  if (String(user.membershipStatus || '').toLowerCase() !== 'active') return false;
  const startedAt = user.membershipStartedAt ? new Date(user.membershipStartedAt).getTime() : null;
  const storedExpiresAt = user.membershipExpiresAt ? new Date(user.membershipExpiresAt).getTime() : null;
  const normalizedExpiresAt =
    Number.isFinite(startedAt) && startedAt > 0 ? startedAt + MEMBERSHIP_VALIDITY_DAYS * 24 * 60 * 60 * 1000 : storedExpiresAt;
  const expiresAt = Number.isFinite(normalizedExpiresAt) ? normalizedExpiresAt : null;
  if (!expiresAt) return false;
  return expiresAt > Date.now();
}

function getEffectiveServicePriceInr(service, user) {
  if (!service) return 0;
  const category = String(service.category || '').toUpperCase();
  const isHydrogen = category === 'HYDROGEN SESSION';
  const membershipActive = isMembershipActiveForUser(user);
  const userPhone = user?.mobile || '';

  if (service.membershipOnly) {
    return membershipActive ? Number(service.priceInr || 0) : 0;
  }

  if (category === 'IV THERAPIES' || category === 'IV SHOTS') {
    return applyPhoneDiscount(Number(service.priceInr || 0), userPhone);
  }

  if (isHydrogen && membershipActive && Number(service.memberPriceInr) > 0) {
    return applyPhoneDiscount(Number(service.memberPriceInr), userPhone);
  }

  if (isHydrogen && Number(service.nonMemberPriceInr) > 0) {
    return applyPhoneDiscount(Number(service.nonMemberPriceInr), userPhone);
  }

  return applyPhoneDiscount(Number(service.priceInr || 0), userPhone);
}

function toServiceResponse(service, user) {
  const membershipActive = isMembershipActiveForUser(user);
  const effectivePriceInr = getEffectiveServicePriceInr(service, user);
  const discountPercent = getDiscountPercentForPhone(user?.mobile || '');
  return {
    ...service,
    effectivePriceInr,
    membershipActive,
    discountPercent,
  };
}

function getServiceByName(name) {
  const normalized = String(name || '').trim().toLowerCase();
  return SERVICE_CATALOG.find((service) => service.name.toLowerCase() === normalized) || null;
}

function validateDoctorPayload(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'invalid payload' };
  }

  const data = {
    name: String(body.name || '').trim(),
    specialty: String(body.specialty || '').trim(),
    bio: String(body.bio || '').trim(),
    experienceYears: Number(body.experienceYears),
    consultationFee: Number(body.consultationFee),
    availableDays: String(body.availableDays || '').trim(),
  };

  if (!data.name || !data.specialty || !data.bio || !data.availableDays) {
    return { error: 'name, specialty, bio, and availableDays are required' };
  }
  if (!Number.isInteger(data.experienceYears) || data.experienceYears < 0 || data.experienceYears > 80) {
    return { error: 'experienceYears must be between 0 and 80' };
  }
  if (!Number.isFinite(data.consultationFee) || data.consultationFee <= 0 || data.consultationFee > 100000) {
    return { error: 'consultationFee must be a valid positive number' };
  }
  const days = normalizeAvailableDays(data.availableDays);
  if (days.error) return days;
  data.availableDays = days.value;

  return { data };
}

function validateDoctorSelfProfilePayload(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'invalid payload' };
  }

  const data = {
    specialty: String(body.specialty || '').trim(),
    bio: String(body.bio || '').trim(),
    experienceYears: Number(body.experienceYears),
    consultationFee: Number(body.consultationFee),
    availableDays: String(body.availableDays || '').trim(),
  };

  if (!data.specialty || !data.bio || !data.availableDays) {
    return { error: 'specialty, bio, and availableDays are required' };
  }
  if (!Number.isInteger(data.experienceYears) || data.experienceYears < 0 || data.experienceYears > 80) {
    return { error: 'experienceYears must be between 0 and 80' };
  }
  if (!Number.isFinite(data.consultationFee) || data.consultationFee <= 0 || data.consultationFee > 100000) {
    return { error: 'consultationFee must be a valid positive number' };
  }
  const days = normalizeAvailableDays(data.availableDays);
  if (days.error) return days;
  data.availableDays = days.value;

  return { data };
}

function normalizeAvailableDays(availableDays) {
  const order = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const valid = new Set(order);
  const selected = new Set(
    String(availableDays || '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  );

  if (selected.size === 0) {
    return { error: 'please select at least one available day' };
  }

  for (const day of selected) {
    if (!valid.has(day)) {
      return { error: 'availableDays must be comma-separated weekday codes like Sun, Mon, Tue' };
    }
  }

  return {
    value: order.filter((day) => selected.has(day)).join(', '),
  };
}

function weekdayShortFromDate(dateISO) {
  const [year, month, day] = String(dateISO || '').split('-').map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return '';
  const date = new Date(year, month - 1, day);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] || '';
}

function isDoctorAvailableOnDate(availableDays, bookingDate) {
  const weekday = weekdayShortFromDate(bookingDate);
  if (!weekday) return false;
  const allowed = new Set(
    String(availableDays || '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  );
  return allowed.has(weekday);
}

function isValidStatus(status) {
  return ['pending', 'booked', 'confirmed', 'completed', 'cancelled'].includes(status);
}

function hasColumn(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((column) => column.name === columnName);
}

function hasTable(tableName) {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(String(tableName || ''));
  return Boolean(row);
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function regionFromSmtpHost(host) {
  const match = String(host || '')
    .trim()
    .toLowerCase()
    .match(/^email-smtp\.([a-z0-9-]+)\.amazonaws\.com$/);
  return match?.[1] || '';
}

function hasSesApiCredentials() {
  return Boolean(SES_API_ACCESS_KEY_ID && SES_API_SECRET_ACCESS_KEY && SES_API_REGION);
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
}

function hmacSha256(key, value, encoding) {
  return crypto.createHmac('sha256', key).update(value, 'utf8').digest(encoding);
}

function amzDateParts(date = new Date()) {
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

function awsSigV4Authorization({ method, host, canonicalUri, payloadHash, amzDate, dateStamp, includeContentHeaders = true }) {
  const service = 'ses';
  const credentialScope = `${dateStamp}/${SES_API_REGION}/${service}/aws4_request`;

  const baseHeaders = {
    host,
    'x-amz-date': amzDate,
  };
  if (includeContentHeaders) {
    baseHeaders['content-type'] = 'application/json';
    baseHeaders['x-amz-content-sha256'] = payloadHash;
  }
  if (SES_API_SESSION_TOKEN) {
    baseHeaders['x-amz-security-token'] = SES_API_SESSION_TOKEN;
  }

  const sortedHeaderKeys = Object.keys(baseHeaders).sort();
  const canonicalHeaders = sortedHeaderKeys
    .map((key) => `${key}:${String(baseHeaders[key]).trim()}\n`)
    .join('');
  const signedHeaders = sortedHeaderKeys.join(';');
  const canonicalRequest = [
    method.toUpperCase(),
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmacSha256(`AWS4${SES_API_SECRET_ACCESS_KEY}`, dateStamp);
  const kRegion = hmacSha256(kDate, SES_API_REGION);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, 'aws4_request');
  const signature = hmacSha256(kSigning, stringToSign, 'hex');

  return {
    headers: {
      Host: baseHeaders.host,
      'X-Amz-Date': baseHeaders['x-amz-date'],
      ...(includeContentHeaders ? { 'Content-Type': baseHeaders['content-type'] } : {}),
      ...(includeContentHeaders ? { 'X-Amz-Content-Sha256': baseHeaders['x-amz-content-sha256'] } : {}),
      ...(SES_API_SESSION_TOKEN ? { 'X-Amz-Security-Token': SES_API_SESSION_TOKEN } : {}),
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${SES_API_ACCESS_KEY_ID}/${credentialScope}, ` +
        `SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  };
}

async function sesApiRequest(method, pathName, payload = null) {
  if (!hasSesApiCredentials()) {
    return {
      ok: false,
      configured: false,
      message:
        'SES identity API is not configured. Set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY (or SES_API_* equivalents).',
    };
  }

  const host = `email.${SES_API_REGION}.amazonaws.com`;
  const canonicalUri = String(pathName || '/');
  const body = payload ? JSON.stringify(payload) : '';
  const payloadHash = sha256Hex(body);
  const includeContentHeaders = String(method || '').toUpperCase() !== 'GET';
  const { amzDate, dateStamp } = amzDateParts();
  const signed = awsSigV4Authorization({
    method,
    host,
    canonicalUri,
    payloadHash,
    amzDate,
    dateStamp,
    includeContentHeaders,
  });

  const headers = { ...signed.headers };
  if (body) {
    headers['Content-Length'] = String(Buffer.byteLength(body));
  }

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: host,
        port: 443,
        method,
        path: canonicalUri,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : {};
          } catch {
            parsed = { message: raw };
          }

          const statusCode = Number(res.statusCode || 500);
          if (statusCode >= 200 && statusCode < 300) {
            resolve({ ok: true, data: parsed, statusCode });
            return;
          }

          resolve({
            ok: false,
            statusCode,
            data: parsed,
            message: parsed?.message || parsed?.Message || `SES API request failed with ${statusCode}`,
          });
        });
      }
    );

    req.on('error', (error) => {
      resolve({
        ok: false,
        statusCode: 500,
        message: `SES API request failed: ${error.message}`,
      });
    });

    if (body) req.write(body);
    req.end();
  });
}

async function getSesIdentityStatus(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const result = await sesApiRequest('GET', `/v2/email/identities/${normalizedEmail}`);
  if (!result.ok) {
    if (!result.configured && result.message) {
      return { ok: false, statusCode: 400, message: result.message };
    }
    if (result.statusCode === 404) {
      return { ok: false, statusCode: 404, message: 'Email identity not found. Request verification first.' };
    }
    return { ok: false, statusCode: result.statusCode || 500, message: result.message || 'Unable to read SES identity status.' };
  }

  const status = String(result.data?.VerificationStatus || 'UNKNOWN').toUpperCase();
  return { ok: true, status };
}

async function requestSesRecipientVerification(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!hasSesApiCredentials()) {
    return {
      ok: false,
      configured: false,
      message:
        'SES identity API is not configured. Set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY (or SES_API_* equivalents).',
    };
  }

  const createResult = await sesApiRequest('POST', '/v2/email/identities', { EmailIdentity: normalizedEmail });
  const createMessage = String(createResult.message || '').toLowerCase();
  const identityAlreadyExists = createMessage.includes('already exist');
  if (!createResult.ok && createResult.statusCode !== 409 && !identityAlreadyExists) {
    return {
      ok: false,
      configured: true,
      message: createResult.message || 'Unable to request email verification.',
    };
  }

  return {
    ok: true,
    status: 'PENDING',
  };
}

async function sendSignupConfirmationEmail(toEmail, name) {
  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!transporter || !fromEmail) {
    return {
      ok: false,
      statusCode: 500,
      message: 'Email service is not configured. Please contact support.',
    };
  }

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: 'Signup Verification Check',
      text: `Hello ${name || 'User'}, your email has been verified and signup can continue.`,
    });
    return { ok: true };
  } catch (error) {
    const responseText = String(error?.response || '').toLowerCase();
    const isUnverified =
      Number(error?.responseCode) === 554 &&
      responseText.includes('email address is not verified');

    if (isUnverified) {
      return {
        ok: false,
        code: 'UNVERIFIED',
        statusCode: 400,
        message: 'Verification email sent. Click the verification link in your inbox, then sign up again.',
      };
    }

    return {
      ok: false,
      code: 'SEND_FAILED',
      statusCode: 500,
      message: 'Unable to send verification check email. Please try again.',
    };
  }
}

async function sendCouponEmail({ toEmail, recipientName, code, discountValue, appliesTo, expiresAt }) {
  const normalizedToEmail = String(toEmail || '').trim().toLowerCase();
  if (!normalizedToEmail) {
    return { ok: false, statusCode: 400, message: 'Recipient email is required.' };
  }

  const appliesLabel = 'all payments';
  const expiryLabel = expiresAt ? new Date(expiresAt).toLocaleDateString('en-IN') : 'No expiry date';
  const subject = `Your ${Number(discountValue || 0)}% off coupon`;
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
  const text =
    `${greeting}\n\n` +
    `Here is your single-use coupon code: ${String(code || '').trim()}\n` +
    `Discount: ${Number(discountValue || 0)}% off (${appliesLabel})\n` +
    `Expiry: ${expiryLabel}\n\n` +
    `Use this code at checkout. It can be redeemed only once.\n\n` +
    `If you did not expect this email, please ignore it.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
      <p style="margin: 0 0 12px;">${escapeHtml(greeting)}</p>
      <p style="margin: 0 0 12px;">Here is your single-use coupon code:</p>
      <div style="display: inline-block; padding: 10px 14px; border-radius: 8px; background: #f3f4f6; font-size: 20px; font-weight: 700; letter-spacing: 1px;">
        ${escapeHtml(String(code || '').trim())}
      </div>
      <p style="margin: 12px 0 0;">Discount: ${escapeHtml(String(discountValue || 0))}% off (${escapeHtml(appliesLabel)})</p>
      <p style="margin: 6px 0 0;">Expiry: ${escapeHtml(expiryLabel)}</p>
      <p style="margin: 12px 0 0;">Use this code at checkout. It can be redeemed only once.</p>
      <p style="margin: 12px 0 0; color: #6b7280;">If you did not expect this email, please ignore it.</p>
    </div>
  `;

  if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
    try {
      await sgMail.send({
        to: normalizedToEmail,
        from: SENDGRID_FROM_EMAIL,
        subject,
        text,
        html,
      });
      return { ok: true };
    } catch (error) {
      const sendGridError = extractSendGridErrorDetails(error);
      console.error('Failed to send coupon email via SendGrid:', {
        statusCode: sendGridError.statusCode,
        detail: sendGridError.detail,
        responseBody: sendGridError.responseBody,
      });
      return {
        ok: false,
        statusCode: sendGridError.statusCode || 500,
        message:
          sendGridError.statusCode === 403
            ? 'SendGrid rejected the sender identity. Verify the configured FROM email or authenticated domain.'
            : 'Unable to send coupon email. Please try again.',
      };
    }
  }

  const transporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!transporter || !fromEmail) {
    return {
      ok: false,
      statusCode: 500,
      message: 'Email service is not configured. Please contact support.',
    };
  }

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: normalizedToEmail,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (error) {
    console.error('Failed to send coupon email via SMTP:', error);
    return {
      ok: false,
      statusCode: 500,
      message: 'Unable to send coupon email. Please try again.',
    };
  }
}

async function sendOtpEmail(toEmail, otp, purpose = 'signup') {
  const normalizedToEmail = String(toEmail || '').trim().toLowerCase();
  const otpValue = String(otp || '').trim();
  const isPasswordReset = String(purpose || '').trim().toLowerCase() === 'password_reset';
  const flowLabel = isPasswordReset ? 'password reset' : 'signup';

  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    if (ALLOW_DEV_OTP_FALLBACK) {
      console.warn(
        `[DEV OTP FALLBACK] ${flowLabel} OTP for ${normalizedToEmail}: ${otpValue}. SendGrid is not configured, so the OTP was logged locally.`
      );
      return {
        ok: true,
        delivery: 'console',
        message: `OTP generated for ${normalizedToEmail}. Check the server console because SendGrid is not configured in development.`,
      };
    }

    return {
      ok: false,
      statusCode: 500,
      message: 'SendGrid is not configured. Please contact support.',
    };
  }

  const subject = isPasswordReset ? 'Password Reset Verification' : 'Sign Up Verification';
  const heading = isPasswordReset ? 'Password Reset Verification' : 'Sign Up Verification';
  const intro = isPasswordReset
    ? 'Use the OTP below to continue resetting your password.'
    : 'Use the OTP below to complete your sign up.';
  const text = `${heading}\n\n${intro}\n\nOTP: ${otpValue}\nValid for: ${OTP_TTL_MINUTES} minutes\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
      <h2 style="margin: 0 0 16px;">${heading}</h2>
      <p style="margin: 0 0 12px;">${intro}</p>
      <p style="margin: 0 0 8px;">Your OTP is:</p>
      <div style="display: inline-block; padding: 12px 18px; border-radius: 8px; background: #f3f4f6; font-size: 24px; font-weight: 700; letter-spacing: 4px;">
        ${otpValue}
      </div>
      <p style="margin: 16px 0 0;">This OTP is valid for ${OTP_TTL_MINUTES} minutes.</p>
      <p style="margin: 12px 0 0; color: #6b7280;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  try {
    await sgMail.send({
      to: normalizedToEmail,
      from: SENDGRID_FROM_EMAIL,
      subject,
      text,
      html,
    });
    return {
      ok: true,
      delivery: 'sendgrid',
      message: `${isPasswordReset ? 'Password reset' : 'Signup'} OTP sent to ${normalizedToEmail}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    };
  } catch (error) {
    const sendGridError = extractSendGridErrorDetails(error);
    console.error('Failed to send OTP email via SendGrid:', {
      to: normalizedToEmail,
      from: SENDGRID_FROM_EMAIL,
      statusCode: sendGridError.statusCode,
      detail: sendGridError.detail,
      responseBody: sendGridError.responseBody,
    });
    const statusCode = sendGridError.statusCode;
    const isUnauthorized = statusCode === 401 || statusCode === 403;

    return {
      ok: false,
      statusCode,
      message: isUnauthorized
        ? statusCode === 403
          ? 'SendGrid rejected the sender identity. Verify the configured FROM email or authenticated domain.'
          : 'SendGrid authentication failed. Please contact support.'
        : 'Unable to send OTP email. Please try again.',
    };
  }
}

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      age INTEGER,
      gender TEXT,
      mobile TEXT,
      avatar_url TEXT,
      membership_status TEXT NOT NULL DEFAULT 'inactive',
      membership_plan TEXT,
      membership_started_at TEXT,
      membership_expires_at TEXT,
      membership_people_count INTEGER,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      bio TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      consultation_fee INTEGER NOT NULL,
      available_days TEXT NOT NULL,
      approval_status TEXT NOT NULL DEFAULT 'approved',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      doctor_id INTEGER REFERENCES doctors(id),
      booking_group_id TEXT,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      service_name TEXT NOT NULL,
      booking_date TEXT NOT NULL,
      booking_time TEXT NOT NULL,
      assigned_staff TEXT NOT NULL,
      status TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      paid_at TEXT,
      payment_order_id TEXT,
      payment_reference TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pending_registrations (
      email TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts_left INTEGER NOT NULL,
      otp_verified INTEGER NOT NULL DEFAULT 0,
      registration_role TEXT NOT NULL DEFAULT 'user',
      doctor_profile_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_login_otps (
      email TEXT PRIMARY KEY,
      otp_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts_left INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_password_resets (
      email TEXT PRIMARY KEY,
      otp_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts_left INTEGER NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS membership_payment_orders (
      order_id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      plan_id TEXT NOT NULL,
      people_count INTEGER NOT NULL DEFAULT 1,
      member_details_json TEXT,
      original_amount_paise INTEGER,
      discount_amount_paise INTEGER NOT NULL DEFAULT 0,
      coupon_id INTEGER REFERENCES coupons(id),
      coupon_code TEXT,
      amount_paise INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_reference TEXT,
      paid_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS membership_subscriptions (
      subscription_id TEXT PRIMARY KEY,
      owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL,
      people_count INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      started_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS membership_subscription_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id TEXT NOT NULL REFERENCES membership_subscriptions(subscription_id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      place TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      is_registered INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(subscription_id, email)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      applies_to TEXT NOT NULL DEFAULT 'all',
      max_redemptions INTEGER,
      per_user_limit INTEGER NOT NULL DEFAULT 1,
      expires_at TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      recipient_email TEXT,
      recipient_name TEXT,
      emailed_at TEXT,
      email_status TEXT,
      email_error TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coupon_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      context_type TEXT NOT NULL,
      context_ref TEXT NOT NULL,
      discount_amount_paise INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_payment_orders (
      order_id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      original_amount_paise INTEGER NOT NULL,
      discount_amount_paise INTEGER NOT NULL DEFAULT 0,
      coupon_id INTEGER REFERENCES coupons(id),
      coupon_code TEXT,
      amount_paise INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_reference TEXT,
      paid_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_discount_phones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_key TEXT NOT NULL UNIQUE,
      phone_display TEXT NOT NULL,
      discount_percent REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      note_text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_user_date
      ON bookings(user_id, booking_date, booking_time);
    CREATE INDEX IF NOT EXISTS idx_admin_discount_phones_phone_key
      ON admin_discount_phones(phone_key);
    CREATE INDEX IF NOT EXISTS idx_notes_booking
      ON notes(booking_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_membership_subscription_members_email
      ON membership_subscription_members(email);
    CREATE INDEX IF NOT EXISTS idx_membership_subscriptions_owner
      ON membership_subscriptions(owner_user_id, status, expires_at);
  `);

  if (!hasColumn('users', 'role')) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  }

  if (hasTable('notes') && !hasColumn('notes', 'booking_id')) {
    db.exec('DROP TABLE notes');
    db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        note_text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_notes_booking
        ON notes(booking_id, created_at);
    `);
  }

  if (!hasColumn('users', 'age')) {
    db.exec('ALTER TABLE users ADD COLUMN age INTEGER');
  }

  if (!hasColumn('users', 'gender')) {
    db.exec('ALTER TABLE users ADD COLUMN gender TEXT');
  }

  if (!hasColumn('users', 'mobile')) {
    db.exec('ALTER TABLE users ADD COLUMN mobile TEXT');
  }

  if (!hasColumn('users', 'avatar_url')) {
    db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
  }

  if (!hasColumn('users', 'membership_status')) {
    db.exec("ALTER TABLE users ADD COLUMN membership_status TEXT NOT NULL DEFAULT 'inactive'");
  }

  if (!hasColumn('users', 'membership_plan')) {
    db.exec('ALTER TABLE users ADD COLUMN membership_plan TEXT');
  }

  if (!hasColumn('users', 'membership_started_at')) {
    db.exec('ALTER TABLE users ADD COLUMN membership_started_at TEXT');
  }

  if (!hasColumn('users', 'membership_expires_at')) {
    db.exec('ALTER TABLE users ADD COLUMN membership_expires_at TEXT');
  }

  if (!hasColumn('users', 'membership_people_count')) {
    db.exec('ALTER TABLE users ADD COLUMN membership_people_count INTEGER');
  }

  if (!hasColumn('users', 'membership_subscription_id')) {
    db.exec('ALTER TABLE users ADD COLUMN membership_subscription_id TEXT');
  }

  if (!hasColumn('bookings', 'doctor_id')) {
    db.exec('ALTER TABLE bookings ADD COLUMN doctor_id INTEGER REFERENCES doctors(id)');
  }

  if (!hasColumn('bookings', 'booking_group_id')) {
    db.exec('ALTER TABLE bookings ADD COLUMN booking_group_id TEXT');
  }

  if (!hasColumn('doctors', 'user_id')) {
    db.exec('ALTER TABLE doctors ADD COLUMN user_id INTEGER');
  }

  if (!hasColumn('doctors', 'approval_status')) {
    db.exec("ALTER TABLE doctors ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'approved'");
  }

  if (!hasColumn('pending_registrations', 'registration_role')) {
    db.exec("ALTER TABLE pending_registrations ADD COLUMN registration_role TEXT NOT NULL DEFAULT 'user'");
  }

  if (!hasColumn('pending_registrations', 'doctor_profile_json')) {
    db.exec('ALTER TABLE pending_registrations ADD COLUMN doctor_profile_json TEXT');
  }

  if (!hasColumn('pending_registrations', 'otp_verified')) {
    db.exec("ALTER TABLE pending_registrations ADD COLUMN otp_verified INTEGER NOT NULL DEFAULT 0");
  }

  if (!hasColumn('pending_password_resets', 'verified')) {
    db.exec("ALTER TABLE pending_password_resets ADD COLUMN verified INTEGER NOT NULL DEFAULT 0");
  }

  if (hasTable('membership_payment_orders') && !hasColumn('membership_payment_orders', 'people_count')) {
    db.exec("ALTER TABLE membership_payment_orders ADD COLUMN people_count INTEGER NOT NULL DEFAULT 1");
  }

  if (hasTable('membership_payment_orders') && !hasColumn('membership_payment_orders', 'member_details_json')) {
    db.exec('ALTER TABLE membership_payment_orders ADD COLUMN member_details_json TEXT');
  }

  if (hasTable('membership_payment_orders') && !hasColumn('membership_payment_orders', 'original_amount_paise')) {
    db.exec('ALTER TABLE membership_payment_orders ADD COLUMN original_amount_paise INTEGER');
  }

  if (hasTable('membership_payment_orders') && !hasColumn('membership_payment_orders', 'discount_amount_paise')) {
    db.exec("ALTER TABLE membership_payment_orders ADD COLUMN discount_amount_paise INTEGER NOT NULL DEFAULT 0");
  }

  if (hasTable('membership_payment_orders') && !hasColumn('membership_payment_orders', 'coupon_id')) {
    db.exec('ALTER TABLE membership_payment_orders ADD COLUMN coupon_id INTEGER REFERENCES coupons(id)');
  }

  if (hasTable('membership_payment_orders') && !hasColumn('membership_payment_orders', 'coupon_code')) {
    db.exec('ALTER TABLE membership_payment_orders ADD COLUMN coupon_code TEXT');
  }

  if (hasTable('coupons') && !hasColumn('coupons', 'recipient_email')) {
    db.exec('ALTER TABLE coupons ADD COLUMN recipient_email TEXT');
  }
  if (hasTable('coupons') && !hasColumn('coupons', 'recipient_name')) {
    db.exec('ALTER TABLE coupons ADD COLUMN recipient_name TEXT');
  }
  if (hasTable('coupons') && !hasColumn('coupons', 'emailed_at')) {
    db.exec('ALTER TABLE coupons ADD COLUMN emailed_at TEXT');
  }
  if (hasTable('coupons') && !hasColumn('coupons', 'email_status')) {
    db.exec('ALTER TABLE coupons ADD COLUMN email_status TEXT');
  }
  if (hasTable('coupons') && !hasColumn('coupons', 'email_error')) {
    db.exec('ALTER TABLE coupons ADD COLUMN email_error TEXT');
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_doctors_user_id
      ON doctors(user_id)
      WHERE user_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_bookings_doctor_slot_active
      ON bookings(doctor_id, booking_date, booking_time)
      WHERE status IN ('pending', 'booked', 'confirmed');

    CREATE INDEX IF NOT EXISTS idx_bookings_service_slot_active
      ON bookings(service_name, booking_date, booking_time)
      WHERE status IN ('pending', 'booked', 'confirmed');

    CREATE INDEX IF NOT EXISTS idx_membership_payment_orders_user_status
      ON membership_payment_orders(user_id, status, created_at);

    CREATE INDEX IF NOT EXISTS idx_bookings_group_id
      ON bookings(booking_group_id);

    CREATE INDEX IF NOT EXISTS idx_coupons_code
      ON coupons(code);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_redemptions_context
      ON coupon_redemptions(coupon_id, user_id, context_type, context_ref);

    CREATE INDEX IF NOT EXISTS idx_cart_payment_orders_user_status
      ON cart_payment_orders(user_id, status, created_at);
  `);

  if (!hasColumn('bookings', 'payment_status')) {
    db.exec("ALTER TABLE bookings ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'");
  }

  if (!hasColumn('bookings', 'paid_at')) {
    db.exec('ALTER TABLE bookings ADD COLUMN paid_at TEXT');
  }

  if (!hasColumn('bookings', 'payment_reference')) {
    db.exec('ALTER TABLE bookings ADD COLUMN payment_reference TEXT');
  }

  if (!hasColumn('bookings', 'payment_order_id')) {
    db.exec('ALTER TABLE bookings ADD COLUMN payment_order_id TEXT');
  }

  db.exec(`
    UPDATE bookings
    SET payment_status = CASE
      WHEN status IN ('booked', 'confirmed', 'completed') THEN 'paid'
      ELSE 'unpaid'
    END
    WHERE payment_status IS NULL OR payment_status = '';
  `);

  db.exec(`
    UPDATE membership_payment_orders
    SET original_amount_paise = amount_paise
    WHERE original_amount_paise IS NULL;
  `);

  db.exec("UPDATE users SET role = 'user' WHERE role IS NULL OR role = ''");
  db.exec("UPDATE users SET role = 'user' WHERE role = 'doctor'");
  db.exec("UPDATE users SET membership_status = 'inactive' WHERE membership_status IS NULL OR membership_status = ''");
  db.exec("UPDATE doctors SET approval_status = 'approved' WHERE approval_status IS NULL OR approval_status = ''");

  backfillMembershipSubscriptionsFromOrders();
  refreshMembershipSubscriptionStates();
  const linkedSubscriptions = db
    .prepare(
      `SELECT DISTINCT subscription_id AS subscriptionId
       FROM membership_subscription_members
       WHERE user_id IS NOT NULL`
    )
    .all();
  linkedSubscriptions.forEach((row) => {
    syncMembershipStatusForSubscription(row.subscriptionId);
  });
}

function seedDoctors() {
  const existing = db.prepare('SELECT id FROM doctors LIMIT 1').get();
  if (existing) return;

  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO doctors (
      user_id, name, specialty, bio, experience_years, consultation_fee, available_days, approval_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const doctors = [
    [
      null,
      'Dr. Olivia Bennett',
      'Physiotherapy',
      'Focuses on sports injury recovery and postural correction plans.',
      11,
      90,
      'Mon, Wed, Fri',
      'approved',
      now,
    ],
    [
      null,
      'Dr. Ethan Brooks',
      'Chiropractic Care',
      'Specializes in spinal alignment and chronic lower-back pain treatment.',
      14,
      110,
      'Tue, Thu, Sat',
      'approved',
      now,
    ],
  ];

  const txn = db.transaction((rows) => {
    for (const row of rows) insert.run(...row);
  });

  txn(doctors);
}

function seedAdmin() {
  const email = 'admin@h2health.local';
  const defaultPasswordHash = bcrypt.hashSync('Admin@12345', 10);
  const existing = db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get(email);

  if (!existing) {
    db.prepare(
      `INSERT INTO users (name, email, password_hash, role, created_at)
       VALUES (?, ?, ?, 'admin', datetime('now'))`
    ).run('Portal Admin', email, defaultPasswordHash);
    return;
  }

  db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);

  const existingPasswordHash = String(existing.password_hash || '').trim();
  if (!existingPasswordHash) {
    db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(defaultPasswordHash, email);
  }
}

function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const row = requestCounters.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > row.resetAt) {
      row.count = 0;
      row.resetAt = now + windowMs;
    }

    row.count += 1;
    requestCounters.set(key, row);

    if (row.count > max) {
      return res.status(429).json({ message: 'Too many requests. Please try again shortly.' });
    }

    return next();
  };
}
