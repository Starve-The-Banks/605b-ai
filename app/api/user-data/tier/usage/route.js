import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { usageSchema, validateBody } from '@/lib/validation';

// Lazy initialization to avoid build-time errors
let redis = null;

function getRedis() {
  if (!redis) {
    const { Redis } = require('@upstash/redis');
    redis = Redis.fromEnv();
  }
  return redis;
}

// Action to field mapping
const USAGE_FIELDS = {
  'analyze_pdf': 'pdfAnalysesUsed',
  'ai_chat_message': 'aiCreditsUsed',
  'download_letter': 'letterDownloadsUsed',
  'export_audit': 'auditExportsUsed',
};

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body with Zod
    const body = await request.json();
    const { data, error: validationError } = validateBody(usageSchema, body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { action, increment } = data;

    const redisClient = getRedis();
    const field = USAGE_FIELDS[action];

    const tierDataRaw = await redisClient.get(`user:${userId}:tier`);
    
    if (!tierDataRaw) {
      return NextResponse.json({ error: 'No tier data found' }, { status: 404 });
    }

    const tierData = typeof tierDataRaw === 'string' ? JSON.parse(tierDataRaw) : tierDataRaw;

    const currentUsage = tierData[field] || 0;
    tierData[field] = currentUsage + increment;

    if (action === 'analyze_pdf' && tierData.features?.pdfAnalyses !== -1) {
      tierData.pdfAnalysesRemaining = Math.max(0, 
        (tierData.features?.pdfAnalyses || 1) - tierData.pdfAnalysesUsed
      );
    }

    await redisClient.set(`user:${userId}:tier`, JSON.stringify(tierData));

    const auditEntry = {
      id: `usage_${Date.now()}`,
      type: 'usage',
      action: action,
      timestamp: new Date().toISOString(),
    };

    const existingAudit = await redisClient.get(`user:${userId}:audit`);
    const auditLog = existingAudit 
      ? (typeof existingAudit === 'string' ? JSON.parse(existingAudit) : existingAudit)
      : [];
    auditLog.unshift(auditEntry);
    await redisClient.set(`user:${userId}:audit`, JSON.stringify(auditLog.slice(0, 1000)));

    return NextResponse.json({ 
      success: true,
      [field]: tierData[field],
      remaining: tierData[`${field.replace('Used', '')}Remaining`],
    });

  } catch (error) {
    console.error('Error recording usage:', error);
    return NextResponse.json(
      { error: 'Failed to record usage' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redisClient = getRedis();
    const tierDataRaw = await redisClient.get(`user:${userId}:tier`);
    
    if (!tierDataRaw) {
      return NextResponse.json({
        usage: {
          pdfAnalysesUsed: 0,
          pdfAnalysesRemaining: 1,
          aiCreditsUsed: 0,
        },
      });
    }

    const tierData = typeof tierDataRaw === 'string' ? JSON.parse(tierDataRaw) : tierDataRaw;

    return NextResponse.json({
      usage: {
        pdfAnalysesUsed: tierData.pdfAnalysesUsed || 0,
        pdfAnalysesRemaining: tierData.pdfAnalysesRemaining || 0,
        aiCreditsUsed: tierData.aiCreditsUsed || 0,
        aiCreditsRemaining: tierData.aiCreditsRemaining || 0,
        letterDownloadsUsed: tierData.letterDownloadsUsed || 0,
        auditExportsUsed: tierData.auditExportsUsed || 0,
      },
    });

  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
