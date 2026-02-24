import { describe, it, expect } from 'vitest';
import {
  GladiaError,
  GladiaApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
  GladiaTimeoutError,
  GladiaWebSocketError,
} from '../src/errors.js';

describe('GladiaError', () => {
  it('est une instance de Error', () => {
    const err = new GladiaError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(GladiaError);
    expect(err.message).toBe('test');
    expect(err.name).toBe('GladiaError');
  });
});

describe('GladiaApiError', () => {
  it('stocke le status et le body', () => {
    const body = { message: 'oops', statusCode: 500 };
    const err = new GladiaApiError(500, body);
    expect(err).toBeInstanceOf(GladiaError);
    expect(err).toBeInstanceOf(GladiaApiError);
    expect(err.status).toBe(500);
    expect(err.body).toBe(body);
    expect(err.message).toBe('oops');
    expect(err.name).toBe('GladiaApiError');
  });

  it('utilise un message par défaut si body.message est absent', () => {
    const err = new GladiaApiError(502, {});
    expect(err.message).toBe('API error 502');
  });
});

describe('BadRequestError', () => {
  it('a le status 400 et expose validationErrors', () => {
    const body = {
      message: 'Invalid',
      validation_errors: ['Field "x" required', 'Field "y" must be number'],
    };
    const err = new BadRequestError(body);
    expect(err).toBeInstanceOf(GladiaApiError);
    expect(err.status).toBe(400);
    expect(err.name).toBe('BadRequestError');
    expect(err.validationErrors).toEqual(['Field "x" required', 'Field "y" must be number']);
  });

  it('retourne un tableau vide si pas de validation_errors', () => {
    const err = new BadRequestError({ message: 'bad' });
    expect(err.validationErrors).toEqual([]);
  });
});

describe('UnauthorizedError', () => {
  it('a le status 401', () => {
    const err = new UnauthorizedError({ message: 'no key' });
    expect(err.status).toBe(401);
    expect(err.name).toBe('UnauthorizedError');
    expect(err).toBeInstanceOf(GladiaApiError);
  });
});

describe('ForbiddenError', () => {
  it('a le status 403', () => {
    const err = new ForbiddenError({ message: 'forbidden' });
    expect(err.status).toBe(403);
    expect(err.name).toBe('ForbiddenError');
  });
});

describe('NotFoundError', () => {
  it('a le status 404', () => {
    const err = new NotFoundError({ message: 'not found' });
    expect(err.status).toBe(404);
    expect(err.name).toBe('NotFoundError');
  });
});

describe('UnprocessableEntityError', () => {
  it('a le status 422', () => {
    const err = new UnprocessableEntityError({ message: 'unprocessable' });
    expect(err.status).toBe(422);
    expect(err.name).toBe('UnprocessableEntityError');
  });
});

describe('GladiaTimeoutError', () => {
  it('a un message par défaut', () => {
    const err = new GladiaTimeoutError();
    expect(err).toBeInstanceOf(GladiaError);
    expect(err.message).toBe('Polling timed out');
    expect(err.name).toBe('GladiaTimeoutError');
  });

  it('accepte un message personnalisé', () => {
    const err = new GladiaTimeoutError('custom timeout');
    expect(err.message).toBe('custom timeout');
  });
});

describe('GladiaWebSocketError', () => {
  it('stocke code et reason', () => {
    const err = new GladiaWebSocketError('ws error', 1006, 'abnormal');
    expect(err).toBeInstanceOf(GladiaError);
    expect(err.message).toBe('ws error');
    expect(err.code).toBe(1006);
    expect(err.reason).toBe('abnormal');
    expect(err.name).toBe('GladiaWebSocketError');
  });

  it('fonctionne sans code ni reason', () => {
    const err = new GladiaWebSocketError('simple');
    expect(err.code).toBeUndefined();
    expect(err.reason).toBeUndefined();
  });
});

describe('Hiérarchie des erreurs', () => {
  it('toutes les erreurs API étendent GladiaApiError et GladiaError', () => {
    const errors = [
      new BadRequestError({ message: 'a' }),
      new UnauthorizedError({ message: 'b' }),
      new ForbiddenError({ message: 'c' }),
      new NotFoundError({ message: 'd' }),
      new UnprocessableEntityError({ message: 'e' }),
    ];
    for (const err of errors) {
      expect(err).toBeInstanceOf(GladiaApiError);
      expect(err).toBeInstanceOf(GladiaError);
      expect(err).toBeInstanceOf(Error);
    }
  });
});
