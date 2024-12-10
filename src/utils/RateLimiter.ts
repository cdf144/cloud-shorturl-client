export class RateLimiter {
  private requestCount;
  private limit;
  private window; // in milliseconds
  private firstWindowRequest;

  /**
   * Creates an instance of RateLimiter.
   *
   * @param limit - The maximum number of requests allowed within the window.
   *        Defaults to 15.
   * @param window - The time window in milliseconds during which the limit
   *        applies. Defaults to 30,000 milliseconds (30 seconds).
   */
  constructor(limit: number = 15, window: number = 30 * 1000) {
    this.requestCount = 0;
    this.limit = limit;
    this.window = window;
    this.firstWindowRequest = Date.now();
  }

  /**
   * Makes a call and increments the request count. If the request count exceeds
   * the limit, an error is thrown indicating that the rate limit has been
   * exceeded.
   * If the current time exceeds the window duration since the first request in
   * the window, the request count is reset and the window start time is
   * updated.
   *
   * @throws {Error} If the rate limit is exceeded.
   */
  call() {
    this.requestCount++;
    const now = Date.now();
    if (now - this.firstWindowRequest > this.window) {
      this.requestCount = 1;
      this.firstWindowRequest = now;
    }

    // Since the request count is incremented before checking the limit, we
    // need to check if the limit is exceeded after incrementing.
    if (this.requestCount > this.limit) {
      throw new Error('Rate limit exceeded. Please wait and try again.');
    }
  }
}
