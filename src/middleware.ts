import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string;

    // Role-based route protection
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/routes') || pathname.startsWith('/reallocation') || pathname.startsWith('/attendance-log') || pathname.startsWith('/logs')) {
      if (role !== 'supervisor' && role !== 'admin') {
        return NextResponse.redirect(new URL('/attendance', req.url));
      }
    }

    if (pathname.startsWith('/staff') || pathname.startsWith('/reports')) {
      if (role !== 'admin') {
        const redirect = role === 'supervisor' ? '/dashboard' : '/attendance';
        return NextResponse.redirect(new URL(redirect, req.url));
      }
    }

    if (pathname.startsWith('/attendance') || pathname.startsWith('/my-route') || pathname.startsWith('/progress') || pathname.startsWith('/photo-check')) {
      if (role !== 'staff') {
        const redirect = role === 'supervisor' ? '/dashboard' : '/reports';
        return NextResponse.redirect(new URL(redirect, req.url));
      }
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
    '/attendance/:path*',
    '/my-route/:path*',
    '/progress/:path*',
    '/photo-check/:path*',
    '/staff/:path*',
    '/reports/:path*',
    '/logs/:path*',
  ],
};
