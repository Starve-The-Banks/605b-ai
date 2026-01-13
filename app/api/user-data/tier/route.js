import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

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
      // Return free tier for unauthenticated users
      return NextResponse.json({
        tierData: {
          tier: 'free',
          features: TIER_FEATURES.free,
          pdfAnalysesUsed: 0,
          pdfAnalysesRemaining: 1,
        },
      });
    }

    // Get user's tier data from Redis
    const tierDataRaw = await redis.get(`user:${userId}:tier`);
    
    if (!tierDataRaw) {
      // User hasn't purchased, return free tier
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

    // Ensure features are up-to-date (in case we've updated tier definitions)
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

    const body = await request.json();
    const { tier } = body;

    // Validate tier
    if (!TIER_FEATURES[tier]) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Only allow setting to 'free' tier via this endpoint
    // Paid tiers should only be set via Stripe webhook
    if (tier !== 'free') {
      return NextResponse.json({ 
        error: 'Paid tiers can only be activated through purchase' 
      }, { status: 400 });
    }

    const tierData = {
      tier: 'free',
      features: TIER_FEATURES.free,
      setAt: new Date().toISOString(),
      pdfAnalysesUsed: 0,
      pdfAnalysesRemaining: 1,
    };

    await redis.set(`user:${userId}:tier`, JSON.stringify(tierData));

    return NextResponse.json({ tierData });

  } catch (error) {
    console.error('Error setting tier:', error);
    return NextResponse.json(
      { error: 'Failed to set tier' },
      { status: 500 }
    );
  }
}
