import { readFileSync } from 'fs';
import { join } from 'path';

import {
  getAnalysisById,
  getLatestAnalysis,
  listRecentAnalyses,
  saveAnalysisRecord,
  softDeleteAnalysis,
} from '../lib/analysisStore.js';

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
  };
}

function sampleRecord(overrides = {}) {
  return {
    userId: 'user_a',
    reportType: 'credit_bureau',
    filename: 'report.pdf',
    summary: { reportStatus: 'clean', potentialIssues: 0, highPriorityItems: 0 },
    findings: [],
    reviewOnly: [],
    cleanReport: true,
    confidence: 1,
    rawTextHash: 'abc123',
    ...overrides,
  };
}

describe('analysis Redis store', () => {
  test('/api/analyze saves validated analysis and returns analysisId', () => {
    const routeCode = readFileSync(join(process.cwd(), 'app/api/analyze/route.js'), 'utf8');

    expect(routeCode).toContain('saveAnalysisRecord');
    expect(routeCode).toContain('hashRawText(extractedText)');
    expect(routeCode).toContain('analysisId: savedAnalysis?.id');
  });

  test('saves an analysis and returns it as latest for the owner', async () => {
    const redis = createRedisMock();

    const saved = await saveAnalysisRecord(redis, sampleRecord({ id: 'analysis_1' }));
    const latest = await getLatestAnalysis(redis, 'user_a');

    expect(saved.id).toBe('analysis_1');
    expect(saved.schemaVersion).toBe(2);
    expect(saved.deletedAt).toBeNull();
    expect(latest.id).toBe('analysis_1');
    expect(latest.userId).toBe('user_a');
  });

  test('latest returns newest owned analysis', async () => {
    const redis = createRedisMock();

    await saveAnalysisRecord(redis, sampleRecord({
      id: 'older',
      createdAt: '2026-04-27T01:00:00.000Z',
    }));
    await saveAnalysisRecord(redis, sampleRecord({
      id: 'newer',
      createdAt: '2026-04-27T02:00:00.000Z',
    }));

    const latest = await getLatestAnalysis(redis, 'user_a');
    expect(latest.id).toBe('newer');
  });

  test('history is capped at 10 recent non-deleted analyses', async () => {
    const redis = createRedisMock();

    for (let i = 0; i < 12; i += 1) {
      await saveAnalysisRecord(redis, sampleRecord({
        id: `analysis_${i}`,
        createdAt: `2026-04-27T02:${String(i).padStart(2, '0')}:00.000Z`,
      }));
    }

    const history = await listRecentAnalyses(redis, 'user_a');
    expect(history).toHaveLength(10);
    expect(history[0].id).toBe('analysis_11');
    expect(history[9].id).toBe('analysis_2');
  });

  test('cross-user access is denied', async () => {
    const redis = createRedisMock();

    await saveAnalysisRecord(redis, sampleRecord({ id: 'analysis_1', userId: 'user_a' }));

    await expect(getAnalysisById(redis, 'analysis_1', 'user_b')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  test('delete soft-deletes only owned record and removes it from latest/history', async () => {
    const redis = createRedisMock();

    await saveAnalysisRecord(redis, sampleRecord({
      id: 'older',
      createdAt: '2026-04-27T01:00:00.000Z',
    }));
    await saveAnalysisRecord(redis, sampleRecord({
      id: 'newer',
      createdAt: '2026-04-27T02:00:00.000Z',
    }));

    await softDeleteAnalysis(redis, 'newer', 'user_a');

    const deleted = await getAnalysisById(redis, 'newer', 'user_a', { includeDeleted: true });
    const latest = await getLatestAnalysis(redis, 'user_a');
    const history = await listRecentAnalyses(redis, 'user_a');

    expect(deleted.deletedAt).toEqual(expect.any(String));
    expect(latest.id).toBe('older');
    expect(history.map((item) => item.id)).toEqual(['older']);
  });
});
