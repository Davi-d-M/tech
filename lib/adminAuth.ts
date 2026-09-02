const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'apexstores';

/**
 * Universal Base64 Encoder (Safe for Unicode and Edge Runtime)
 */
function toBase64(str: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let binary = "";
    const bytes = new Uint8Array(data);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Universal Base64 Decoder (Safe for Unicode and Edge Runtime)
 */
function fromBase64(str: string): string {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
}

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
 * Creates a session cookie with role, granular permissions, and optional supplier ID
 */
export async function createSessionCookie(
    email: string,
    role: string = 'owner',
    permissions: Record<string, boolean | string[]> = {},
    tenant_id: string | null = null,
    supplier_id: string | null = null,
    userId: string | null = null
) {
  const token = crypto.randomUUID();
  const payload = JSON.stringify({ email, role, permissions, tenant_id, supplier_id, userId });

  const base64Payload = toBase64(payload);

  const signature = await signToken(`${token}.${base64Payload}`);
  return `${signature}.${token}.${base64Payload}`;
}

/**
 * Verifies the cookie and returns the role, permissions, and supplier ID if valid
 */
export async function verifySessionCookie(value?: string): Promise<{
    email: string;
    role: string;
    permissions: Record<string, boolean | string[]>;
    tenant_id: string | null;
    supplier_id?: string | null;
    userId?: string | null;
} | null> {
  if (!value) return null;

  try {
    const parts = value.split('.');
    if (parts.length !== 3) return null;

    const [signature, token, base64Payload] = parts;

    const expectedSignature = await signToken(`${token}.${base64Payload}`);

    // Standard equality check
    const isSignatureValid = (signature === expectedSignature);

    if (!isSignatureValid) {
      return null;
    }

    const payload = JSON.parse(fromBase64(base64Payload));
    return payload;
  } catch (err) {
    console.error("Auth Verification Error:", err);
    return null;
  }
}
