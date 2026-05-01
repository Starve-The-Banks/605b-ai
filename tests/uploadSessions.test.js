import { readFileSync } from 'fs';
import { join } from 'path';

import {
  acquireFinalizationLock,
  createUploadSession,
  finalizeUpload,
  getChunks,
  getUploadSessionStatus,
  MAX_UPLOAD_BYTES,
  MAX_TOTAL_CHUNKS,
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
    async set(key, value, opts = {}) {
      if (opts?.nx && store.has(key)) {
        return null;
      }
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
    expect(session.expiresAt).toBe('2023-11-14T22:58:20.000Z');
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
        now: 1_700_002_701_000,
      })
    ).rejects.toMatchObject({
      code: 'UPLOAD_EXPIRED',
    });
  });

  test('rejects upload sessions over the PDF size limit', async () => {
    const redis = createRedisMock();

    await expect(
      createUploadSession('user_a', {
        redisClient: redis,
        fileSize: MAX_UPLOAD_BYTES + 1,
      })
    ).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE',
    });
  });

  test('rejects inconsistent totalChunks instead of silently changing upload shape', async () => {
    const redis = createRedisMock();
    const session = await createUploadSession('user_a', { redisClient: redis });

    await storeChunk(session.uploadId, 0, Buffer.from('%PDF-1').toString('base64'), {
      redisClient: redis,
      totalChunks: 2,
    });

    await expect(
      storeChunk(session.uploadId, 1, Buffer.from('PDF-2').toString('base64'), {
        redisClient: redis,
        totalChunks: 3,
      })
    ).rejects.toMatchObject({
      code: 'CHUNK_MISMATCH',
    });
  });

  test('rejects unusually high chunk counts before storing data', async () => {
    const redis = createRedisMock();
    const session = await createUploadSession('user_a', { redisClient: redis });

    await expect(
      storeChunk(session.uploadId, 0, Buffer.from('%PDF').toString('base64'), {
        redisClient: redis,
        totalChunks: MAX_TOTAL_CHUNKS + 1,
      })
    ).rejects.toMatchObject({
      code: 'CHUNK_MISMATCH',
    });
  });

  test('duplicate chunk overwrites safely without incrementing receivedChunks twice', async () => {
    const redis = createRedisMock();
    const session = await createUploadSession('user_a', { redisClient: redis });

    const first = await storeChunk(session.uploadId, 0, Buffer.from('bad').toString('base64'), {
      redisClient: redis,
      totalChunks: 1,
    });
    const second = await storeChunk(session.uploadId, 0, Buffer.from('%PDF').toString('base64'), {
      redisClient: redis,
      totalChunks: 1,
    });
    const chunks = await getChunks(session.uploadId, { redisClient: redis });
    const status = await getUploadSessionStatus(session.uploadId, 'user_a', { redisClient: redis });

    expect(first.receivedChunks).toBe(1);
    expect(second.receivedChunks).toBe(1);
    expect(status.receivedIndexes).toEqual([0]);
    expect(status.complete).toBe(true);
    expect(Buffer.concat(chunks).toString()).toBe('%PDF');
  });

  test('rejects reconstruction when the manifest is incomplete', async () => {
    const redis = createRedisMock();
    const session = await createUploadSession('user_a', { redisClient: redis });

    await storeChunk(session.uploadId, 0, Buffer.from('%PDF-1').toString('base64'), {
      redisClient: redis,
      totalChunks: 2,
    });

    await expect(getChunks(session.uploadId, { redisClient: redis })).rejects.toMatchObject({
      code: 'INCOMPLETE_UPLOAD',
    });
  });

  test('finalization lock prevents duplicate reconstruction', async () => {
    const redis = createRedisMock();
    const session = await createUploadSession('user_a', { redisClient: redis });

    await expect(acquireFinalizationLock(session.uploadId, { redisClient: redis })).resolves.toMatchObject({
      locked: true,
    });
    await expect(acquireFinalizationLock(session.uploadId, { redisClient: redis })).rejects.toMatchObject({
      code: 'DUPLICATE_FINALIZATION',
    });
  });

  test('new routes expose upload session, chunk upload, and from-upload analysis', () => {
    const middleware = readFileSync(join(process.cwd(), 'middleware.js'), 'utf8');
    const analyzeRoute = readFileSync(
      join(process.cwd(), 'app/api/analyze/route.js'),
      'utf8'
    );
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
    expect(middleware).toContain('AUTH_EXPIRED');
    expect(analyzeRoute).toContain('AUTH_EXPIRED');
    expect(uploadSessionRoute).toContain('AUTH_EXPIRED');
    expect(uploadSessionRoute).toContain('uploadUrl');
    expect(chunkRoute).toContain('storeChunk');
    expect(chunkRoute).toContain('getUploadSessionStatus');
    expect(chunkRoute).toContain('totalChunks');
    expect(chunkRoute).toContain('AUTH_EXPIRED');
    expect(fromUploadRoute).toContain('getChunks');
    expect(fromUploadRoute).toContain('finalizeUpload');
    expect(fromUploadRoute).toContain('runAnalysisPipeline');
    expect(fromUploadRoute).not.toContain('analyzePost');
    expect(fromUploadRoute).toContain('AUTH_EXPIRED');
    expect(fromUploadRoute).toContain('POST');
    expect(middleware).toContain('pass_bearer_to_route');
    expect(middleware).toContain('[API AUTH DEBUG]');
    expect(analyzeRoute).toContain('isBetaUser');
    expect(analyzeRoute).toContain('quotaBypass');
    expect(analyzeRoute.indexOf('quotaBypass')).toBeLessThan(
      analyzeRoute.indexOf('ANALYSIS_LIMIT_REACHED')
    );
    expect(fromUploadRoute).toContain('isBetaUser');
    expect(fromUploadRoute).toContain('quotaBypass');
  });
});
