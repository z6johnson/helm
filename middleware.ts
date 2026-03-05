import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API
  if (pathname === '/login' || pathname === '/api/auth') {
    return NextResponse.next();
  }

  // Cron endpoints authenticate via CRON_SECRET header
  if (pathname.startsWith('/api/cron/')) {
    return NextResponse.next();
  }

  // Check auth cookie
  const authCookie = request.cookies.get('helm-auth')?.value;
  const secret = process.env.DASHBOARD_SECRET;

  if (!secret || authCookie !== secret) {
    // Redirect pages to login, return 401 for API routes
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
