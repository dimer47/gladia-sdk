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

export interface ApiErrorContext {
  method?: string;
  url?: string;
  requestId?: string;
  responseHeaders?: Record<string, string>;
}

export class GladiaApiError extends GladiaError {
  readonly status: number;
  readonly body: ApiErrorBody;
  readonly method?: string;
  readonly url?: string;
  readonly requestId?: string;
  readonly responseHeaders?: Record<string, string>;

  constructor(status: number, body: ApiErrorBody, context: ApiErrorContext = {}) {
    super(body.message ?? `API error ${status}`);
    this.name = 'GladiaApiError';
    this.status = status;
    this.body = body;
    this.method = context.method;
    this.url = context.url;
    this.requestId = context.requestId ?? body.request_id;
    this.responseHeaders = context.responseHeaders;
  }
}

export class BadRequestError extends GladiaApiError {
  readonly validationErrors: string[];

  constructor(body: ApiErrorBody, context?: ApiErrorContext) {
    super(400, body, context);
    this.name = 'BadRequestError';
    this.validationErrors = body.validation_errors ?? [];
  }
}

export class UnauthorizedError extends GladiaApiError {
  constructor(body: ApiErrorBody, context?: ApiErrorContext) {
    super(401, body, context);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends GladiaApiError {
  constructor(body: ApiErrorBody, context?: ApiErrorContext) {
    super(403, body, context);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends GladiaApiError {
  constructor(body: ApiErrorBody, context?: ApiErrorContext) {
    super(404, body, context);
    this.name = 'NotFoundError';
  }
}

export class UnprocessableEntityError extends GladiaApiError {
  constructor(body: ApiErrorBody, context?: ApiErrorContext) {
    super(422, body, context);
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
