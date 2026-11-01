// Server-only sign-in (Better Auth, self-hosted: no outside account). Visitors sign in with a 6-digit code
// emailed to them, which also proves the address is theirs. Sign-in is only needed for earnings notifications.
// Better Auth keeps its users, sessions and codes in its own MongoDB collections (user, session, verification).
import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins/email-otp";
import { getDbNow, getMongoClient } from "./db";
import { buildCodeEmail } from "./notification-email";
import { sendOne } from "./resend";
import { SITE_NAME } from "./site";

export const CODE_MINUTES = 10;
const DAY_SECONDS = 24 * 60 * 60;

function createAuth() {
  return betterAuth({
    appName: SITE_NAME,
    // BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from the environment
    database: mongodbAdapter(getDbNow(), { client: getMongoClient() }),
    session: {
      expiresIn: 30 * DAY_SECONDS,
      updateAge: DAY_SECONDS,
      // Pages check the session from a signed cookie for 5 minutes before asking the database again
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    // Saved in the database so every server instance counts the same requests
    rateLimit: { enabled: true, storage: "database", window: 60, max: 30 },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: CODE_MINUTES * 60,
        allowedAttempts: 3,
        storeOTP: "hashed",
        // A code at most every 2 minutes on average per visitor; each one is an email on the Resend quota
        rateLimit: { window: 10 * 60, max: 5 },
        // Awaited, so a failed send shows up as an error in the sign-in dialog instead of a code that never comes
        async sendVerificationOTP({ email, otp, type }) {
          if (type !== "sign-in") return;
          await sendOne({ to: email, ...buildCodeEmail({ code: otp, minutes: CODE_MINUTES }) });
        },
      }),
      // Lets server code that calls auth.api set cookies; keep last
      nextCookies(),
    ],
  });
}

// Built on first use, not at import, so `next build` doesn't need the database settings
export function getAuth() {
  globalThis.betterAuth ??= createAuth();
  return globalThis.betterAuth;
}

// The signed-in user ({ id, email, ... }) for a request's headers, or null
export async function currentUser(headers) {
  const session = await getAuth().api.getSession({ headers });
  return session?.user ?? null;
}

// Removes the user with their sessions and accounts. Their app data goes first (see /api/account).
// Better Auth's own delete endpoint wants a session under a day old; a signed-in visitor can always delete theirs.
export async function deleteAuthUser(userId) {
  const { internalAdapter } = await getAuth().$context;
  await internalAdapter.deleteUser(userId);
}
