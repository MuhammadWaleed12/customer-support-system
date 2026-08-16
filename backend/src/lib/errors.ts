export class NotFoundError extends Error {
  readonly statusCode = 404;

  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ExternalServiceError extends Error {
  readonly statusCode = 502;

  constructor(message: string) {
    super(message);
    this.name = "ExternalServiceError";
  }
}

export class RateLimitError extends Error {
  readonly statusCode = 429;
  readonly retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
