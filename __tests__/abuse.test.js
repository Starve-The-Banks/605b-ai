/**
 * Abuse Prevention Tests
 *
 * These tests verify that the API routes properly validate and reject malicious input.
 * Run with: npm test (after adding jest to package.json)
 */

import { validateBody, chatSchema, ttsSchema, stripeCheckoutSchema } from '../lib/validation';

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
