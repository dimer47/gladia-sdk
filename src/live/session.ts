import { GladiaWebSocketError } from '../errors.js';
import type { WebSocketRetryConfig } from '../types/common.js';
import type {
  LiveEventMap,
  LiveEventName,
  LiveBaseMessage,
  LiveSessionStatus,
  LiveTranscriptMessage,
} from './events.js';

type Listener<T> = (data: T) => void;
type AudioData = ArrayBuffer | Uint8Array | Blob;
type PendingAudio = { kind: 'binary'; data: AudioData } | { kind: 'base64'; data: Uint8Array };
const defaultDelay = (attempt: number) => Math.min(300 * 2 ** (attempt - 1), 2_000);

export interface LiveSessionOptions {
  retry?: Partial<WebSocketRetryConfig>;
  signal?: AbortSignal;
  emitAcknowledgments?: boolean;
  sessionId?: string;
}

export class LiveSession {
  private ws?: WebSocket;
  private listeners = new Map<string, Set<Listener<unknown>>>();
  private readonly pendingAudio: PendingAudio[] = [];
  private acknowledgedBytes = 0;
  private readonly retry: WebSocketRetryConfig;
  private readonly signal?: AbortSignal;
  private readonly emitAcknowledgments: boolean;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private connectionTimer?: ReturnType<typeof setTimeout>;
  private readonly abortHandler = () => this.abort();
  private _status: LiveSessionStatus = 'starting';
  private attempts = 0;
  private doneResolve?: () => void;
  private readonly donePromise: Promise<void>;

  constructor(
    private readonly url: string,
    private readonly WebSocketCtor?: unknown,
    retry: Partial<WebSocketRetryConfig> = {},
    options: Omit<LiveSessionOptions, 'retry'> = {},
  ) {
    this.retry = {
      maxAttempts: retry.maxAttempts ?? 5,
      delay: retry.delay ?? defaultDelay,
      closeCodes: retry.closeCodes ?? [
        [1002, 4399],
        [4500, 9999],
      ],
      timeout: retry.timeout ?? 10_000,
    };
    this.signal = options.signal;
    this.emitAcknowledgments = options.emitAcknowledgments ?? true;
    this.sessionId = options.sessionId;
    this.donePromise = new Promise((resolve) => {
      this.doneResolve = resolve;
    });
    if (this.signal?.aborted) {
      this.finish(1001, 'Aborted');
      return;
    }
    this.signal?.addEventListener('abort', this.abortHandler, { once: true });
    this.connect();
  }

  readonly sessionId?: string;

