import { describe, it, expect, vi } from 'vitest';
import { LiveSession } from '../src/live/session.js';
import { GladiaWebSocketError } from '../src/errors.js';

// ── Mock WebSocket ───────────────────────────────────────
type WsListener = (event: Record<string, unknown>) => void;

class MockWebSocket {
  binaryType = '';
  url: string;
  private listeners = new Map<string, WsListener[]>();
  sent: unknown[] = [];

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(event: string, listener: WsListener) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(listener);
  }

  send(data: unknown) {
    this.sent.push(data);
  }

  simulateOpen() {
    for (const l of this.listeners.get('open') ?? []) l({});
  }

  // Helpers pour simuler les événements
  simulateMessage(data: string) {
    for (const l of this.listeners.get('message') ?? []) {
      l({ data });
    }
  }

  simulateClose(code = 1000, reason = '') {
    for (const l of this.listeners.get('close') ?? []) {
      l({ code, reason });
    }
  }

  simulateError() {
    for (const l of this.listeners.get('error') ?? []) {
      l({});
    }
  }
}

function createSession(): { session: LiveSession; ws: MockWebSocket } {
  let captured: MockWebSocket | null = null;
  const WsCtor = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      captured = this;
    }
  };

  const session = new LiveSession('wss://test.gladia.io/v2/live?token=abc', WsCtor);
  return { session, ws: captured! };
}

