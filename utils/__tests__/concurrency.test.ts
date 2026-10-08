import { describe, it, expect } from 'vitest';
import { runWithConcurrency } from '../concurrency';

const tick = () => new Promise((resolve) => setTimeout(resolve, 1));

describe('runWithConcurrency', () => {
  it('processes every item exactly once', async () => {
    const seen: number[] = [];
    await runWithConcurrency([1, 2, 3, 4, 5], 2, async (n) => {
      await tick();
      seen.push(n);
    });
    expect(seen.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('never runs more than `limit` at once', async () => {
    let running = 0;
    let peak = 0;
    await runWithConcurrency(
      Array.from({ length: 10 }, (_, i) => i),
      3,
      async () => {
        running++;
        peak = Math.max(peak, running);
        await tick();
        running--;
      }
    );
    expect(peak).toBe(3);
  });

  it('stops starting new items once shouldStop() is true', async () => {
    const started: number[] = [];
    let stop = false;
    await runWithConcurrency(
      [1, 2, 3, 4, 5, 6],
      1,
      async (n) => {
        started.push(n);
        if (n === 2) stop = true;
      },
      () => stop
    );
    expect(started).toEqual([1, 2]);
  });

  it('handles an empty list', async () => {
    await expect(runWithConcurrency([], 3, async () => {})).resolves.toBeUndefined();
  });

  it('rejects if a worker throws, after the others settle', async () => {
    const done: number[] = [];
    await expect(
      runWithConcurrency([1, 2, 3], 3, async (n) => {
        await tick();
        if (n === 2) throw new Error('boom');
        done.push(n);
      })
    ).rejects.toThrow('boom');
    expect(done.sort()).toEqual([1, 3]);
  });
});
