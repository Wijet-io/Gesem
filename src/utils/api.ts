import { JibbleError } from '../types/api/jibble';

export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }

  static fromJibbleError(error: JibbleError): APIError {
    return new APIError(error.message, error.code, error.details);
  }
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    throw APIError.fromJibbleError(error);
  }
  return response.json();
}

export function createQueryString(params: Record<string, string>): string {
  return new URLSearchParams(
    Object.entries(params).filter(([_, value]) => value != null)
  ).toString();
}