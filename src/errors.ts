export class GladiaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GladiaError';
  }
}

export interface ApiErrorBody {
  timestamp?: string;
  path?: string;
  request_id?: string;
  statusCode?: number;
  message?: string;
  validation_errors?: string[];
}

export class GladiaApiError extends GladiaError {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message ?? `API error ${status}`);
    this.name = 'GladiaApiError';
    this.status = status;
    this.body = body;
  }
}

export class BadRequestError extends GladiaApiError {
  readonly validationErrors: string[];

  constructor(body: ApiErrorBody) {
    super(400, body);
    this.name = 'BadRequestError';
    this.validationErrors = body.validation_errors ?? [];
  }
}

export class UnauthorizedError extends GladiaApiError {
  constructor(body: ApiErrorBody) {
    super(401, body);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends GladiaApiError {
  constructor(body: ApiErrorBody) {
    super(403, body);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends GladiaApiError {
  constructor(body: ApiErrorBody) {
    super(404, body);
    this.name = 'NotFoundError';
  }
}

export class UnprocessableEntityError extends GladiaApiError {
  constructor(body: ApiErrorBody) {
    super(422, body);
    this.name = 'UnprocessableEntityError';
  }
}

export class GladiaTimeoutError extends GladiaError {
  constructor(message = 'Polling timed out') {
    super(message);
    this.name = 'GladiaTimeoutError';
  }
}

export class GladiaWebSocketError extends GladiaError {
  readonly code?: number;
  readonly reason?: string;

  constructor(message: string, code?: number, reason?: string) {
    super(message);
    this.name = 'GladiaWebSocketError';
    this.code = code;
    this.reason = reason;
  }
}
