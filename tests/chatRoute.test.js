import { jest } from '@jest/globals';

process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.ANTHROPIC_CHAT_MODEL = 'claude-test-model';
process.env.NODE_ENV = 'test';

const mockAnthropicStream = jest.fn();
const mockResolveApiAuth = jest.fn();
const mockAuthExpiredResponse = jest.fn();
const mockRateLimit = jest.fn();
const mockRedisGet = jest.fn();
const mockCurrentUser = jest.fn();
const mockIsReviewerRequest = jest.fn();
const mockIsBetaUser = jest.fn();

function makeTextStream(chunks) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: chunk },
        };
      }
    },
  };
}

await jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    constructor() {
      this.messages = {
        stream: mockAnthropicStream,
      };
    }
  },
}));

await jest.unstable_mockModule('@clerk/nextjs/server', () => ({
  currentUser: mockCurrentUser,
}));

await jest.unstable_mockModule('@/lib/apiAuth', () => ({
  resolveApiAuth: mockResolveApiAuth,
  authExpiredResponse: mockAuthExpiredResponse,
}));

await jest.unstable_mockModule('@/lib/rateLimit', () => ({
  rateLimit: mockRateLimit,
  LIMITS: { chat: 20 },
}));

await jest.unstable_mockModule('@/lib/redis', () => ({
  getRedis: () => ({
    get: mockRedisGet,
  }),
}));

await jest.unstable_mockModule('@/lib/beta', () => ({
  isReviewerRequest: mockIsReviewerRequest,
  isBetaUser: mockIsBetaUser,
}));

const { POST } = await import('../app/api/chat/route.js');

describe('POST /api/chat', () => {
  function makeRequest(
    messages = [{ role: 'user', content: 'Hello' }],
    extraHeaders = {}
  ) {
    return new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify({ messages }),
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();

    mockResolveApiAuth.mockResolvedValue({
      userId: 'user_123',
      authResult: { sessionClaims: { email: 'member@example.com' } },
      error: null,
    });
    mockAuthExpiredResponse.mockReturnValue(
      Response.json({ error: { code: 'AUTH_REQUIRED' } }, { status: 401 })
    );
    mockCurrentUser.mockResolvedValue({
      primaryEmailAddress: { emailAddress: 'member@example.com' },
      emailAddresses: [{ emailAddress: 'member@example.com' }],
    });
    mockIsReviewerRequest.mockReturnValue(false);
    mockIsBetaUser.mockReturnValue(false);
    mockRateLimit.mockResolvedValue({ allowed: true, resetIn: 0 });
    mockRedisGet.mockResolvedValue(
      JSON.stringify({
        tier: 'advanced',
        features: { aiChat: true },
        accessFrozen: false,
        accessRevoked: false,
      })
    );
    mockAnthropicStream.mockResolvedValue(makeTextStream(['Hello', ' world']));
  });

  test('requires authentication', async () => {
    mockResolveApiAuth.mockResolvedValue({ userId: null, authResult: null, error: new Error('auth') });

    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
    expect(mockAuthExpiredResponse).toHaveBeenCalledWith('AUTH_REQUIRED');
  });

  test('requires AI entitlement', async () => {
    mockRedisGet.mockResolvedValue(
      JSON.stringify({
        tier: 'free',
        features: { aiChat: false },
      })
    );

    const response = await POST(makeRequest());
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toMatch(/eligible plan/i);
  });

  test('streams assistant response when authorized', async () => {
    const response = await POST(makeRequest([{ role: 'user', content: 'What is FCRA 611?' }]));
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain('Hello world');
    expect(response.headers.get('x-chat-model')).toBe('claude-test-model');
  });

  test('injects mandatory prompt safety rules', async () => {
    await POST(makeRequest([{ role: 'user', content: 'How do I dispute this account?' }]));
    const streamCall = mockAnthropicStream.mock.calls[0]?.[0];
    expect(streamCall.system).toMatch(/Never assume an account is incorrect/i);
    expect(streamCall.system).toMatch(/Never suggest removal/i);
    expect(streamCall.system).toMatch(/verification and document-preparation guidance/i);
    expect(streamCall.system).toMatch(/If details are missing or unclear/i);
    expect(streamCall.system).toMatch(/Never promise credit-score improvement/i);
  });

  test('returns safe provider failure message', async () => {
    const providerErr = Object.assign(new Error('provider internal failure'), { status: 500 });
    mockAnthropicStream.mockRejectedValue(providerErr);

    const response = await POST(makeRequest());
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('An unexpected error occurred');
  });

  test('supports forced provider failure header in non-production', async () => {
    const response = await POST(
      makeRequest([{ role: 'user', content: 'Hi' }], { 'x-test-force-provider-failure': '1' })
    );
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toMatch(/temporarily unavailable/i);
    expect(mockAnthropicStream).not.toHaveBeenCalled();
  });

  test('does not leak sensitive provider error text to logs', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const providerErr = Object.assign(
      new Error('provider rejected content with SSN 123-45-6789'),
      { status: 500, code: 'E_PROVIDER' }
    );
    mockAnthropicStream.mockRejectedValue(providerErr);

    await POST(makeRequest());

    const logged = consoleErrorSpy.mock.calls.flat().join(' ');
    expect(logged).not.toContain('123-45-6789');

    consoleErrorSpy.mockRestore();
  });
});
