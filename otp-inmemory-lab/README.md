# OTP Rate-Limit Lab

A small TypeScript security-learning project that **simulates OTP brute forcing entirely in memory**.

It demonstrates:

- Sequential OTP guessing
- Repeated verification attempts
- Rate limiting
- Account lockout
- Why short OTPs need server-side protections

## Safety

This project intentionally does **not** send requests to real websites, APIs, login pages, or OTP services. The "server" is an in-memory TypeScript class, so it is safe to run locally.

## Run

```bash
npm install
npm start
```

Type-check:

```bash
npm run check
```

Build:

```bash
npm run build
```

## What to learn

Try changing the values in `src/index.ts`:

- `correctOtp`
- `maxAttemptsPerWindow`
- `windowMs`
- `maxTotalAttempts`

Observe how rate limiting and lockout change the simulated attack.

## Defensive takeaway

A production OTP verification endpoint should use controls such as:

1. Strict server-side attempt limits
2. Exponential backoff or temporary lockouts
3. Per-account and per-IP/device rate limits
4. Short OTP expiration
5. Single-use OTPs
6. Monitoring and alerting for abnormal verification failures
7. Generic error responses that avoid leaking unnecessary information

This repository is intended as a defensive security-learning lab.
