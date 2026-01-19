import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { headers } from 'next/headers';

// Lazy initialization
let redis = null;

function getRedis() {
  if (!redis) {
    const { Redis } = require('@upstash/redis');
    redis = Redis.fromEnv();
  }
  return redis;
}

// Validation limits
const MAX_CREDITORS = 20;
const MAX_CREDITOR_LENGTH = 100;
const MAX_FIELD_LENGTH = 200;

// Rate limit: 10 submissions per hour per IP (anti-spam)
const RATE_LIMIT = 10;
const RATE_WINDOW_SECONDS = 3600;

/**
 * Get a hashed identifier for rate limiting (privacy-preserving)
 */
function getClientHash(headersList) {
  // Use forwarded IP or fall back to a generic identifier
  const forwarded = headersList.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  // Hash the IP for privacy
  return createHash('sha256').update(`intake:${ip}`).digest('hex').slice(0, 16);
}

export async function POST(request) {
  try {
    const redisClient = getRedis();
    const headersList = await headers();

    // Rate limit by hashed IP to prevent spam
    const clientHash = getClientHash(headersList);
    const rateLimitKey = `ratelimit:intake:${clientHash}`;

    try {
      const currentCount = await redisClient.incr(rateLimitKey);
      if (currentCount === 1) {
        // First request - set TTL
        await redisClient.expire(rateLimitKey, RATE_WINDOW_SECONDS);
      }
      if (currentCount > RATE_LIMIT) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    } catch (rateLimitError) {
      // Fail open for availability, but log it
      console.error('Rate limit check failed:', rateLimitError);
    }

    const body = await request.json();

    const { fullName, address, city, state, zip, dob, ssnLast4, bureaus, creditors } = body;

    // Validate required fields
    if (!fullName || !address || !city || !state || !zip || !dob || !ssnLast4) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate field lengths
    if (fullName.length > MAX_FIELD_LENGTH || address.length > MAX_FIELD_LENGTH) {
      return NextResponse.json({ error: 'Field too long' }, { status: 400 });
    }

    // Validate SSN format (last 4 digits only)
    if (!/^\d{4}$/.test(ssnLast4)) {
      return NextResponse.json({ error: 'SSN must be exactly 4 digits' }, { status: 400 });
    }

    // Validate state (2 letters)
    if (!/^[A-Za-z]{2}$/.test(state)) {
      return NextResponse.json({ error: 'State must be 2 letters' }, { status: 400 });
    }

    // Validate DOB format
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 });
    }

    // Validate bureaus
    const validBureaus = ['equifax', 'experian', 'transunion'];
    const selectedBureaus = Object.entries(bureaus || {})
      .filter(([key, selected]) => selected && validBureaus.includes(key))
      .map(([key]) => key);

    if (selectedBureaus.length === 0) {
      return NextResponse.json({ error: 'Select at least one credit bureau' }, { status: 400 });
    }

    // Validate creditors
    const validCreditors = (creditors || [])
      .filter(c => c && typeof c === 'string' && c.trim() !== '')
      .slice(0, MAX_CREDITORS)
      .map(c => c.trim().slice(0, MAX_CREDITOR_LENGTH));

    if (validCreditors.length === 0) {
      return NextResponse.json({ error: 'Enter at least one creditor name' }, { status: 400 });
    }

    // Generate a random token
    const token = randomBytes(32).toString('hex');

    // Prepare intake data (do NOT store more than necessary)
    const intakeData = {
      fullName: fullName.trim().slice(0, MAX_FIELD_LENGTH),
      address: address.trim().slice(0, MAX_FIELD_LENGTH),
      city: city.trim().slice(0, 100),
      state: state.trim().toUpperCase().slice(0, 2),
      zip: zip.trim().slice(0, 10),
      dob: dob,
      ssnLast4: ssnLast4, // Only last 4 digits, never full SSN
      bureaus: selectedBureaus,
      creditors: validCreditors,
      createdAt: new Date().toISOString(),
    };

    // Store in Redis with 1 hour TTL
    await redisClient.set(
      `it:intake:${token}`,
      JSON.stringify(intakeData),
      { ex: 3600 } // 1 hour expiry
    );

    return NextResponse.json({ token });

  } catch (error) {
    console.error('Intake error:', error);
    return NextResponse.json(
      { error: 'Failed to process intake' },
      { status: 500 }
    );
  }
}
