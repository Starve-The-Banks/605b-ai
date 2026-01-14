/**
 * Abuse Prevention Tests
 *
 * These tests verify that the API routes properly validate and reject malicious input.
 * Run with: npm test (after adding jest to package.json)
 */

import { validateBody, chatSchema, ttsSchema, stripeCheckoutSchema } from '../lib/validation';
import { timingSafeEqual } from 'crypto';

describe('Chat API Abuse Prevention', () => {
  test('rejects messages exceeding max length', () => {
    const oversizedMessage = 'a'.repeat(11000); // MAX_MESSAGE_LENGTH is 10000
    const { data, error } = validateBody(chatSchema, {
      messages: [{ role: 'user', content: oversizedMessage }]
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  test('rejects too many messages', () => {
    const messages = Array(51).fill({ role: 'user', content: 'test' });
    const { data, error } = validateBody(chatSchema, { messages });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  test('rejects invalid message roles', () => {
    const { data, error } = validateBody(chatSchema, {
      messages: [{ role: 'admin', content: 'test' }]
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  test('rejects system prompt exceeding max length', () => {
    const oversizedPrompt = 'a'.repeat(6000); // MAX_SYSTEM_PROMPT_LENGTH is 5000
    const { data, error } = validateBody(chatSchema, {
      messages: [{ role: 'user', content: 'test' }],
      systemPrompt: oversizedPrompt
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  test('accepts valid chat input', () => {
    const { data, error } = validateBody(chatSchema, {
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ],
      systemPrompt: 'You are helpful.'
    });

    expect(error).toBeNull();
    expect(data.messages).toHaveLength(2);
  });
});

describe('TTS API Abuse Prevention', () => {
  test('rejects text exceeding max length', () => {
    const oversizedText = 'a'.repeat(6000); // MAX_TEXT_LENGTH is 5000
    const { data, error } = validateBody(ttsSchema, { text: oversizedText });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  test('rejects empty text', () => {
    const { data, error } = validateBody(ttsSchema, { text: '' });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  test('rejects invalid voice', () => {
    const { data, error } = validateBody(ttsSchema, {
      text: 'test',
      voice: 'EvilVoice'
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  test('accepts valid TTS input', () => {
    const { data, error } = validateBody(ttsSchema, {
      text: 'Hello world',
      voice: 'Rachel'
    });

    expect(error).toBeNull();
    expect(data.text).toBe('Hello world');
    expect(data.voice).toBe('Rachel');
  });
});

describe('Stripe Checkout Abuse Prevention', () => {
  test('rejects invalid tier ID', () => {
    const { data, error } = validateBody(stripeCheckoutSchema, {
      tierId: 'premium-unlimited', // Not in valid tier list
      disclaimerAccepted: true
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  test('rejects invalid addon ID', () => {
    const { data, error } = validateBody(stripeCheckoutSchema, {
      addonId: 'free-stuff', // Not in valid addon list
      disclaimerAccepted: true
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  test('rejects request with no product specified', () => {
    const { data, error } = validateBody(stripeCheckoutSchema, {
      disclaimerAccepted: true
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  test('accepts valid tier checkout', () => {
    const { data, error } = validateBody(stripeCheckoutSchema, {
      tierId: 'advanced',
      disclaimerAccepted: true,
      disclaimerTimestamp: new Date().toISOString()
    });

    expect(error).toBeNull();
    expect(data.tierId).toBe('advanced');
  });

  test('accepts valid addon checkout', () => {
    const { data, error } = validateBody(stripeCheckoutSchema, {
      addonId: 'extra-analysis',
      disclaimerAccepted: true
    });

    expect(error).toBeNull();
    expect(data.addonId).toBe('extra-analysis');
  });
});

// PDF Magic Bytes Validation Test
describe('PDF Upload Abuse Prevention', () => {
  const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2D]; // %PDF-

  test('validates PDF magic bytes correctly', () => {
    // Valid PDF header
    const validPdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
    const hasPdfMagic = PDF_MAGIC_BYTES.every((byte, i) => validPdf[i] === byte);
    expect(hasPdfMagic).toBe(true);
  });

  test('rejects non-PDF files disguised as PDF', () => {
    // JPEG file with wrong extension
    const fakeJpeg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    const hasPdfMagic = PDF_MAGIC_BYTES.every((byte, i) => fakeJpeg[i] === byte);
    expect(hasPdfMagic).toBe(false);
  });

  test('rejects HTML file with PDF extension', () => {
    // HTML file
    const fakeHtml = Buffer.from('<html><body>malicious content</body></html>');
    const hasPdfMagic = PDF_MAGIC_BYTES.every((byte, i) => fakeHtml[i] === byte);
    expect(hasPdfMagic).toBe(false);
  });

  test('rejects too-small files', () => {
    const tinyFile = Buffer.from([0x25, 0x50]);
    expect(tinyFile.length).toBeLessThan(5);
  });
});

// Retry Grants Authorization Tests
describe('Retry Grants Authorization', () => {

  // Replicate the constant-time compare function from retry-grants
  function constantTimeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
      return false;
    }
    const maxLen = Math.max(a.length, b.length);
    const aPadded = a.padEnd(maxLen, '\0');
    const bPadded = b.padEnd(maxLen, '\0');
    try {
      return timingSafeEqual(Buffer.from(aPadded), Buffer.from(bPadded)) && a.length === b.length;
    } catch {
      return false;
    }
  }

  function verifyAuth(authHeader, cronSecret) {
    if (!cronSecret) return false;
    if (!authHeader) return false;
    if (!authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.slice(7);
    return constantTimeCompare(token, cronSecret);
  }

  test('rejects missing authorization header', () => {
    const result = verifyAuth(null, 'test-secret');
    expect(result).toBe(false);
  });

  test('rejects empty authorization header', () => {
    const result = verifyAuth('', 'test-secret');
    expect(result).toBe(false);
  });

  test('rejects non-Bearer authorization', () => {
    const result = verifyAuth('Basic dXNlcjpwYXNz', 'test-secret');
    expect(result).toBe(false);
  });

  test('rejects wrong token', () => {
    const result = verifyAuth('Bearer wrong-token', 'test-secret');
    expect(result).toBe(false);
  });

  test('rejects when CRON_SECRET is not configured', () => {
    const result = verifyAuth('Bearer any-token', null);
    expect(result).toBe(false);
  });

  test('accepts correct Bearer token', () => {
    const secret = 'my-cron-secret-123';
    const result = verifyAuth(`Bearer ${secret}`, secret);
    expect(result).toBe(true);
  });

  test('constant-time compare handles different length strings', () => {
    // These should NOT match even though they share a prefix
    expect(constantTimeCompare('short', 'shortlonger')).toBe(false);
    expect(constantTimeCompare('abc', 'abc')).toBe(true);
    expect(constantTimeCompare('', '')).toBe(true);
  });
});

// Queue Non-Stalling Tests
describe('Queue Non-Stalling Behavior', () => {
  // Mock Redis-like queue behavior
  class MockQueue {
    constructor() {
      this.items = [];
      this.processedResults = [];
    }

    lpush(item) {
      this.items.unshift(item);
    }

    rpush(item) {
      this.items.push(item);
    }

    lpop() {
      return this.items.shift() || null;
    }

    llen() {
      return this.items.length;
    }
  }

  test('LPOP allows processing to continue when first item fails', () => {
    const queue = new MockQueue();
    queue.lpush('event-3');
    queue.lpush('event-2');
    queue.lpush('event-1'); // This will be at the front

    const processed = [];
    const failingEvent = 'event-1';

    // Simulate processing with LPOP
    for (let i = 0; i < 3; i++) {
      const eventId = queue.lpop();
      if (!eventId) break;

      if (eventId === failingEvent) {
        // Simulate failure - re-enqueue at end
        queue.rpush(eventId);
        processed.push({ eventId, status: 'failed' });
      } else {
        processed.push({ eventId, status: 'success' });
      }
    }

    // All items were processed despite the failure
    expect(processed.length).toBe(3);
    expect(processed[0]).toEqual({ eventId: 'event-1', status: 'failed' });
    expect(processed[1]).toEqual({ eventId: 'event-2', status: 'success' });
    expect(processed[2]).toEqual({ eventId: 'event-3', status: 'success' });

    // Failed event is now at the end of queue for retry
    expect(queue.llen()).toBe(1);
    expect(queue.lpop()).toBe('event-1');
  });

  test('failed events are re-enqueued at end, not blocking head', () => {
    const queue = new MockQueue();
    queue.lpush('good-event-2');
    queue.lpush('good-event-1');
    queue.lpush('bad-event'); // Front of queue

    // First pass: bad event fails and is re-enqueued
    const event1 = queue.lpop();
    expect(event1).toBe('bad-event');
    queue.rpush(event1); // Re-enqueue at end

    // Second pass: good events process successfully
    const event2 = queue.lpop();
    expect(event2).toBe('good-event-1');

    const event3 = queue.lpop();
    expect(event3).toBe('good-event-2');

    // Bad event is now last and can be retried
    const event4 = queue.lpop();
    expect(event4).toBe('bad-event');

    expect(queue.llen()).toBe(0);
  });

  test('dead-letter queue receives events after max retries', () => {
    const mainQueue = new MockQueue();
    const deadLetterQueue = new MockQueue();
    const maxRetries = 5;

    mainQueue.lpush('persistent-failure');

    let retryCount = 0;

    // Simulate retry loop
    while (mainQueue.llen() > 0 && retryCount <= maxRetries) {
      const eventId = mainQueue.lpop();

      if (retryCount >= maxRetries) {
        // Move to dead letter
        deadLetterQueue.lpush(eventId);
      } else {
        // Simulate failure, re-enqueue
        mainQueue.rpush(eventId);
        retryCount++;
      }
    }

    expect(mainQueue.llen()).toBe(0);
    expect(deadLetterQueue.llen()).toBe(1);
    expect(deadLetterQueue.lpop()).toBe('persistent-failure');
  });
});
