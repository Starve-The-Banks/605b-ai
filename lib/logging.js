const REDACT_KEYS = [
  'ssn',
  'dob',
  'dateOfBirth',
  'account',
  'accountNumber',
  'routingNumber',
  'token',
  'intakeToken',
  'email',
  'phone',
  'address',
  'password'
];

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function redactValue(value) {
  if (typeof value === 'string') {
    if (value.length > 4) {
      return '[REDACTED]';
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(item => redactValue(item));
  }
  if (isPlainObject(value)) {
    return redactObject(value);
  }
  return value;
}

function redactObject(obj) {
  const output = {};
  for (const [key, value] of Object.entries(obj || {})) {
    const lowerKey = key.toLowerCase();
    if (REDACT_KEYS.some(redactedKey => lowerKey.includes(redactedKey))) {
      output[key] = '[REDACTED]';
      continue;
    }
    output[key] = redactValue(value);
  }
  return output;
}

export function sanitizeError(error) {
  if (!error) return undefined;
  return {
    name: error.name,
    message: typeof error.message === 'string' ? '[REDACTED]' : 'error',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  };
}

export function logError(message, error, context = {}) {
  const safeContext = redactObject(context);
  const safeError = sanitizeError(error);
  console.error(message, { ...safeContext, error: safeError });
}
