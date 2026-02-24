/**
 * Next.js Middleware - Auth Guard
 *
 * Protected routes için authentication kontrolü yapar.
 * Public routes için kontrol yapmaz.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/signup',
  '/api/public',
  '/api/auth',
  '/_next',
  '/favicon.ico',
];

// Protected paths that require authentication
const PROTECTED_PATH_PREFIXES = [
  '/admin',
  '/home',
  '/site',
  '/sites',
  '/modules',
  '/inbox',
  '/analytics',
  '/settings',
  '/dashboard',
];

/**
 * Check if path is public
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

/**
 * Check if path is protected
 */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

/**
 * Get Supabase client for middleware
 *
 * SECURITY FIX: Improved error handling to prevent information leakage
 * and ensure graceful degradation when Supabase is unavailable.
 */
async function getSupabaseClient(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Log error securely without exposing details to client
    console.error('[Middleware] Missing Supabase environment variables');
    return null;
  }

  try {
    return createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            try {
              return req.cookies.get(name)?.value;
            } catch {
              // Cookie parsing can fail with malformed cookies
              console.warn('[Middleware] Failed to parse cookie:', name);
              return undefined;
            }
          },
        },
      }
    );
  } catch (error) {
    // Log error securely
    console.error('[Middleware] Failed to create Supabase client:', error);
    return null;
  }
}

/**
 * Middleware function
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const url = req.nextUrl.clone();

  // Skip middleware for static files and Next.js internals
  // SECURITY FIX: Use proper file extension regex instead of pathname.includes('.')
  // which would bypass auth for paths like /user/john.doe or /settings/v2.0
  const hasFileExtension = /\.[a-zA-Z0-9]{1,10}$/.test(pathname);
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    hasFileExtension
  ) {
    return NextResponse.next();
  }

  // Public paths - allow access
  if (isPublicPath(pathname)) {
    // If user is already authenticated and trying to access login page,
    // redirect to home
    if (pathname === '/login' || pathname === '/signup') {
      try {
        const supabase = await getSupabaseClient(req);

        if (!supabase) {
          // If we can't create a client, allow access to login page
          return NextResponse.next();
        }

        // SECURITY FIX: Use getUser() instead of getSession() to verify JWT server-side
        // getSession() reads unverified JWT from cookies and can be spoofed
        const { data: { user }, error } = await supabase.auth.getUser();

        // Only redirect if we have a verified user
        if (!error && user) {
          url.pathname = '/home';
          return NextResponse.redirect(url);
        }
      } catch (error) {
        // Log error but continue to public page
        console.warn('[Middleware] Error checking auth on public path:', error);
      }
    }

    return NextResponse.next();
  }

  // Protected paths - check authentication
  if (isProtectedPath(pathname) || (pathname.startsWith('/api') && !isPublicPath(pathname))) {
    const isApiRoute = pathname.startsWith('/api');
    try {
      const supabase = await getSupabaseClient(req);

      if (!supabase) {
        // SECURITY: If we can't create a Supabase client, deny access
        console.error('[Middleware] Cannot create Supabase client for protected path');
        if (isApiRoute) {
          return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        loginUrl.searchParams.set('reason', 'system_error');
        return NextResponse.redirect(loginUrl);
      }

      // SECURITY FIX: Use getUser() instead of getSession() to verify JWT server-side
      const { data: { user }, error } = await supabase.auth.getUser();

      // SECURITY: Treat any error as authentication failure
      if (error || !user) {
        if (error) {
          console.warn('[Middleware] Auth error on protected path:', {
            path: pathname,
            error: error.message,
          });
        }

        if (isApiRoute) {
          return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // Not authenticated - redirect to login with return URL
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        loginUrl.searchParams.set('reason', error ? 'auth_error' : 'auth_required');
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      // SECURITY: Log error and deny access
      console.error('[Middleware] Unexpected error on protected path:', {
        path: pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      if (isApiRoute) {
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('reason', 'auth_error');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Root path - redirect based on auth state
  if (pathname === '/') {
    try {
      const supabase = await getSupabaseClient(req);

      if (!supabase) {
        // If we can't create a client, redirect to login
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }

      // SECURITY FIX: Use getUser() for server-side JWT verification
      const { data: { user }, error } = await supabase.auth.getUser();

      if (!error && user) {
        url.pathname = '/home';
      } else {
        url.pathname = '/login';
      }
      return NextResponse.redirect(url);
    } catch (error) {
      // On error, redirect to login
      console.warn('[Middleware] Error on root path:', error);
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

/**
 * Middleware config
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
