import crypto from 'crypto';

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'apexstores';

function signToken(token: string) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(token).digest('hex');
}

export function createSessionCookie() {
  const token = crypto.randomUUID();
  return `${signToken(token)}.${token}`;
}

export function verifySessionCookie(value?: string) {
  if (!value) {
    return false;
  }

  const [signature, token] = value.split('.');

  if (!signature || !token) {
    return false;
  }

  const expectedSignature = signToken(token);

  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
