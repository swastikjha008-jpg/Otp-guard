# OTP DDoS/Brute-Force Defense Demo

A small Express + TypeScript project showing how to **defend** an OTP
(one-time password) verification endpoint against brute-force and
DDoS-style abuse — the attack that hammers `/verify` with guesses
until one lands.

This is deliberately the defensive side of that scenario: no script
here tries to guess a real OTP. What it demonstrates is *why* naive
OTP endpoints get owned, and the concrete mechanisms that stop it.

## What it implements

- **Per-IP rate limiting** (`express-rate-limit`) at two layers:
  - a loose limit across all `/auth` routes (blunts floods),
  - a tight limit specifically on `/auth/otp/verify` (the endpoint an
    attacker actually targets).
- **Server-side attempt tracking per identifier** — independent of IP,
  so an attacker can't dodge the limiter by rotating IPs/proxies.
- **Exponential backoff lockout** — after 5 wrong guesses, the
  identifier is locked out; each repeated lockout doubles the wait.
- **OTP expiry** (5 min TTL) so a leaked/guessed-late code goes stale.
- **`helmet`** for baseline HTTP header hardening.

## Why this matters

A 6-digit OTP has 1,000,000 combinations. With no rate limiting, an
attacker can brute-force it in minutes with parallel requests — this
is a textbook credential-stuffing / OTP-bypass technique, and at
volume it doubles as a DoS on your auth backend. The defenses above
make each of those individually impractical:

- Rate limiting caps requests/minute regardless of guess accuracy.
- Attempt lockout means the search space becomes irrelevant — the
  account locks long before a brute force could get through it.
- Exponential backoff means repeated attack attempts get *slower*
  over time, not just capped.

## Running it

```bash
npm install
npm run dev          # starts the server on :3000
```

In another terminal, request an OTP and verify it manually:

```bash
curl -X POST localhost:3000/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"identifier":"you@example.com"}'

# copy the code from the server console log, then:
curl -X POST localhost:3000/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"identifier":"you@example.com","code":"123456"}'
```

Or run the included self-test, which fires wrong guesses at your own
server and shows the lockout kicking in:

```bash
npm run test:load
```

## Project structure

```
src/
  index.ts        Express app, routes, rate-limit config
  otpStore.ts     OTP issuance/verification, attempt tracking, lockout
  load-test.ts    Self-test proving the defenses trigger correctly
```

## Notes

- OTPs are logged to the console instead of sent via SMS/email —
  this is a local demo, not production auth. Never return an OTP in
  an API response in a real system.
- Storage is in-memory (`Map`) for simplicity. In production, back
  this with Redis so limits/lockouts survive restarts and work across
  multiple server instances.
