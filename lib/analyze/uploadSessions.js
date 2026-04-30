import crypto from 'crypto';
import { getRedis } from '@/lib/redis';

export const UPLOAD_SESSION_TTL_SECONDS = 45 * 60;
export const UPLOAD_FINALIZATION_LOCK_SECONDS = 5 * 60;
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_TOTAL_CHUNKS = 128;
export const MAX_BASE64_CHUNK_CHARS = 512 * 1024;

class UploadSessionError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'UploadSessionError';
    this.code = code;
    this.status = status;
  }
}

function metaKey(uploadId) {
  return `analyze-upload:${uploadId}:meta`;
}

function chunkKey(uploadId, index) {
  return `analyze-upload:${uploadId}:chunk:${index}`;
}

function finalizationLockKey(uploadId) {
  return `analyze-upload:${uploadId}:finalizing`;
}

function parseJson(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

function getClient(redisClient) {
  return redisClient || getRedis();
}

async function readMeta(uploadId, redisClient, now = Date.now()) {
  const redis = getClient(redisClient);
  const meta = parseJson(await redis.get(metaKey(uploadId)));
  if (!meta || typeof meta !== 'object') {
    throw new UploadSessionError(
      'ANALYZE_UPLOAD_NOT_FOUND',
      'Upload session was not found. Please try again.',
      404
    );
  }
  if (typeof meta.expiresAt === 'string' && now > Date.parse(meta.expiresAt)) {
    throw new UploadSessionError(
      'UPLOAD_EXPIRED',
      'Upload session expired. Please try again.',
      410
    );
  }
  return meta;
}

async function writeMeta(uploadId, meta, redisClient) {
  const redis = getClient(redisClient);
  await redis.set(metaKey(uploadId), JSON.stringify(meta), { ex: UPLOAD_SESSION_TTL_SECONDS });
}

export async function createUploadSession(userId, options = {}) {
  if (!userId) {
    throw new UploadSessionError('AUTH_EXPIRED', 'Authentication expired. Please reconnect.', 401);
  }

  const uploadId = crypto.randomUUID();
  const now = typeof options.now === 'number' ? options.now : Date.now();
  const expiresAt = new Date(now + UPLOAD_SESSION_TTL_SECONDS * 1000).toISOString();
  const meta = {
    uploadId,
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt,
    filename: typeof options.filename === 'string' && options.filename.trim()
      ? options.filename.trim()
      : 'report.pdf',
    fileSize: Number.isFinite(options.fileSize) ? options.fileSize : null,
    totalChunks: null,
    chunks: [],
  };
  if (meta.fileSize !== null && meta.fileSize > MAX_UPLOAD_BYTES) {
    throw new UploadSessionError('FILE_TOO_LARGE', 'File must be under 15MB', 413);
  }

  await writeMeta(uploadId, meta, options.redisClient);
  return { uploadId, expiresAt };
}

export async function validateOwnership(uploadId, userId, options = {}) {
  const meta = await readMeta(uploadId, options.redisClient, options.now);
  if (meta.userId !== userId) {
    throw new UploadSessionError(
      'ANALYZE_UPLOAD_NOT_FOUND',
      'Upload session was not found. Please try again.',
      404
    );
  }
  return meta;
}

export async function storeChunk(uploadId, index, base64Chunk, options = {}) {
  if (!Number.isInteger(index) || index < 0) {
    throw new UploadSessionError('CHUNK_MISMATCH', 'Invalid upload chunk index', 400);
  }
  if (typeof base64Chunk !== 'string' || !base64Chunk.trim()) {
    throw new UploadSessionError('CHUNK_MISMATCH', 'Invalid upload chunk', 400);
  }

  const meta = await readMeta(uploadId, options.redisClient, options.now);
  const totalChunks = Number.isInteger(options.totalChunks) && options.totalChunks > 0
    ? options.totalChunks
    : meta.totalChunks;

  if (!Number.isInteger(totalChunks) || index >= totalChunks) {
    throw new UploadSessionError('CHUNK_MISMATCH', 'Invalid upload chunk count', 400);
  }
  if (totalChunks > MAX_TOTAL_CHUNKS) {
    throw new UploadSessionError('CHUNK_MISMATCH', 'Upload has too many chunks', 400);
  }
  if (base64Chunk.length > MAX_BASE64_CHUNK_CHARS) {
    throw new UploadSessionError('FILE_TOO_LARGE', 'Upload chunk is too large', 413);
  }
  if (Number.isInteger(meta.totalChunks) && meta.totalChunks !== totalChunks) {
    throw new UploadSessionError('CHUNK_MISMATCH', 'Upload chunk count changed mid-upload', 400);
  }

  const redis = getClient(options.redisClient);
  await redis.set(chunkKey(uploadId, index), base64Chunk, { ex: UPLOAD_SESSION_TTL_SECONDS });

  const nextChunks = await getReceivedChunkIndexes(redis, uploadId, totalChunks);
  await writeMeta(uploadId, { ...meta, totalChunks, chunks: nextChunks }, options.redisClient);

  return { uploadId, index, totalChunks, receivedChunks: nextChunks.length };
}

async function getReceivedChunkIndexes(redis, uploadId, totalChunks) {
  const received = [];
  for (let index = 0; index < totalChunks; index += 1) {
    const base64Chunk = await redis.get(chunkKey(uploadId, index));
    if (typeof base64Chunk === 'string' && base64Chunk) {
      received.push(index);
    }
  }
  return received;
}

export async function acquireFinalizationLock(uploadId, options = {}) {
  const redis = getClient(options.redisClient);
  const result = await redis.set(
    finalizationLockKey(uploadId),
    String(Date.now()),
    { nx: true, ex: UPLOAD_FINALIZATION_LOCK_SECONDS }
  );
  if (result !== 'OK' && result !== true) {
    throw new UploadSessionError(
      'DUPLICATE_FINALIZATION',
      'Upload is already being finalized. Please wait.',
      409
    );
  }
  return { uploadId, locked: true };
}

export async function getUploadSessionStatus(uploadId, userId, options = {}) {
  const meta = await validateOwnership(uploadId, userId, options);
  const totalChunks = Number.isInteger(meta.totalChunks) && meta.totalChunks > 0
    ? meta.totalChunks
    : null;
  const redis = getClient(options.redisClient);
  const receivedIndexes = totalChunks
    ? await getReceivedChunkIndexes(redis, uploadId, totalChunks)
    : [];
  return {
    uploadId,
    totalChunks,
    receivedIndexes,
    receivedChunks: receivedIndexes.length,
    expiresAt: meta.expiresAt,
    complete: totalChunks !== null && receivedIndexes.length === totalChunks,
  };
}

export async function getChunks(uploadId, options = {}) {
  const meta = await readMeta(uploadId, options.redisClient, options.now);
  const totalChunks = meta.totalChunks;
  if (!Number.isInteger(totalChunks) || totalChunks <= 0) {
    throw new UploadSessionError('INCOMPLETE_UPLOAD', 'Upload is incomplete. Please try again.', 409);
  }
  const redis = getClient(options.redisClient);
  const received = await getReceivedChunkIndexes(redis, uploadId, totalChunks);
  const expected = Array.from({ length: totalChunks }, (_value, index) => index);
  if (
    received.length !== totalChunks ||
    expected.some((index) => received[index] !== index)
  ) {
    throw new UploadSessionError('INCOMPLETE_UPLOAD', 'Upload is incomplete. Please try again.', 409);
  }

  const chunks = [];
  let byteSize = 0;
  for (let index = 0; index < totalChunks; index += 1) {
    const base64Chunk = await redis.get(chunkKey(uploadId, index));
    if (typeof base64Chunk !== 'string' || !base64Chunk) {
      throw new UploadSessionError('INCOMPLETE_UPLOAD', 'Upload is incomplete. Please try again.', 409);
    }
    const chunk = Buffer.from(base64Chunk, 'base64');
    byteSize += chunk.length;
    if (byteSize > MAX_UPLOAD_BYTES) {
      throw new UploadSessionError('FILE_TOO_LARGE', 'File must be under 15MB', 413);
    }
    chunks.push(chunk);
  }
  return chunks;
}

export async function finalizeUpload(uploadId, options = {}) {
  const redis = getClient(options.redisClient);
  const meta = parseJson(await redis.get(metaKey(uploadId)));
  const keys = [metaKey(uploadId), finalizationLockKey(uploadId)];
  const totalChunks = meta && Number.isInteger(meta.totalChunks) ? meta.totalChunks : 0;
  for (let index = 0; index < totalChunks; index += 1) {
    keys.push(chunkKey(uploadId, index));
  }
  if (typeof redis.del === 'function') {
    await redis.del(...keys);
  }
  return { uploadId, deletedKeys: keys.length };
}

export { UploadSessionError };
