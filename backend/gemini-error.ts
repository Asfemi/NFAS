/** Raised when Gemini must produce advisory text but cannot (misconfiguration or upstream failure). */
export class GeminiAdvisoryError extends Error {
  readonly httpStatus: number;

  constructor(message: string, httpStatus: number = 502) {
    super(message);
    this.name = "GeminiAdvisoryError";
    this.httpStatus = httpStatus;
  }
}

export function isGeminiAdvisoryError(value: unknown): value is GeminiAdvisoryError {
  return value instanceof GeminiAdvisoryError;
}
