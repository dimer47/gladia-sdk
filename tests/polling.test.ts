import { describe, it, expect, vi } from 'vitest';
import { poll, isTerminalStatus } from '../src/utils/polling.js';
import { GladiaTimeoutError } from '../src/errors.js';

describe('isTerminalStatus', () => {
  it('retourne true pour "done"', () => {
    expect(isTerminalStatus('done')).toBe(true);
  });

  it('retourne true pour "error"', () => {
    expect(isTerminalStatus('error')).toBe(true);
  });

  it('retourne false pour "queued"', () => {
    expect(isTerminalStatus('queued')).toBe(false);
  });

  it('retourne false pour "processing"', () => {
    expect(isTerminalStatus('processing')).toBe(false);
  });
});

describe('poll()', () => {
  it('retourne immédiatement si isDone est true au premier appel', async () => {
    const fn = vi.fn().mockResolvedValue({ status: 'done' });

    const result = await poll({
      fn,
      isDone: (r) => r.status === 'done',
      interval: 10,
    });

    expect(fn).toHaveBeenCalledOnce();
    expect(result).toEqual({ status: 'done' });
  });

  it('appelle fn plusieurs fois jusqu\'à isDone', async () => {
    let call = 0;
    const fn = vi.fn().mockImplementation(() => {
      call++;
      return Promise.resolve({ status: call >= 3 ? 'done' : 'processing' });
    });

    const result = await poll({
      fn,
      isDone: (r) => r.status === 'done',
      interval: 10,
    });

    expect(fn).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ status: 'done' });
  });

  it('appelle onPoll à chaque itération', async () => {
    let call = 0;
    const fn = vi.fn().mockImplementation(() => {
      call++;
      return Promise.resolve({ status: call >= 2 ? 'done' : 'processing' });
    });
    const onPoll = vi.fn();

    await poll({
      fn,
      isDone: (r) => r.status === 'done',
      onPoll,
      interval: 10,
    });

    expect(onPoll).toHaveBeenCalledTimes(2);
    expect(onPoll).toHaveBeenCalledWith({ status: 'processing' });
    expect(onPoll).toHaveBeenCalledWith({ status: 'done' });
  });

  it('lance GladiaTimeoutError si timeout dépassé', async () => {
    const fn = vi.fn().mockResolvedValue({ status: 'processing' });

    await expect(
      poll({
        fn,
        isDone: () => false,
        interval: 10,
        timeout: 50,
      }),
    ).rejects.toThrow(GladiaTimeoutError);
  });

  it('lance GladiaTimeoutError si signal déjà aborté', async () => {
    const controller = new AbortController();
    controller.abort();

    const fn = vi.fn().mockResolvedValue({ status: 'processing' });

    await expect(
      poll({
        fn,
        isDone: () => false,
        signal: controller.signal,
        interval: 10,
      }),
    ).rejects.toThrow(GladiaTimeoutError);
  });

  it('lance GladiaTimeoutError si signal aborté pendant le sleep', async () => {
    const controller = new AbortController();
    const fn = vi.fn().mockResolvedValue({ status: 'processing' });

    const promise = poll({
      fn,
      isDone: () => false,
      signal: controller.signal,
      interval: 5000,
    });

    // Abort après un court délai
    setTimeout(() => controller.abort(), 20);

    await expect(promise).rejects.toThrow(GladiaTimeoutError);
  });

  it('applique le backoff exponentiel', async () => {
    const sleepDurations: number[] = [];
    const originalSetTimeout = globalThis.setTimeout;

    // On intercepte les setTimeout pour capturer les durées
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((cb: (...args: unknown[]) => void, ms?: number) => {
      sleepDurations.push(ms ?? 0);
      // Exécuter le callback immédiatement
      cb();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    let call = 0;
    const fn = vi.fn().mockImplementation(() => {
      call++;
      return Promise.resolve({ status: call >= 4 ? 'done' : 'processing' });
    });

    await poll({
      fn,
      isDone: (r) => r.status === 'done',
      interval: 100,
      backoffMultiplier: 2,
      maxInterval: 1000,
    });

    vi.restoreAllMocks();

    // 3 sleeps (avant les appels 2, 3, 4)
    expect(sleepDurations.length).toBe(3);
    expect(sleepDurations[0]).toBe(100);   // 100
    expect(sleepDurations[1]).toBe(200);   // 100 * 2
    expect(sleepDurations[2]).toBe(400);   // 200 * 2
  });

  it('respecte maxInterval', async () => {
    const sleepDurations: number[] = [];

    vi.spyOn(globalThis, 'setTimeout').mockImplementation((cb: (...args: unknown[]) => void, ms?: number) => {
      sleepDurations.push(ms ?? 0);
      cb();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    let call = 0;
    const fn = vi.fn().mockImplementation(() => {
      call++;
      return Promise.resolve({ status: call >= 5 ? 'done' : 'processing' });
    });

    await poll({
      fn,
      isDone: (r) => r.status === 'done',
      interval: 100,
      backoffMultiplier: 10,
      maxInterval: 500,
    });

    vi.restoreAllMocks();

    // interval: 100 → 500 (plafonné) → 500 → 500
    expect(sleepDurations[0]).toBe(100);
    expect(sleepDurations[1]).toBe(500);
    expect(sleepDurations[2]).toBe(500);
    expect(sleepDurations[3]).toBe(500);
  });
});
