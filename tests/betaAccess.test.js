import { isBetaUser, isReviewerRequest } from '../lib/beta.js';

describe('beta/internal access checks', () => {
  const originalEmails = process.env.BETA_WHITELIST_EMAILS;
  const originalUserIds = process.env.BETA_WHITELIST_USER_IDS;

  afterEach(() => {
    process.env.BETA_WHITELIST_EMAILS = originalEmails;
    process.env.BETA_WHITELIST_USER_IDS = originalUserIds;
  });

  test('configured whitelist email bypasses analysis quota checks', () => {
    process.env.BETA_WHITELIST_EMAILS = 'internal@example.com';
    process.env.BETA_WHITELIST_USER_IDS = '';

    expect(isBetaUser({ emails: ['internal@example.com'], userId: 'user_regular' })).toBe(true);
  });

  test('configured whitelist user id bypasses analysis quota checks', () => {
    process.env.BETA_WHITELIST_EMAILS = '';
    process.env.BETA_WHITELIST_USER_IDS = 'user_internal';

    expect(isBetaUser({ emails: [], userId: 'user_internal' })).toBe(true);
  });

  test('normal free user is not whitelisted', () => {
    process.env.BETA_WHITELIST_EMAILS = 'internal@example.com';
    process.env.BETA_WHITELIST_USER_IDS = 'user_internal';

    expect(isBetaUser({ emails: ['free@example.com'], userId: 'user_free' })).toBe(false);
  });

  test('reviewer account remains separate from beta whitelist', () => {
    process.env.BETA_WHITELIST_EMAILS = '';
    process.env.BETA_WHITELIST_USER_IDS = '';

    expect(isReviewerRequest({ emails: ['reviewer@605b.ai'] })).toBe(true);
    expect(isBetaUser({ emails: ['reviewer@605b.ai'], userId: 'user_reviewer' })).toBe(false);
  });
});
