/**
 * APEX OS: Resilience & Timeout Protocols
 */

/**
 * Executes a promise with a guaranteed timeout.
 * Prevents build-time hangs and runtime stalling.
 */
export async function withTimeout<T>(
    promise: Promise<T> | PromiseLike<T>,
    timeoutMs: number = 15000, // Increased to 15s for high-latency nodes
    context: string = 'Operation'
): Promise<T> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
            reject(new Error(`APEX_STALL_DETECTED: ${context} exceeded safety limit of ${timeoutMs}ms.`));
        }, timeoutMs);
    });

    // Ensure we are racing a true Promise
    const actualPromise = Promise.resolve(promise);

    try {
        const result = await Promise.race([actualPromise, timeoutPromise]);
        if (timeoutHandle) clearTimeout(timeoutHandle);
        return result;
    } catch (error) {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        throw error;
    }
}
