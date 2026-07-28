export class RateLimitError extends Error {
  constructor() {
    super("Too many requests. Try again later.");
    this.name = "RateLimitError";
  }
}