  on<K extends LiveEventName>(event: K, listener: Listener<LiveEventMap[K]>): this {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener as Listener<unknown>);
    return this;
  }
  once<K extends LiveEventName>(event: K, listener: Listener<LiveEventMap[K]>): this {
    const wrapper: Listener<LiveEventMap[K]> = (data) => {
      this.off(event, wrapper);
      listener(data);
    };
    return this.on(event, wrapper);
  }
  off<K extends LiveEventName>(event: K, listener?: Listener<LiveEventMap[K]>): this {
    if (listener) this.listeners.get(event)?.delete(listener as Listener<unknown>);
    else this.listeners.delete(event);
    return this;
  }

  sendAudio(data: AudioData): void {
    this.assertCanSendAudio();
    this.pendingAudio.push({ kind: 'binary', data });
    if (this.ws?.readyState === 1) this.ws.send(data);
  }
  sendAudioBase64(chunk: string): void {
    this.assertCanSendAudio();
    const data = decodeBase64(chunk);
    this.pendingAudio.push({ kind: 'base64', data });
    if (this.ws?.readyState === 1) this.sendPendingAudio(this.ws, this.pendingAudio.at(-1)!);
  }
  async stop(): Promise<void> {
    if (this._status === 'ended') return;
    if (this._status !== 'ending') this.transitionToEnding(1000, 'Recording stopped by user');
    if (this.ws?.readyState === 1) this.ws.send(JSON.stringify({ type: 'stop_recording' }));
    await this.donePromise;
  }
  close(code = 1000, reason = 'Session ended by user'): void {
    if (this._status === 'ended') return;
    this.transitionToEnding(code, reason);
    this.cancelReconnect();
    if (this.ws && this.ws.readyState < 2) this.ws.close(code, reason);
    this.finish(code, reason);
  }
  get closed(): boolean {
    return this._status === 'ended';
  }
  get status(): LiveSessionStatus {
    return this._status;
  }

  private connect(): void {
    if (this._status === 'ended' || this.signal?.aborted) return;
    const WS = (this.WebSocketCtor ?? globalThis.WebSocket) as typeof WebSocket;
    if (!WS) throw new GladiaWebSocketError('No WebSocket implementation available');
    if (this._status !== 'connecting') {
      this._status = 'connecting';
      this.emit('connecting', { attempt: this.attempts + 1 });
    }
    const ws = new WS(this.url);
    this.ws = ws;
    if (this.retry.timeout > 0) {
      this.connectionTimer = setTimeout(() => {
        if (ws === this.ws && ws.readyState !== 1) {
          ws.close(4504, `WebSocket connection timed out after ${this.retry.timeout}ms`);
        }
      }, this.retry.timeout);
    }
    ws.binaryType = 'arraybuffer';
    ws.addEventListener('open', () => {
      if (ws !== this.ws || this._status === 'ended') return;
      this.cancelConnectionTimeout();
      const connectionAttempt = this.attempts + 1;
      this.attempts = 0;
      for (const data of this.pendingAudio) this.sendPendingAudio(ws, data);
      if (this._status === 'ending') ws.send(JSON.stringify({ type: 'stop_recording' }));
      else {
        this._status = 'connected';
        this.emit('connected', { attempt: connectionAttempt });
      }
      this.emit('open', { type: 'open' });
    });
    ws.addEventListener('message', (event: MessageEvent) => {
      if (ws === this.ws) this.handleMessage(event);
    });
    ws.addEventListener('error', () => {
      if (ws === this.ws)
        this.emit('error', { type: 'error', message: 'WebSocket connection error' });
    });
    ws.addEventListener('close', (event: CloseEvent) => {
      if (ws === this.ws) this.handleClose(event);
    });
  }

  private handleClose(event: CloseEvent): void {
    this.cancelConnectionTimeout();
    if (
      this._status !== 'ending' &&
      matchesCode(event.code, this.retry.closeCodes) &&
      this.attempts < this.retry.maxAttempts
    ) {
      this.attempts++;
      this._status = 'connecting';
      this.emit('connecting', { attempt: this.attempts + 1 });
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = undefined;
        this.connect();
      }, this.retry.delay(this.attempts));
      return;
    }
    if (event.code !== 1000 && event.code !== 1005)
      this.emit('error', {
        type: 'error',
        code: event.code,
        message: event.reason || `WebSocket closed with code ${event.code}`,
      });
    this.finish(event.code, event.reason);
  }

  private handleMessage(event: MessageEvent): void {
    if (typeof event.data !== 'string') return;
    let msg: LiveBaseMessage;
    try {
      msg = JSON.parse(event.data) as LiveBaseMessage;
    } catch {
      this.emit('error', { type: 'error', message: 'Invalid JSON received from WebSocket' });
      return;
    }
    const isAcknowledgment = 'acknowledged' in msg;
    if (msg.type === 'audio_chunk' && 'acknowledged' in msg && msg.acknowledged && msg.data) {
      this.acknowledgeThrough(msg.data.byte_range[1] ?? this.acknowledgedBytes);
    }
    if (!isAcknowledgment || this.emitAcknowledgments) this.emit('message', msg);
    if (msg.type === 'transcript') {
      const transcript = msg as LiveTranscriptMessage;
      this.emit('transcript', transcript);
      this.emit(transcript.data.is_final ? 'transcript:final' : 'transcript:partial', transcript);
      return;
    }
    if (msg.type === 'end_session') {
      this.emit('end_session', msg as LiveEventMap['end_session']);
      this.finish(1000, 'Gladia ended the session');
      if (this.ws && this.ws.readyState < 2) this.ws.close(1000, 'Gladia ended the session');
      return;
    }
    if (isAcknowledgment && !this.emitAcknowledgments) return;
    this.emit(msg.type as LiveEventName, msg as never);
  }
  private emit<K extends LiveEventName>(event: K, data: LiveEventMap[K]): void {
    for (const listener of this.listeners.get(event) ?? []) listener(data);
  }

  private acknowledgeThrough(byteEnd: number): void {
    let consumed = Math.max(0, byteEnd - this.acknowledgedBytes);
    while (consumed > 0 && this.pendingAudio.length > 0) {
      const first = this.pendingAudio[0];
      const length = pendingAudioLength(first);
      if (consumed < length) {
        this.pendingAudio[0] = slicePendingAudio(first, consumed);
        consumed = 0;
      } else {
        consumed -= length;
        this.pendingAudio.shift();
      }
    }
    this.acknowledgedBytes = Math.max(this.acknowledgedBytes, byteEnd);
  }

  private assertCanSendAudio(): void {
    if (this._status === 'ending' || this._status === 'ended') {
      throw new GladiaWebSocketError('Cannot send audio: session is ending or closed');
    }
  }

  private sendPendingAudio(ws: WebSocket, pending: PendingAudio): void {
    if (pending.kind === 'binary') ws.send(pending.data);
    else
      ws.send(JSON.stringify({ type: 'audio_chunk', data: { chunk: encodeBase64(pending.data) } }));
  }

  private transitionToEnding(code: number, reason?: string): void {
    if (this._status === 'ending' || this._status === 'ended') return;
    this._status = 'ending';
    this.emit('ending', { code, reason });
  }

  private finish(code: number, reason?: string): void {
    if (this._status === 'ended') return;
    this.transitionToEnding(code, reason);
    this._status = 'ended';
    this.cancelReconnect();
    this.cancelConnectionTimeout();
    this.pendingAudio.length = 0;
    this.emit('ended', { code, reason });
    this.doneResolve?.();
    this.signal?.removeEventListener('abort', this.abortHandler);
    this.listeners.clear();
  }

  private abort(): void {
    if (this._status === 'ended') return;
    this.transitionToEnding(1001, 'Aborted');
    this.cancelReconnect();
    if (this.ws && this.ws.readyState < 2) this.ws.close(1001, 'Aborted');
    this.finish(1001, 'Aborted');
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }

  private cancelConnectionTimeout(): void {
    if (this.connectionTimer) clearTimeout(this.connectionTimer);
    this.connectionTimer = undefined;
  }
}

function matchesCode(code: number, values: (number | readonly [number, number])[]): boolean {
  return values.some((value) =>
    typeof value === 'number' ? value === code : code >= value[0] && code <= value[1],
  );
}
function pendingAudioLength(pending: PendingAudio): number {
  return pending.kind === 'base64'
    ? pending.data.byteLength
    : pending.data instanceof Blob
      ? pending.data.size
      : pending.data.byteLength;
}
function slicePendingAudio(pending: PendingAudio, offset: number): PendingAudio {
  if (pending.kind === 'base64') return { kind: 'base64', data: pending.data.slice(offset) };
  const data = pending.data;
  if (data instanceof Blob) return { kind: 'binary', data: data.slice(offset) };
  if (data instanceof Uint8Array) return { kind: 'binary', data: data.slice(offset) };
  return { kind: 'binary', data: data.slice(offset) };
}
function decodeBase64(value: string): Uint8Array {
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch (error) {
    throw new GladiaWebSocketError(
      `Invalid base64 audio chunk: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
function encodeBase64(value: Uint8Array): string {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}
