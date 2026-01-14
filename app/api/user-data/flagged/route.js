import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Lazy initialization to avoid build-time errors
let redis = null;

function getRedis() {
  if (!redis) {
    const { Redis } = require('@upstash/redis');
    redis = Redis.fromEnv();
  }
  return redis;
}

// Limits to prevent abuse
const MAX_FLAGGED_ITEMS = 500;
const MAX_ITEMS_PER_REQUEST = 100;

// Get flagged items
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redisClient = getRedis();
    const flaggedItems = await redisClient.get(`user:${userId}:flagged`) || [];
    return NextResponse.json({ flaggedItems });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch flagged items' }, { status: 500 });
  }
}

// Save/update flagged items
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redisClient = getRedis();
    const { action, items, itemId, updates } = await request.json();

    // Save findings from PDF analysis (replace all)
    if (action === 'save' && items) {
      // Validate items is an array and limit size
      if (!Array.isArray(items)) {
        return NextResponse.json({ error: 'Items must be an array' }, { status: 400 });
      }

      // Limit items to prevent abuse
      const limitedItems = items.slice(0, MAX_ITEMS_PER_REQUEST);

      const flaggedItems = limitedItems.map((item, index) => ({
        ...item,
        id: item.id || `flagged-${Date.now()}-${index}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }));

      await redisClient.set(`user:${userId}:flagged`, flaggedItems.slice(0, MAX_FLAGGED_ITEMS));
      
      await appendAuditLog(redisClient, userId, {
        action: 'upload_report',
        findingsCount: flaggedItems.length,
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json({ success: true, flaggedItems });
    }

    // Add new findings (append)
    if (action === 'add' && items) {
      // Validate items is an array and limit size
      if (!Array.isArray(items)) {
        return NextResponse.json({ error: 'Items must be an array' }, { status: 400 });
      }

      // Limit items to prevent abuse
      const limitedItems = items.slice(0, MAX_ITEMS_PER_REQUEST);

      const existing = await redisClient.get(`user:${userId}:flagged`) || [];
      const newItems = limitedItems.map((item, index) => ({
        ...item,
        id: item.id || `flagged-${Date.now()}-${index}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }));

      // Enforce max limit
      const updated = [...existing, ...newItems].slice(-MAX_FLAGGED_ITEMS);
      await redisClient.set(`user:${userId}:flagged`, updated);
      
      return NextResponse.json({ success: true, flaggedItems: updated });
    }

    // Update single item status (e.g., mark as disputed)
    if (action === 'update' && itemId) {
      const existing = await redisClient.get(`user:${userId}:flagged`) || [];
      const updated = existing.map(item => 
        item.id === itemId 
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      );
      
      await redisClient.set(`user:${userId}:flagged`, updated);
      
      if (updates.status === 'disputed') {
        await appendAuditLog(redisClient, userId, {
          action: 'flag_item',
          itemId,
          account: existing.find(i => i.id === itemId)?.account,
          timestamp: new Date().toISOString(),
        });
      }
      
      return NextResponse.json({ success: true, flaggedItems: updated });
    }

    // Dismiss item
    if (action === 'dismiss' && itemId) {
      const existing = await redisClient.get(`user:${userId}:flagged`) || [];
      const updated = existing.map(item => 
        item.id === itemId 
          ? { ...item, status: 'dismissed', updatedAt: new Date().toISOString() }
          : item
      );
      
      await redisClient.set(`user:${userId}:flagged`, updated);
      
      return NextResponse.json({ success: true, flaggedItems: updated });
    }

    // Clear all flagged items
    if (action === 'clear') {
      await redisClient.set(`user:${userId}:flagged`, []);
      return NextResponse.json({ success: true, flaggedItems: [] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to manage flagged items' }, { status: 500 });
  }
}

async function appendAuditLog(redisClient, userId, entry) {
  try {
    const existing = await redisClient.get(`user:${userId}:audit`) || [];
    const updated = [...existing, { ...entry, id: `audit-${Date.now()}` }].slice(-500);
    await redisClient.set(`user:${userId}:audit`, updated);
  } catch (error) {
    console.error('Failed to append audit log:', error);
  }
}
