export const runtime = 'nodejs';

import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getRedis } from '@/lib/redis';
import { isBetaUser } from '@/lib/beta';

const REQUIRED_FIELDS = [
  'fullName',
  'ssnLast4',
  'address',
  'city',
  'state',
  'zip',
  'bureaus',
  'accounts',
  'narrative',
];

const INTAKE_TTL_SECONDS = 86400 * 7;

function getTierId(tierData) {
  if (!tierData) return null;
  if (typeof tierData === 'string') {
    try {
      const parsed = JSON.parse(tierData);
      return parsed?.tier || tierData;
    } catch {
      return tierData;
    }
  }
  return tierData?.tier || null;
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 },
      );
    }

    const redisClient = getRedis();

    const user = await currentUser();
    const allEmails = (user?.emailAddresses ?? []).map(e => e?.emailAddress).filter(Boolean);
    const betaWhitelisted = isBetaUser({ emails: allEmails, userId });

    if (!betaWhitelisted) {
      const tierData = await redisClient.get(`user:${userId}:tier`);
      if (getTierId(tierData) !== 'identity-theft') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Identity theft workflow requires the 605B Identity Theft Toolkit tier.',
          },
          { status: 403 },
        );
      }
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body.' },
        { status: 400 },
      );
    }

    for (const field of REQUIRED_FIELDS) {
      const value = body[field];
      if (field === 'bureaus') {
        if (!Array.isArray(value) || value.length === 0) {
          return NextResponse.json(
            { success: false, error: `Missing or empty required field: ${field}` },
            { status: 400 },
          );
        }
      } else if (typeof value !== 'string' || value.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: `Missing or empty required field: ${field}` },
          { status: 400 },
        );
      }
    }

    const token = crypto.randomBytes(32).toString('hex');

    const creditors = body.accounts
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const intakeData = {
      fullName: body.fullName,
      email: body.email || '',
      phone: body.phone || '',
      dob: body.dob || '',
      ssnLast4: body.ssnLast4,
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      incidentDate: body.incidentDate || '',
      discoveryDate: body.discoveryDate || '',
      policeReportNumber: body.policeReportNumber || '',
      policeReportDate: body.policeReportDate || '',
      ftcReportNumber: body.ftcReportNumber || '',
      bureaus: body.bureaus,
      accounts: body.accounts,
      narrative: body.narrative,
      creditors,
      userId,
      createdAt: new Date().toISOString(),
      status: 'submitted',
    };

    await redisClient.set(
      `it:intake:${token}`,
      JSON.stringify(intakeData),
      { ex: INTAKE_TTL_SECONDS },
    );

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://www.605b.ai';
    const downloadUrl = `${baseUrl}/api/identity-theft/generate?intake=${token}`;

    return NextResponse.json({
      success: true,
      packetId: token,
      downloadUrl,
    });
  } catch (error) {
    console.error('Identity theft intake error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process intake. Please try again.' },
      { status: 500 },
    );
  }
}
