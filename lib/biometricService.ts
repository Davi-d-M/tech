/**
 * TechPax Biometric Security Service
 * Implements WebAuthn (Passkeys) for secure, pin-less rider login.
 */

export async function registerBiometrics(riderPhone: string) {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        console.warn("Biometrics not supported on this device.");
        return null;
    }

    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const createCredentialOptions: CredentialCreationOptions = {
            publicKey: {
                challenge,
                rp: {
                    name: "TechPax Logistics",
                    id: window.location.hostname === 'localhost' ? undefined : window.location.hostname
                },
                user: {
                    id: crypto.getRandomValues(new Uint8Array(16)), // Use random ID for security
                    name: riderPhone,
                    displayName: `Rider ${riderPhone}`
                },
                pubKeyCredParams: [
                    { alg: -7, type: "public-key" }, // ES256
                    { alg: -257, type: "public-key" } // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "preferred"
                },
                timeout: 60000,
                attestation: "none"
            }
        };

        const credential = await navigator.credentials.create(createCredentialOptions) as PublicKeyCredential;
        if (!credential) return null;

        // In a real app, you'd send this to the server to verify and store
        return {
            id: credential.id,
            rawId: Buffer.from(credential.rawId).toString('base64'),
            type: credential.type
        };
    } catch (err) {
        console.error("Biometric registration failed:", err);
        return null;
    }
}

export async function authenticateBiometrics() {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) return null;

    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const getCredentialOptions: CredentialRequestOptions = {
            publicKey: {
                challenge,
                timeout: 60000,
                userVerification: "required",
            }
        };

        const assertion = await navigator.credentials.get(getCredentialOptions);
        return assertion;
    } catch (err) {
        console.error("Biometric authentication failed:", err);
        return null;
    }
}
