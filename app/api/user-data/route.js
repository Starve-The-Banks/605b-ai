import { kv } from '@vercel/kv';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Get user data
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await kv.get(`user:${userId}:data`);

    return NextResponse.json({
      disputes: data?.disputes || [],
      auditLog: data?.auditLog || [],
      flaggedItems: data?.flaggedItems || []
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// Save user data
export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { disputes, auditLog, flaggedItems } = body;

    await kv.set(`user:${userId}:data`, {
      disputes: disputes || [],
      auditLog: auditLog || [],
      flaggedItems: flaggedItems || [],
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving user data:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
