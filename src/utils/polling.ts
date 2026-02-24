import { GladiaTimeoutError } from '../errors.js';
import type { JobStatus } from '../types/common.js';

export interface PollOptions<T> {
  fn: () => Promise<T>;
  isDone: (result: T) => boolean;
  onPoll?: (result: T) => void;
  /** Initial interval in ms (default: 1000) */
  interval?: number;
  /** Multiplier for exponential backoff (default: 1.5) */
  backoffMultiplier?: number;
  /** Maximum interval in ms (default: 10000) */
  maxInterval?: number;
  /** Maximum total time in ms (default: none) */
  timeout?: number;
  signal?: AbortSignal;
}

export async function poll<T>(options: PollOptions<T>): Promise<T> {
  const {
    fn,
    isDone,
    onPoll,
    interval = 1000,
    backoffMultiplier = 1.5,
    maxInterval = 10_000,
    timeout,
    signal,
  } = options;

  const start = Date.now();
  let currentInterval = interval;

  while (true) {
    if (signal?.aborted) {
      throw new GladiaTimeoutError('Polling aborted');
    }

    const result = await fn();
    onPoll?.(result);

    if (isDone(result)) {
      return result;
    }

    if (timeout && Date.now() - start >= timeout) {
      throw new GladiaTimeoutError(`Polling timed out after ${timeout}ms`);
    }

    await sleep(currentInterval, signal);
    currentInterval = Math.min(currentInterval * backoffMultiplier, maxInterval);
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new GladiaTimeoutError('Polling aborted'));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new GladiaTimeoutError('Polling aborted'));
      },
      { once: true },
    );
  });
}

export function isTerminalStatus(status: JobStatus): boolean {
  return status === 'done' || status === 'error';
}
