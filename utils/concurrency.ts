/**
 * Runs `worker` over `items` with at most `limit` running at once, in order of
 * start. Stops picking up new items as soon as `shouldStop()` returns true
 * (items already running are allowed to finish).
 *
 * `worker` should handle its own errors; an uncaught error rejects the returned
 * promise once all running workers have settled.
 */
export const runWithConcurrency = async <T>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
  shouldStop: () => boolean = () => false
): Promise<void> => {
  let next = 0;
  const runner = async (): Promise<void> => {
    while (next < items.length && !shouldStop()) {
      const index = next++;
      await worker(items[index] as T, index);
    }
  };
  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, runner);
  const results = await Promise.allSettled(runners);
  const failure = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failure) throw failure.reason;
};
