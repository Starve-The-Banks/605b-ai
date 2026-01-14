import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { tierPostSchema, validateBody } from '@/lib/validation';

// Lazy initialization to avoid build-time errors
let redis = null;

function getRedis() {
  if (!redis) {
    const { Redis } = require('@upstash/redis');
    redis = Redis.fromEnv();
  }
  return redis;
}

// Default tier features
const TIER_FEATURES = {
  free: {
    pdfAnalyses: 1,
    pdfExport: false,
    letterDownloads: false,
    templates: 'none',
    aiChat: false,
    auditExport: false,
    identityTheftWorkflow: false,
    creditorTemplates: false,
    escalationTemplates: false,
    disputeTracker: false,
  },
  toolkit: {
    pdfAnalyses: 1,
    pdfExport: true,
    letterDownloads: true,
    templates: 'basic',
    aiChat: false,
    auditExport: false,
    identityTheftWorkflow: false,
    creditorTemplates: false,
    escalationTemplates: false,
    disputeTracker: true,
  },
  advanced: {
    pdfAnalyses: 3,
    pdfExport: true,
    letterDownloads: true,
    templates: 'full',
    aiChat: true,
    auditExport: true,
    identityTheftWorkflow: false,
    creditorTemplates: true,
    escalationTemplates: true,
    disputeTracker: true,
  },
  'identity-theft': {
    pdfAnalyses: -1,
    pdfExport: true,
    letterDownloads: true,
    templates: 'full',
    aiChat: true,
    auditExport: true,
    identityTheftWorkflow: true,
    creditorTemplates: true,
    escalationTemplates: true,
    disputeTracker: true,
    attorneyExport: true,
  },
};

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({
        tierData: {
          tier: 'free',
          features: TIER_FEATURES.free,
          pdfAnalysesUsed: 0,
          pdfAnalysesRemaining: 1,
        },
      });
    }

    const redisClient = getRedis();
    const tierDataRaw = await redisClient.get(`user:${userId}:tier`);
    
    if (!tierDataRaw) {
      return NextResponse.json({
        tierData: {
          tier: 'free',
          features: TIER_FEATURES.free,
          pdfAnalysesUsed: 0,
          pdfAnalysesRemaining: 1,
        },
      });
    }

    const tierData = typeof tierDataRaw === 'string' ? JSON.parse(tierDataRaw) : tierDataRaw;

    if (tierData.tier && TIER_FEATURES[tierData.tier]) {
      tierData.features = { ...TIER_FEATURES[tierData.tier], ...tierData.features };
    }

    return NextResponse.json({ tierData });

  } catch (error) {
    console.error('Error fetching tier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tier data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body with Zod
    const body = await request.json();
    const { data, error: validationError } = validateBody(tierPostSchema, body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { tier } = data;

    if (tier !== 'free') {
      return NextResponse.json({ 
        error: 'Paid tiers can only be activated through purchase' 
      }, { status: 400 });
    }

    const redisClient = getRedis();
    const tierData = {
      tier: 'free',
      features: TIER_FEATURES.free,
      setAt: new Date().toISOString(),
      pdfAnalysesUsed: 0,
      pdfAnalysesRemaining: 1,
    };

    await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));

    return NextResponse.json({ tierData });

  } catch (error) {
    console.error('Error setting tier:', error);
    return NextResponse.json(
      { error: 'Failed to set tier' },
      { status: 500 }
    );
  }
}
