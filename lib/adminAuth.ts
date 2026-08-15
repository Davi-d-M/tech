const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'apexstores';

/**
 * Portable signing function using Web Crypto API (Edge Runtime Compatible)
 */
async function signToken(token: string) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SESSION_SECRET);
  const data = encoder.encode(token);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, data);

  // Convert signature to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Creates a session cookie with role and granular permissions
 */
export async function createSessionCookie(role: string = 'owner', permissions: Record<string, boolean | string[]> = {}) {
  const token = crypto.randomUUID();
  const payload = JSON.stringify({ role, permissions });

  // Use Base64 encoding that is portable
  const base64Payload = btoa(payload);

  const signature = await signToken(`${token}.${base64Payload}`);
  return `${signature}.${token}.${base64Payload}`;
}

/**
 * Verifies the cookie and returns the role and permissions if valid
 */
export async function verifySessionCookie(value?: string): Promise<{ role: string; permissions: Record<string, boolean | string[]> } | null> {
  if (!value) return null;

  try {
    const [signature, token, base64Payload] = value.split('.');
    if (!signature || !token || !base64Payload) return null;

    const expectedSignature = await signToken(`${token}.${base64Payload}`);

    // Standard equality check is fine here
    const isSignatureValid = (signature === expectedSignature);

    if (!isSignatureValid) return null;

    const payload = JSON.parse(atob(base64Payload));
    return payload;
  } catch (err) {
    console.error("Auth Verification Error:", err);
    return null;
  }
}
