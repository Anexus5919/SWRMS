import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Route-table-driven role gating.
// Each entry's prefix matches the path itself OR any sub-path under it,
// but NOT siblings that happen to share a leading substring (e.g. `/attendance`
// must NOT match `/attendance-log`). This is the bug that previously redirected
// supervisors clicking "Attendance Log" back to the staff `/home` page and then
// to `/dashboard`.
const SUPERVISOR_PREFIXES = [
  '/dashboard',
  '/routes',
  '/reallocation',
  '/attendance-log',
  '/supervisor-logs',
  '/reliability',
  '/replay',
] as const;

const ADMIN_PREFIXES = [
  '/staff',
  '/reports',
  '/admin-logs',
  '/audit',
] as const;

const STAFF_PREFIXES = [
  '/home',
  '/onboarding',
  '/attendance',
  '/my-route',
  '/progress',
  '/photo-check',
] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

function matchesAny(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => matchesPrefix(pathname, p));
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string;

    if (matchesAny(pathname, SUPERVISOR_PREFIXES)) {
      if (role !== 'supervisor' && role !== 'admin') {
        return NextResponse.redirect(new URL('/home', req.url));
      }
      return NextResponse.next();
    }

    if (matchesAny(pathname, ADMIN_PREFIXES)) {
      if (role !== 'admin') {
        const redirect = role === 'supervisor' ? '/dashboard' : '/home';
        return NextResponse.redirect(new URL(redirect, req.url));
      }
      return NextResponse.next();
    }

    if (matchesAny(pathname, STAFF_PREFIXES)) {
      if (role !== 'staff') {
        const redirect = role === 'supervisor' ? '/dashboard' : '/reports';
        return NextResponse.redirect(new URL(redirect, req.url));
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/routes/:path*',
    '/reallocation/:path*',
    '/attendance-log/:path*',
    '/home/:path*',
    '/attendance/:path*',
    '/my-route/:path*',
    '/progress/:path*',
    '/photo-check/:path*',
    '/onboarding/:path*',
    '/staff/:path*',
    '/reports/:path*',
    '/supervisor-logs/:path*',
    '/admin-logs/:path*',
    '/audit/:path*',
    '/reliability/:path*',
    '/replay/:path*',
  ],
};
