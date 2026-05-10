interface RetryOptions {
    maxRetries: number;
    initialDelay: number;
}
export declare const exponentialBackoff: <T>(fn: () => Promise<T>, options: RetryOptions) => Promise<T>;
export {};
//# sourceMappingURL=retry.d.ts.map