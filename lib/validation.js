import { z } from 'zod';

// Max lengths to prevent abuse
const MAX_MESSAGE_LENGTH = 10000;
const MAX_SYSTEM_PROMPT_LENGTH = 5000;
const MAX_TEXT_LENGTH = 5000;
const MAX_EMAIL_LENGTH = 254;
const MAX_NOTIFICATION_MESSAGE_LENGTH = 500;
const MAX_NOTIFICATIONS = 50;
const MAX_DISPUTES = 100;
const MAX_AUDIT_LOG = 1000;
const MAX_FLAGGED_ITEMS = 500;
const MAX_ITEM_FIELD_LENGTH = 1000;

// Chat API schema
export const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(MAX_MESSAGE_LENGTH),
  })).min(1).max(50),
  systemPrompt: z.string().max(MAX_SYSTEM_PROMPT_LENGTH).optional(),
});

// TTS API schema
export const ttsSchema = z.object({
  text: z.string().min(1).max(MAX_TEXT_LENGTH),
  voice: z.enum(['Rachel', 'Domi', 'Bella', 'Antoni', 'Josh', 'Arnold', 'Sam']).optional(),
});

// Email notification schema
export const emailNotificationSchema = z.object({
  email: z.string().email().max(MAX_EMAIL_LENGTH),
  notifications: z.array(z.object({
    type: z.enum(['urgent', 'warning', 'info']),
    message: z.string().max(MAX_NOTIFICATION_MESSAGE_LENGTH),
  })).min(1).max(MAX_NOTIFICATIONS),
});

// Stripe checkout schema
export const stripeCheckoutSchema = z.object({
  tierId: z.enum(['free', 'toolkit', 'advanced', 'identity-theft']).optional(),
  addonId: z.enum(['extra-analysis', 'ai-credits', 'attorney-export']).optional(),
  disclaimerAccepted: z.boolean().optional(),
  disclaimerTimestamp: z.string().max(100).optional(),
}).refine(
  data => data.tierId || data.addonId,
  { message: 'Either tierId or addonId is required' }
);

// User data schema
export const userDataSchema = z.object({
  disputes: z.array(z.object({
    id: z.string().max(100),
    account: z.string().max(MAX_ITEM_FIELD_LENGTH).optional(),
    bureau: z.string().max(100).optional(),
    status: z.string().max(50).optional(),
    dateSent: z.string().max(50).optional(),
    dateResponseDue: z.string().max(50).optional(),
    notes: z.string().max(MAX_ITEM_FIELD_LENGTH).optional(),
  }).passthrough()).max(MAX_DISPUTES).optional().default([]),
  auditLog: z.array(z.object({
    id: z.string().max(100),
    type: z.string().max(50).optional(),
    action: z.string().max(100).optional(),
    timestamp: z.string().max(50).optional(),
  }).passthrough()).max(MAX_AUDIT_LOG).optional().default([]),
  flaggedItems: z.array(z.object({
    id: z.string().max(100),
    account: z.string().max(MAX_ITEM_FIELD_LENGTH).optional(),
    issue: z.string().max(MAX_ITEM_FIELD_LENGTH).optional(),
    status: z.string().max(50).optional(),
  }).passthrough()).max(MAX_FLAGGED_ITEMS).optional().default([]),
});

// Tier POST schema
export const tierPostSchema = z.object({
  tier: z.enum(['free', 'toolkit', 'advanced', 'identity-theft']),
});

// Usage tracking schema
export const usageSchema = z.object({
  action: z.enum(['analyze_pdf', 'ai_chat_message', 'download_letter', 'export_audit']),
  increment: z.number().int().min(1).max(100).optional().default(1),
});

// Flagged items actions schema
export const flaggedItemsActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('save'),
    items: z.array(z.object({
      id: z.string().max(100).optional(),
      account: z.string().max(MAX_ITEM_FIELD_LENGTH).optional(),
      issue: z.string().max(MAX_ITEM_FIELD_LENGTH).optional(),
      type: z.string().max(50).optional(),
      severity: z.string().max(20).optional(),
      statute: z.string().max(50).optional(),
      recommendation: z.string().max(MAX_ITEM_FIELD_LENGTH).optional(),
    }).passthrough()).max(100),
  }),
  z.object({
    action: z.literal('add'),
    items: z.array(z.object({
      id: z.string().max(100).optional(),
      account: z.string().max(MAX_ITEM_FIELD_LENGTH).optional(),
      issue: z.string().max(MAX_ITEM_FIELD_LENGTH).optional(),
    }).passthrough()).max(100),
  }),
  z.object({
    action: z.literal('update'),
    itemId: z.string().max(100),
    updates: z.object({
      status: z.enum(['pending', 'disputed', 'resolved', 'dismissed']).optional(),
      notes: z.string().max(MAX_ITEM_FIELD_LENGTH).optional(),
    }).passthrough(),
  }),
  z.object({
    action: z.literal('dismiss'),
    itemId: z.string().max(100),
  }),
  z.object({
    action: z.literal('clear'),
  }),
]);

/**
 * Validate request body with Zod schema
 * Returns { data, error } where data is the parsed value or null, error is string or null
 */
export function validateBody(schema, body) {
  try {
    const data = schema.parse(body);
    return { data, error: null };
  } catch (e) {
    // Handle both Zod 3 and Zod 4 error structures
    if (e && typeof e === 'object') {
      // Zod 4 uses e.issues, Zod 3 uses e.errors
      const issues = e.issues || e.errors;
      if (Array.isArray(issues) && issues.length > 0) {
        return {
          data: null,
          error: issues[0]?.message || 'Validation failed'
        };
      }
      // If it's a Zod error but with different structure
      if (e.message) {
        return { data: null, error: e.message };
      }
    }
    return { data: null, error: 'Invalid request body' };
  }
}
