/**
 * APEX OS: Resilience & Timeout Protocols
 */

/**
 * Executes a promise with a guaranteed timeout.
 * Prevents build-time hangs and runtime stalling.
 */
export async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number = 10000): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
            reject(new Error('APEX_STALL_DETECTED: Operation exceeded safety limit.'));
        }, timeoutMs);
    });

    try {
        const result = await Promise.race([Promise.resolve(promise), timeoutPromise]);
        clearTimeout(timeoutHandle!);
        return result;
    } catch (error) {
        if (timeoutHandle!) clearTimeout(timeoutHandle);
        throw error;
    }
}
