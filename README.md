# otp-guard

![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-blue?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-blue?style=flat-square&logo=express&logoColor=white)
![Helmet](https://img.shields.io/badge/Helmet-blue?style=flat-square&logo=letsencrypt&logoColor=white)
![Rate Limiting](https://img.shields.io/badge/Rate%20Limiting-blue?style=flat-square&logo=cloudflare&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

Two small, self-contained TypeScript projects exploring OTP
brute-force attacks from the **defensive** side — how these attacks
work, and the controls that stop them. No code here attacks a real
service.

```
otp-guard/
├── otp-http-defense/     Real Express API, hardened with rate limiting + lockout
└── otp-inmemory-lab/     Pure in-memory simulation of an attack vs. those defenses
```

Each folder is an **independent npm project** with its own
`package.json` — install and run them separately.

---

## `otp-http-defense/`

![Express](https://img.shields.io/badge/Express-blue?style=flat-square&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)
![express--rate--limit](https://img.shields.io/badge/express--rate--limit-blue?style=flat-square)
![Helmet](https://img.shields.io/badge/Helmet-blue?style=flat-square)

A working Express + TypeScript **HTTP API** with an OTP request/verify
flow, protected by:

- Per-IP rate limiting (`express-rate-limit`), two layers (global auth + tight verify limit)
- Per-identifier attempt tracking with exponential-backoff lockout
- OTP expiry, `helmet` header hardening

Includes a self-test script that fires wrong guesses at your **own**
local server to prove the lockout triggers.

### How to run

```bash
cd otp-http-defense
npm install
npm run dev          # starts the server on http://localhost:3000
```

In another terminal, test it manually:

```bash
curl -X POST localhost:3000/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"identifier":"you@example.com"}'

# copy the code from the server console log, then:
curl -X POST localhost:3000/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"identifier":"you@example.com","code":"123456"}'
```

Or watch the lockout trigger automatically:

```bash
npm run test:load
```

See `otp-http-defense/README.md` for full details.

---

## `otp-inmemory-lab/`

![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)
![tsx](https://img.shields.io/badge/tsx-blue?style=flat-square)

A **local-only simulation**, with no network calls at all — an
in-memory class stands in for a server, and a generator sequentially
tries every 4-digit code against it. It shows, step by step, how
rate-limit windows and total-attempt lockouts cut off a brute-force
search long before it succeeds.

### How to run

```bash
cd otp-inmemory-lab
npm install
npm start
```

Type-check or build:

```bash
npm run check
npm run build
```

Try editing the values in `src/index.ts` — `correctOtp`,
`maxAttemptsPerWindow`, `windowMs`, `maxTotalAttempts` — and observe
how the simulated attack behaves differently.

See `otp-inmemory-lab/README.md` for what to tweak and observe.

---

## Why two projects instead of one

They demonstrate the same concept at two different levels:

| | otp-http-defense | otp-inmemory-lab |
|---|---|---|
| Transport | Real HTTP (Express) | None — in-memory only |
| What it shows | How to wire defenses into a real API | The attack/defense dynamic in isolation |
| Attempt model | Per-IP + per-identifier | Single simulated target |
| Good for | Copying into a real project | Reasoning about the math/timing of lockouts |

Read the lab first to build intuition, then look at the HTTP project
to see the same ideas as production-shaped code.

## License

MIT — see [LICENSE](./LICENSE).
