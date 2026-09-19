import { GladiaWebSocketError } from '../errors.js';
import type { LiveEventMap, LiveEventName, LiveBaseMessage, LiveTranscriptMessage } from './events.js';

type Listener<T> = (data: T) => void;

export class LiveSession {
  private ws: WebSocket;
  private listeners = new Map<string, Set<Listener<unknown>>>();
  private _closed = false;
  private _donePromiseResolve?: () => void;
  private _donePromise: Promise<void>;

  constructor(url: string, WebSocketCtor?: unknown) {
    const WS = (WebSocketCtor ?? globalThis.WebSocket) as typeof WebSocket;
    this.ws = new WS(url);
    this.ws.binaryType = 'arraybuffer';

    this._donePromise = new Promise<void>((resolve) => {
      this._donePromiseResolve = resolve;
    });

    this.ws.addEventListener('message', (event: MessageEvent) => {
      this.handleMessage(event);
    });

    this.ws.addEventListener('open', () => {
      this.emit('open', { type: 'open' });
    });

    this.ws.addEventListener('close', (event: CloseEvent) => {
      this._closed = true;
      if (event.code !== 1000 && event.code !== 1005) {
        this.emit('error', {
          type: 'error',
          code: event.code,
          message: event.reason || `WebSocket closed with code ${event.code}`,
        });
      }
      this._donePromiseResolve?.();
    });

    this.ws.addEventListener('error', () => {
      this.emit('error', {
        type: 'error',
        message: 'WebSocket connection error',
      });
    });
  }

  /**
   * Register a typed event listener.
   */
  on<K extends LiveEventName>(event: K, listener: Listener<LiveEventMap[K]>): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);
    return this;
  }

  /**
   * Remove a typed event listener.
   */
  off<K extends LiveEventName>(event: K, listener: Listener<LiveEventMap[K]>): this {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
    return this;
  }

  /**
   * Send raw audio data (ArrayBuffer, Uint8Array, or Blob).
   */
  sendAudio(data: ArrayBuffer | Uint8Array | Blob): void {
    if (this._closed) {
      throw new GladiaWebSocketError('Cannot send audio: session is closed');
    }
    this.ws.send(data);
  }

  /** Send a base64-encoded audio chunk using the JSON action from the AsyncAPI contract. */
  sendAudioBase64(chunk: string): void {
    if (this._closed) throw new GladiaWebSocketError('Cannot send audio: session is closed');
    this.ws.send(JSON.stringify({ type: 'audio_chunk', data: { chunk } }));
  }

  /**
   * Signal end of audio and wait for the server to finish processing.
   * Returns a promise that resolves when the session ends or the socket closes.
   */
  async stop(): Promise<void> {
    if (this._closed) return;

    this.ws.send(JSON.stringify({ type: 'stop_recording' }));
    await this._donePromise;
  }

  /**
   * Returns true if the WebSocket is closed.
   */
  get closed(): boolean {
    return this._closed;
  }

  private handleMessage(event: MessageEvent): void {
    if (typeof event.data !== 'string') return;

    let msg: LiveBaseMessage;
    try {
      msg = JSON.parse(event.data) as LiveBaseMessage;
    } catch {
      return;
    }

    // Emit the raw message on the generic "message" channel
    this.emit('message', msg);

    // Route transcript messages to typed channels
    if (msg.type === 'transcript') {
      const transcript = msg as unknown as LiveTranscriptMessage;
      this.emit('transcript', transcript);
      if (transcript.data?.is_final === false) {
        this.emit('transcript:partial', transcript);
      } else if (transcript.data?.is_final === true) {
        this.emit('transcript:final', transcript);
      }
      return;
    }

    if (msg.type === 'end_session') {
      this.emit('end_session', msg as unknown as LiveEventMap['end_session']);
      this._donePromiseResolve?.();
      return;
    }

    // Emit other message types as-is
    this.emit(msg.type as LiveEventName, msg as never);
  }

  private emit<K extends LiveEventName>(event: K, data: LiveEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      listener(data);
    }
  }
}
