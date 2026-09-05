type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "rate_limited" | "locked" };

class OtpLabServer {
  private attempts = 0;
  private windowStart = Date.now();
  private locked = false;

  constructor(
    private readonly correctOtp: string,
    private readonly maxAttemptsPerWindow = 5,
    private readonly windowMs = 1_000,
    private readonly maxTotalAttempts = 30,
  ) {}

  verify(candidate: string): VerifyResult {
    if (this.locked) return { ok: false, reason: "locked" };

    const now = Date.now();
    if (now - this.windowStart >= this.windowMs) {
      this.windowStart = now;
      this.attempts = 0;
    }

    if (this.attempts >= this.maxAttemptsPerWindow) {
      return { ok: false, reason: "rate_limited" };
    }

    this.attempts += 1;

    if (candidate === this.correctOtp) {
      return { ok: true };
    }

    if (this.attempts >= this.maxTotalAttempts) {
      this.locked = true;
      return { ok: false, reason: "locked" };
    }

    return { ok: false, reason: "invalid" };
  }
}

function* otpCandidates(length: number): Generator<string> {
  const limit = 10 ** length;

  for (let value = 0; value < limit; value += 1) {
    yield value.toString().padStart(length, "0");
  }
}

async function runLab(): Promise<void> {
  // Deliberately local: no HTTP requests or external endpoints are used.
  const server = new OtpLabServer("7314");
  let requests = 0;

  console.log("OTP brute-force simulation");
  console.log("Target: local in-memory lab only");
  console.log("Protection: 5 attempts/second + 30-attempt lockout\n");

  for (const candidate of otpCandidates(4)) {
    const result = server.verify(candidate);
    requests += 1;

    if (result.ok) {
      console.log(`Found OTP ${candidate} after ${requests} simulated requests.`);
      return;
    }

    if (result.reason === "rate_limited") {
      console.log("Rate limited — waiting for the local window to reset...");
      await new Promise((resolve) => setTimeout(resolve, 1_050));
      continue;
    }

    if (result.reason === "locked") {
      console.log(`Account locked after ${requests} simulated requests.`);
      return;
    }
  }

  console.log("OTP was not found.");
}

void runLab();
