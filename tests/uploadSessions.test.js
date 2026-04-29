import { readFileSync } from 'fs';
import { join } from 'path';

import {
  createUploadSession,
  finalizeUpload,
  getChunks,
  storeChunk,
  validateOwnership,
} from '../lib/analyze/uploadSessions.js';

function createRedisMock() {
  const store = new Map();
  return {
    store,
    async get(key) {
      return store.get(key) ?? null;
    },
    async set(key, value) {
      store.set(key, value);
      return 'OK';
    },
    async del(...keys) {
      for (const key of keys) store.delete(key);
      return keys.length;
    },
  };
}

describe('analyze upload sessions', () => {
  test('creates an upload session owned by the authenticated user', async () => {
    const redis = createRedisMock();

    const session = await createUploadSession('user_a', { redisClient: redis, now: 1_700_000_000_000 });

    expect(session.uploadId).toEqual(expect.any(String));
    expect(session.expiresAt).toBe('2023-11-14T22:28:20.000Z');
    await expect(validateOwnership(session.uploadId, 'user_a', { redisClient: redis, now: 1_700_000_001_000 })).resolves.toMatchObject({
      uploadId: session.uploadId,
      userId: 'user_a',
    });
    await expect(validateOwnership(session.uploadId, 'user_b', { redisClient: redis, now: 1_700_000_001_000 })).rejects.toMatchObject({
      code: 'ANALYZE_UPLOAD_NOT_FOUND',
    });
  });

  test('stores chunks, returns them in order, and cleans them up on finalize', async () => {
    const redis = createRedisMock();
    const session = await createUploadSession('user_a', { redisClient: redis });

    await storeChunk(session.uploadId, 1, Buffer.from('PDF-2').toString('base64'), {
      redisClient: redis,
      totalChunks: 2,
    });
    await storeChunk(session.uploadId, 0, Buffer.from('%PDF-1').toString('base64'), {
      redisClient: redis,
      totalChunks: 2,
    });

    const chunks = await getChunks(session.uploadId, { redisClient: redis });
    expect(Buffer.concat(chunks).toString()).toBe('%PDF-1PDF-2');

    await finalizeUpload(session.uploadId, { redisClient: redis });
    await expect(getChunks(session.uploadId, { redisClient: redis })).rejects.toMatchObject({
      code: 'ANALYZE_UPLOAD_NOT_FOUND',
    });
  });

  test('rejects missing and expired upload sessions', async () => {
    const redis = createRedisMock();
    await expect(getChunks('missing-upload', { redisClient: redis })).rejects.toMatchObject({
      code: 'ANALYZE_UPLOAD_NOT_FOUND',
    });

    const session = await createUploadSession('user_a', { redisClient: redis, now: 1_700_000_000_000 });
    await expect(
      validateOwnership(session.uploadId, 'user_a', {
        redisClient: redis,
        now: 1_700_001_000_000,
      })
    ).rejects.toMatchObject({
      code: 'UPLOAD_EXPIRED',
    });
  });

  test('new routes expose upload session, chunk upload, and from-upload analysis', () => {
    const uploadSessionRoute = readFileSync(
      join(process.cwd(), 'app/api/analyze/upload-session/route.js'),
      'utf8'
    );
    const chunkRoute = readFileSync(
      join(process.cwd(), 'app/api/analyze/upload-session/[uploadId]/chunk/route.js'),
      'utf8'
    );
    const fromUploadRoute = readFileSync(
      join(process.cwd(), 'app/api/analyze/from-upload/route.js'),
      'utf8'
    );

    expect(uploadSessionRoute).toContain('createUploadSession');
    expect(uploadSessionRoute).toContain('uploadUrl');
    expect(chunkRoute).toContain('storeChunk');
    expect(chunkRoute).toContain('totalChunks');
    expect(fromUploadRoute).toContain('getChunks');
    expect(fromUploadRoute).toContain('finalizeUpload');
    expect(fromUploadRoute).toContain('analyzePost');
    expect(fromUploadRoute).toContain('POST');
  });
});
