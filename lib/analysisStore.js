import crypto from 'crypto';

export const ANALYSIS_SCHEMA_VERSION = 1;
const MAX_HISTORY = 10;

export class AnalysisStoreError extends Error {
  constructor(code, message, status = 500) {
    super(message);
    this.name = 'AnalysisStoreError';
    this.code = code;
    this.status = status;
  }
}

function analysisKey(id) {
  return `analysis:${id}`;
}

function userAnalysesKey(userId) {
  return `user:${userId}:analyses`;
}

function userLatestKey(userId) {
  return `user:${userId}:analysis:latest`;
}

function parseRedisJson(raw, fallback = null) {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  return raw;
}

function normalizeDate(value) {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return value;
  return new Date().toISOString();
}

function normalizeString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeRecord(record) {
  const id = normalizeString(record.id, crypto.randomUUID());
  const userId = normalizeString(record.userId);
  if (!userId) {
    throw new AnalysisStoreError('INVALID_RECORD', 'Analysis record requires userId', 400);
  }

  return {
    id,
    userId,
    reportType: normalizeString(record.reportType, 'unknown_consumer_report'),
    filename: normalizeString(record.filename, 'report.pdf'),
    createdAt: normalizeDate(record.createdAt),
    summary: record.summary && typeof record.summary === 'object' ? record.summary : {},
    findings: normalizeArray(record.findings),
    reviewOnly: normalizeArray(record.reviewOnly),
    cleanReport: Boolean(record.cleanReport),
    confidence: typeof record.confidence === 'number' && Number.isFinite(record.confidence)
      ? Math.max(0, Math.min(1, record.confidence))
      : null,
    rawTextHash: normalizeString(record.rawTextHash),
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    deletedAt: record.deletedAt ?? null,
  };
}

function sortByCreatedAtDesc(a, b) {
  return Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0);
}

async function getUserAnalysisIds(redisClient, userId) {
  return normalizeArray(parseRedisJson(await redisClient.get(userAnalysesKey(userId)), []))
    .filter((id) => typeof id === 'string' && id.trim());
}

async function setUserAnalysisIds(redisClient, userId, ids) {
  const unique = [...new Set(ids)].slice(0, MAX_HISTORY);
  await redisClient.set(userAnalysesKey(userId), JSON.stringify(unique));
  return unique;
}

async function readAnalysis(redisClient, id) {
  const raw = await redisClient.get(analysisKey(id));
  return parseRedisJson(raw);
}

async function writeAnalysis(redisClient, record) {
  await redisClient.set(analysisKey(record.id), JSON.stringify(record));
}

async function refreshUserIndexes(redisClient, userId) {
  const ids = await getUserAnalysisIds(redisClient, userId);
  const records = [];
  for (const id of ids) {
    const record = await readAnalysis(redisClient, id);
    if (record?.userId === userId && !record.deletedAt) {
      records.push(record);
    }
  }

  records.sort(sortByCreatedAtDesc);
  const capped = records.slice(0, MAX_HISTORY);
  await setUserAnalysisIds(redisClient, userId, capped.map((record) => record.id));

  if (capped[0]) {
    await redisClient.set(userLatestKey(userId), capped[0].id);
  } else {
    await redisClient.set(userLatestKey(userId), '');
  }

  return capped;
}

export function hashRawText(rawText) {
  return crypto
    .createHash('sha256')
    .update(typeof rawText === 'string' ? rawText : '')
    .digest('hex');
}

export async function saveAnalysisRecord(redisClient, record) {
  const normalized = normalizeRecord(record);
  await writeAnalysis(redisClient, normalized);

  const ids = await getUserAnalysisIds(redisClient, normalized.userId);
  await setUserAnalysisIds(redisClient, normalized.userId, [normalized.id, ...ids.filter((id) => id !== normalized.id)]);
  await refreshUserIndexes(redisClient, normalized.userId);

  return normalized;
}

export async function getAnalysisById(redisClient, id, userId, options = {}) {
  const record = await readAnalysis(redisClient, id);
  if (!record) {
    throw new AnalysisStoreError('NOT_FOUND', 'Analysis not found', 404);
  }
  if (record.userId !== userId) {
    throw new AnalysisStoreError('FORBIDDEN', 'Analysis does not belong to this user', 403);
  }
  if (record.deletedAt && !options.includeDeleted) {
    throw new AnalysisStoreError('NOT_FOUND', 'Analysis not found', 404);
  }
  return record;
}

export async function getLatestAnalysis(redisClient, userId) {
  const latestId = normalizeString(await redisClient.get(userLatestKey(userId)));
  if (latestId) {
    const latest = await readAnalysis(redisClient, latestId);
    if (latest?.userId === userId && !latest.deletedAt) return latest;
  }

  const [latest] = await refreshUserIndexes(redisClient, userId);
  return latest ?? null;
}

export async function listRecentAnalyses(redisClient, userId, limit = MAX_HISTORY) {
  const records = await refreshUserIndexes(redisClient, userId);
  return records.slice(0, Math.min(limit, MAX_HISTORY));
}

export async function softDeleteAnalysis(redisClient, id, userId) {
  const record = await getAnalysisById(redisClient, id, userId);
  const deleted = { ...record, deletedAt: new Date().toISOString() };
  await writeAnalysis(redisClient, deleted);
  await refreshUserIndexes(redisClient, userId);
  return deleted;
}

export function analysisRecordToResponse(record) {
  if (!record) return null;
  return {
    id: record.id,
    analysisId: record.id,
    userId: record.userId,
    reportType: record.reportType,
    filename: record.filename,
    createdAt: record.createdAt,
    timestamp: Date.parse(record.createdAt),
    summary: record.summary,
    findings: record.findings,
    reviewOnly: record.reviewOnly,
    cleanReport: record.cleanReport,
    confidence: record.confidence,
    rawTextHash: record.rawTextHash,
    schemaVersion: record.schemaVersion,
    deletedAt: record.deletedAt,
    analysis: {
      reportType: record.reportType,
      cleanReport: record.cleanReport,
      confidence: record.confidence,
      summary: record.summary,
      findings: record.findings,
      reviewOnly: record.reviewOnly,
      positiveFactors: [],
      crossBureauInconsistencies: [],
      personalInfo: {},
    },
    filesProcessed: [{ name: record.filename, pages: 0 }],
  };
}
