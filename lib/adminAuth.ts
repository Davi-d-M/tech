import crypto from 'crypto';

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'apexstores';

function signToken(token: string) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(token).digest('hex');
}

/**
 * Creates a session cookie with role and granular permissions
 */
export function createSessionCookie(role: string = 'owner', permissions: Record<string, boolean | string[]> = {}) {
  const token = crypto.randomUUID();
  // We stringify the payload to include role and permissions
  const payload = JSON.stringify({ role, permissions });
  const base64Payload = Buffer.from(payload).toString('base64');

  const signature = signToken(`${token}.${base64Payload}`);
  return `${signature}.${token}.${base64Payload}`;
}

/**
 * Verifies the cookie and returns the role and permissions if valid
 */
export function verifySessionCookie(value?: string): { role: string; permissions: Record<string, boolean | string[]> } | null {
  if (!value) {
    return null;
  }

  const [signature, token, base64Payload] = value.split('.');

  if (!signature || !token || !base64Payload) {
    return null;
  }

  const expectedSignature = signToken(`${token}.${base64Payload}`);

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  try {
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isSignatureValid) return null;

    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
    return payload;
  } catch {
    return null;
  }
}
