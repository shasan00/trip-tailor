import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// List of paths that require authentication
const PROTECTED_PATHS = [
  '/create',
  '/profile',
  '/settings',
  '/favorites',
  '/my-itineraries'
];

// Paths that should redirect to home if already authenticated
const AUTH_PATHS = [
  '/login',
  '/register'
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Get the session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // Check if the path requires authentication
  const isProtectedPath = PROTECTED_PATHS.some(protectedPath => 
    path.startsWith(protectedPath)
  );
  
  // If it's a protected path and there's no token, redirect to login
  if (isProtectedPath && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }
  
  // Check if the path is for authentication (login/register)
  const isAuthPath = AUTH_PATHS.some(authPath => 
    path.startsWith(authPath)
  );
  
  // If the user is already logged in and trying to access auth pages, redirect to home
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [...PROTECTED_PATHS, ...AUTH_PATHS],
}; 