import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, adminToken } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const { password } = await request.json();

  if (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
    (await cookies()).set(ADMIN_COOKIE, adminToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}
