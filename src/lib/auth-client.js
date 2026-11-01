"use client";

// Browser side of sign-in (see auth.js): email a code, sign in with it, read the session, sign out
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({ plugins: [emailOTPClient()] });
