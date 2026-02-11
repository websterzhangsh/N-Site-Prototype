/**
 * LLM Error Classes
 * 
 * Unified error handling for all LLM providers
 */

export class LLMError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class RateLimitError extends LLMError {
  retryAfter?: number;
  
  constructor(provider: string, retryAfter?: number) {
    super('Rate limit exceeded', provider, 'RATE_LIMIT', 429);
    this.retryAfter = retryAfter;
  }
}

export class AuthenticationError extends LLMError {
  constructor(provider: string) {
    super('Authentication failed', provider, 'AUTH_ERROR', 401);
  }
}

export class QuotaExceededError extends LLMError {
  constructor(provider: string) {
    super('Quota exceeded', provider, 'QUOTA_EXCEEDED', 429);
  }
}

export class ModelNotFoundError extends LLMError {
  constructor(provider: string, model: string) {
    super(`Model not found: ${model}`, provider, 'MODEL_NOT_FOUND', 404);
  }
}

export class InvalidRequestError extends LLMError {
  constructor(provider: string, message: string) {
    super(message, provider, 'INVALID_REQUEST', 400);
  }
}
