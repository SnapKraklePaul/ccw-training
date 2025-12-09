// This file handles all NextAuth API routes
// GET /api/auth/signin, /api/auth/signout, /api/auth/callback, etc.

import { handlers } from "@/auth"

export const { GET, POST } = handlers