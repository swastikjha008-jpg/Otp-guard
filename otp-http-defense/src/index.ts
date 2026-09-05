import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { issueOtp, verifyOtp } from "./otpStore";

const app = express();
app.use(express.json());
app.use(helmet());

const PORT = process.env.PORT || 3000;

/**
 * Layer 1: coarse per-IP rate limit across the whole auth surface.
 * This is what blunts DDoS-style request floods before they even
 * reach the OTP logic.
 */
const globalAuthLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20, // 20 requests/min/IP across auth routes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Slow down." },
});

/**
 * Layer 2: tighter limit specifically on the verify endpoint,
 * since that's the one an attacker brute-forces.
 */
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 8, // 8 verify attempts/min/IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OTP attempts from this IP. Try again later." },
});

app.use("/auth", globalAuthLimiter);

// Request an OTP
app.post("/auth/otp/request", (req: Request, res: Response) => {
  const { identifier } = req.body as { identifier?: string };
  if (!identifier) {
    return res.status(400).json({ error: "identifier is required" });
  }

  const code = issueOtp(identifier);

  // Demo-only: log/return the code so you can test locally.
  // A real system sends this via SMS/email and NEVER returns it in the response.
  console.log(`[DEMO] OTP for ${identifier}: ${code}`);
  res.json({ message: "OTP issued (check server logs in this demo)" });
});

// Verify an OTP — this is the brute-force target, so it gets the strict limiter
// plus server-side attempt tracking and exponential lockout (see otpStore.ts).
app.post("/auth/otp/verify", verifyLimiter, (req: Request, res: Response) => {
  const { identifier, code } = req.body as { identifier?: string; code?: string };
  if (!identifier || !code) {
    return res.status(400).json({ error: "identifier and code are required" });
  }

  const result = verifyOtp(identifier, code);

  switch (result.status) {
    case "ok":
      return res.json({ success: true, message: "OTP verified" });
    case "invalid":
      return res.status(401).json({
        success: false,
        message: "Incorrect code",
        attemptsLeft: result.attemptsLeft,
      });
    case "locked":
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Account temporarily locked.",
        retryAfterMs: result.retryAfterMs,
      });
    case "expired":
      return res.status(410).json({ success: false, message: "OTP expired. Request a new one." });
    case "not_found":
      return res.status(404).json({ success: false, message: "No OTP pending for this identifier." });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`OTP defense demo running on http://localhost:${PORT}`);
});
