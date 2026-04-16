import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './config';
import type { UserRole } from '../utils/constants';

/**
 * Server-side helper to get the current session and verify role access.
 * Use in API routes and Server Components.
 */
export async function getAuthSession() {
  return getServerSession(authOptions);
}

/**
 * API route helper: returns the session if the user has one of the allowed roles,
 * or returns a NextResponse error.
 */
export async function requireRole(...allowedRoles: UserRole[]) {
  const session = await getAuthSession();

  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(session.user.role as UserRole)) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}