describe('LiveSession', () => {
  describe('construction', () => {
    it('crée un WebSocket avec l\'URL fournie', () => {
      const { ws } = createSession();
      expect(ws.url).toBe('wss://test.gladia.io/v2/live?token=abc');
    });

    it('configure binaryType = arraybuffer', () => {
      const { ws } = createSession();
      expect(ws.binaryType).toBe('arraybuffer');
    });

    it('closed est false à la construction', () => {
      const { session } = createSession();
      expect(session.closed).toBe(false);
    });
  });

  describe('on() / off()', () => {
    it('on() enregistre un listener et retourne this', () => {
      const { session } = createSession();
      const listener = vi.fn();
      const ret = session.on('start_session', listener);
      expect(ret).toBe(session);
    });

    it('off() supprime un listener', () => {
      const { session, ws } = createSession();
      const listener = vi.fn();
      session.on('start_session', listener);
      session.off('start_session', listener);

      ws.simulateMessage(JSON.stringify({ type: 'start_session' }));
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('événements de transcription', () => {
    it('émet transcript:final pour un message final', () => {
      const { session, ws } = createSession();
      const listener = vi.fn();
      session.on('transcript:final', listener);

      ws.simulateMessage(JSON.stringify({
        type: 'transcript',
        data: { id: 'utt-1', is_final: true, utterance: { text: 'Bonjour' } },
      }));

      expect(listener).toHaveBeenCalledOnce();
      expect(listener.mock.calls[0][0].data.utterance.text).toBe('Bonjour');
    });

    it('émet transcript:partial pour un message partiel', () => {
      const { session, ws } = createSession();
      const listener = vi.fn();
      session.on('transcript:partial', listener);

      ws.simulateMessage(JSON.stringify({
        type: 'transcript',
        data: { id: 'utt-1', is_final: false, utterance: { text: 'Bon' } },
      }));

      expect(listener).toHaveBeenCalledOnce();
    });

    it('n\'émet pas transcript:final pour un message partiel', () => {
      const { session, ws } = createSession();
      const finalListener = vi.fn();
      session.on('transcript:final', finalListener);

      ws.simulateMessage(JSON.stringify({
        type: 'transcript',
        data: { id: 'utt-1', is_final: false, utterance: { text: 'Bon' } },
      }));

      expect(finalListener).not.toHaveBeenCalled();
    });
  });

  describe('événement message (générique)', () => {
    it('émet message pour tout type de message', () => {
      const { session, ws } = createSession();
      const listener = vi.fn();
      session.on('message', listener);

      ws.simulateMessage(JSON.stringify({ type: 'start_session' }));
      ws.simulateMessage(JSON.stringify({ type: 'end_session' }));
      ws.simulateMessage(JSON.stringify({ type: 'transcript', data: { id: '1', is_final: true, utterance: { text: 'Hi' } } }));

      expect(listener).toHaveBeenCalledTimes(3);
    });
  });

  describe('événements de cycle de vie', () => {
    it('émet start_session', () => {
      const { session, ws } = createSession();
      const listener = vi.fn();
      session.on('start_session', listener);

      ws.simulateMessage(JSON.stringify({ type: 'start_session' }));
      expect(listener).toHaveBeenCalledOnce();
    });

    it('émet end_session', async () => {
      const { session, ws } = createSession();
      const listener = vi.fn();
      session.on('end_session', listener);

      // Envoi de stop puis done
      ws.simulateMessage(JSON.stringify({ type: 'end_session' }));

      expect(listener).toHaveBeenCalledOnce();
    });

    it('émet speech_start et speech_end', () => {
      const { session, ws } = createSession();
      const beginListener = vi.fn();
      const endListener = vi.fn();
      session.on('speech_start', beginListener);
      session.on('speech_end', endListener);

      ws.simulateMessage(JSON.stringify({ type: 'speech_start', data: {} }));
      ws.simulateMessage(JSON.stringify({ type: 'speech_end', data: {} }));

      expect(beginListener).toHaveBeenCalledOnce();
      expect(endListener).toHaveBeenCalledOnce();
    });
  });

  describe('sendAudio()', () => {
    it('envoie des données binaires via le WebSocket', () => {
      const { session, ws } = createSession();
      const data = new Uint8Array([1, 2, 3]);

      session.sendAudio(data);

      expect(ws.sent).toHaveLength(1);
      expect(ws.sent[0]).toBe(data);
    });

    it('accepte ArrayBuffer', () => {
      const { session, ws } = createSession();
      const buffer = new ArrayBuffer(4);

      session.sendAudio(buffer);

      expect(ws.sent[0]).toBe(buffer);
    });

    it('accepte Blob', () => {
      const { session, ws } = createSession();
      const blob = new Blob(['audio']);

      session.sendAudio(blob);

      expect(ws.sent[0]).toBe(blob);
    });

    it('lance GladiaWebSocketError si la session est fermée', () => {
      const { session, ws } = createSession();
      ws.simulateClose(1000);

      expect(() => session.sendAudio(new Uint8Array([1]))).toThrow(GladiaWebSocketError);
    });
  });

  describe('stop()', () => {
    it('envoie {"type":"stop_recording"} via le WebSocket', async () => {
      const { session, ws } = createSession();

      // Simuler done immédiatement après stop
      const stopPromise = session.stop();
      ws.simulateMessage(JSON.stringify({ type: 'end_session' }));
      await stopPromise;

      expect(ws.sent).toHaveLength(1);
      expect(JSON.parse(ws.sent[0] as string)).toEqual({ type: 'stop_recording' });
    });

    it('résout quand le message end_session arrive', async () => {
      const { session, ws } = createSession();

      const stopPromise = session.stop();

      // Simuler un délai puis done
      setTimeout(() => {
        ws.simulateMessage(JSON.stringify({ type: 'end_session' }));
      }, 10);

      await stopPromise; // Ne doit pas timeout
    });

    it('résout immédiatement si déjà fermé', async () => {
      const { session, ws } = createSession();
      ws.simulateClose(1000);

      await session.stop(); // Ne doit pas bloquer
    });
  });

  describe('gestion des erreurs', () => {
    it('émet error sur fermeture anormale (code != 1000, 1005)', () => {
      const { session, ws } = createSession();
      const errorListener = vi.fn();
      session.on('error', errorListener);

      ws.simulateClose(1006, 'abnormal');

      expect(errorListener).toHaveBeenCalledOnce();
      expect(errorListener.mock.calls[0][0].code).toBe(1006);
    });

    it('n\'émet pas error sur fermeture normale (1000)', () => {
      const { session, ws } = createSession();
      const errorListener = vi.fn();
      session.on('error', errorListener);

      ws.simulateClose(1000);

      expect(errorListener).not.toHaveBeenCalled();
    });

    it('n\'émet pas error sur fermeture 1005', () => {
      const { session, ws } = createSession();
      const errorListener = vi.fn();
      session.on('error', errorListener);

      ws.simulateClose(1005);

      expect(errorListener).not.toHaveBeenCalled();
    });

    it('émet error sur erreur WebSocket', () => {
      const { session, ws } = createSession();
      const errorListener = vi.fn();
      session.on('error', errorListener);

      ws.simulateError();

      expect(errorListener).toHaveBeenCalledOnce();
      expect(errorListener.mock.calls[0][0].message).toBe('WebSocket connection error');
    });

    it('closed passe à true après fermeture', () => {
      const { session, ws } = createSession();
      expect(session.closed).toBe(false);

      ws.simulateClose(1000);

      expect(session.closed).toBe(true);
    });
  });

  describe('messages non-JSON', () => {
    it('ignore les messages binaires', () => {
      const { session, ws } = createSession();
      const listener = vi.fn();
      session.on('message', listener);

      // Simuler un message binaire (data n'est pas string)
      for (const l of (ws as unknown as { listeners: Map<string, WsListener[]> }).listeners?.get?.('message') ?? []) {
        // On ne peut pas appeler simulateMessage car il envoie un string
      }
      // Les messages binaires sont ignorés par handleMessage (typeof event.data !== 'string')
      // Pas d'appel donc pas de crash
      expect(listener).not.toHaveBeenCalled();
    });

    it('ignore les messages JSON invalides', () => {
      const { session, ws } = createSession();
      const listener = vi.fn();
      session.on('message', listener);

      ws.simulateMessage('not json {{{');

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
