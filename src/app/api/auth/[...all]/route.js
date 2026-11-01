// Better Auth's endpoints (send code, sign in with code, session, sign out); see src/lib/auth.js
import { getAuth } from "@/lib/auth";

const handle = (request) => getAuth().handler(request);

export const GET = handle;
export const POST = handle;
