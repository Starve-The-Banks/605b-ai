import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isBetaUser, getBetaAllowlistState } from '@/lib/beta';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await currentUser();
    const fromArray = (user?.emailAddresses ?? []).map(e => e?.emailAddress).filter(Boolean);
    const primary = user?.primaryEmailAddress?.emailAddress;
    const allEmailsRaw = [primary, ...fromArray].filter(Boolean);
    const normalizedEmails = [...new Set(allEmailsRaw.map(e => String(e).trim().toLowerCase()))];

    const allowlistState = getBetaAllowlistState();
    const emailMatch = normalizedEmails.some(e => allowlistState.emailAllowlist.includes(e));
    const userIdMatch = allowlistState.userIdAllowlist.includes(userId);
    const finalResult = isBetaUser({ emails: normalizedEmails, userId });

    return NextResponse.json({
      userId,
      clerkEmails: allEmailsRaw,
      normalizedEmails,
      allowlistEmails: allowlistState.emailAllowlist,
      userIdAllowlist: allowlistState.userIdAllowlist,
      rawEmailEnvLength: allowlistState.rawEmailEnv,
      rawUserIdEnvLength: allowlistState.rawUserIdEnv,
      emailMatch,
      userIdMatch,
      finalResult,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
