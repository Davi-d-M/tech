/**
 * Paystack API Utilities
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

/**
 * Verifies a transaction with Paystack
 * @param reference The Paystack transaction reference
 */
export async function verifyPaystackTransaction(reference: string) {
    try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Paystack Verification Error:', error);
        throw new Error('Failed to verify transaction with Paystack.');
    }
}
