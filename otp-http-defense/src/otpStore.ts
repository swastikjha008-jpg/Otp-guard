import crypto from "crypto";

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  lockedUntil: number | null;
}

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 30 * 1000; // 30s, doubles per repeated lockout

const store = new Map<string, OtpRecord>();
const lockoutCount = new Map<string, number>();

function generateCode(): string {
  // 6-digit numeric OTP
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function issueOtp(identifier: string): string {
  const code = generateCode();
  store.set(identifier, {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    lockedUntil: null,
  });
  return code; // in a real system this is sent via SMS/email, never returned to the client
}

export type VerifyResult =
  | { status: "ok" }
  | { status: "invalid"; attemptsLeft: number }
  | { status: "locked"; retryAfterMs: number }
  | { status: "expired" }
  | { status: "not_found" };

export function verifyOtp(identifier: string, guess: string): VerifyResult {
  const record = store.get(identifier);
  if (!record) return { status: "not_found" };

  if (record.lockedUntil && record.lockedUntil > Date.now()) {
    return { status: "locked", retryAfterMs: record.lockedUntil - Date.now() };
  }

  if (Date.now() > record.expiresAt) {
    store.delete(identifier);
    return { status: "expired" };
  }

  if (record.code === guess) {
    store.delete(identifier);
    lockoutCount.delete(identifier);
    return { status: "ok" };
  }

  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    const priorLockouts = lockoutCount.get(identifier) ?? 0;
    const lockoutDuration = BASE_LOCKOUT_MS * Math.pow(2, priorLockouts); // exponential backoff
    record.lockedUntil = Date.now() + lockoutDuration;
    record.attempts = 0;
    lockoutCount.set(identifier, priorLockouts + 1);
    return { status: "locked", retryAfterMs: lockoutDuration };
  }

  return { status: "invalid", attemptsLeft: MAX_ATTEMPTS - record.attempts };
}
