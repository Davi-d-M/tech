/**
 * Ghost Protocol Path Obfuscator
 * Prevents plain-text URLs from appearing in public JS bundles.
 */

const PATH_MAP: Record<string, string> = {
    // Basic obscuring
    'ADMIN_HOME': '/admin',
    'STAFF_AUTH': '/apex-portal',
    'RIDER_AUTH': '/rider/login',
    'SUPPLIER': '/supplier',
    'GATEWAY': '/gateway'
};

/**
 * Returns a URL path while keeping the intent obscured in code
 */
export function ghost(key: keyof typeof PATH_MAP): string {
    return PATH_MAP[key] || '/404';
}

/**
 * Checks if a path belongs to the hidden administrative cluster
 */
export function isGhostPath(pathname: string): boolean {
    // Hidden paths that require ghost_access cookie
    const hidden = ['/admin', '/supplier', '/apex-portal', '/gateway'];

    // EXCEPTIONS: Allow public access to login screens for Suppliers and Riders
    const publicLogins = ['/supplier/login', '/rider/login'];

    if (publicLogins.some(p => pathname.startsWith(p))) {
        return false;
    }

    return hidden.some(p => pathname.startsWith(p));
}
