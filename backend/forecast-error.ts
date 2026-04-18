export class FloodForecastUnavailableError extends Error {
  constructor(
    message = "Live river flood data could not be loaded for this location. Try again shortly.",
  ) {
    super(message);
    this.name = "FloodForecastUnavailableError";
  }
}

export function isFloodForecastUnavailableError(
  value: unknown,
): value is FloodForecastUnavailableError {
  return value instanceof FloodForecastUnavailableError;
}
