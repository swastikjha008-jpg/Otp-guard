/**
 * This script does NOT brute-force the OTP. It fires a burst of WRONG
 * guesses at your own local server to prove the defenses trigger:
 * you should see attemptsLeft count down, then a 429 lockout kick in
 * well before all guesses are exhausted.
 *
 * Run: npm run dev (in one terminal) then npm run test:load (in another)
 */
import axios from "axios";

const BASE_URL = "http://localhost:3000";
const IDENTIFIER = "test-user@example.com";

async function run() {
  await axios.post(`${BASE_URL}/auth/otp/request`, { identifier: IDENTIFIER });
  console.log("Requested OTP (see server console for the real code).\n");

  console.log("Firing 15 deliberately WRONG guesses to demonstrate lockout...\n");

  for (let i = 1; i <= 15; i++) {
    try {
      const res = await axios.post(`${BASE_URL}/auth/otp/verify`, {
        identifier: IDENTIFIER,
        code: "000000", // wrong on purpose
      });
      console.log(`Attempt ${i}:`, res.data);
    } catch (err: any) {
      if (err.response) {
        console.log(`Attempt ${i}: [${err.response.status}]`, err.response.data);
      } else {
        console.log(`Attempt ${i}: request failed`, err.message);
      }
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("\nExpected: attemptsLeft counts down to 0, then a 429 lockout response,");
  console.log("and eventually a 429 from the IP-level rate limiter too.");
}

run().catch(console.error);
