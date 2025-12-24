export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public service?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const handleAPIError = (error: unknown, service: string): never => {
  if (error instanceof Response) {
    throw new APIError(
      `${service} API request failed: ${error.statusText}`,
      error.status,
      service
    );
  }
  
  if (error instanceof Error) {
    throw new APIError(error.message, undefined, service);
  }
  
  throw new APIError('Unknown error occurred', undefined, service);
};

export const validateTicker = (ticker: string): void => {
  const tickerRegex = /^[A-Z]{1,5}$/;
  if (!tickerRegex.test(ticker)) {
    throw new ValidationError(
      'Ticker must be 1-5 uppercase letters',
      'ticker'
    );
  }
};