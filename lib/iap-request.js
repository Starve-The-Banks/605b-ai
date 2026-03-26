export function getValidateBodyError(body) {
  if (!body || typeof body !== 'object') return 'missing required fields';

  const { platform, receiptData, productId, transactionId } = body;
  if (!platform || !receiptData || !productId || !transactionId) {
    return 'missing required fields';
  }

  if (platform !== 'ios' && platform !== 'android') {
    return 'missing required fields';
  }

  return null;
}

export function getRestoreBodyError(body) {
  if (!body || typeof body !== 'object') return 'missing required fields';

  const { platform, receipts } = body;
  if (!platform || !Array.isArray(receipts)) {
    return 'missing required fields';
  }

  if (platform !== 'ios' && platform !== 'android') {
    return 'missing required fields';
  }

  return null;
}
