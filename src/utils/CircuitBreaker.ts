export enum CircuitState {
  OPEN,
  HALF_OPEN,
  CLOSED,
}
export class CircuitBreaker {
  private state: CircuitState;
  private failureThreshold: number;
  private successThreshold: number;
  private failureCount: number;
  private successCount: number;
  // Time (ms) to transition from OPEN to HALF_OPEN state
  private timeout: number;
  // Timer to transition from OPEN to HALF_OPEN state
  private timeoutTimer: NodeJS.Timeout | null = null;
  // Time window (ms) for failures to count in CLOSED state
  private failureWindow: number;
  // Time of the first failure in the current window. Used to determine if the
  // failure count should be reset because the window has passed.
  private firstWindowFailure: number;

  /**
   * Creates an instance of CircuitBreaker.
   *
   * @param failureThreshold - The number of consecutive failures needed to trip
   *        the circuit.
   * @param successThreshold - The number of consecutive successes needed to
   *        reset the circuit.
   * @param timeout - The time in milliseconds to wait before transitioning from
   *        OPEN to HALF-OPEN state.
   * @param failureWindow - The time window in milliseconds for counting
   *        failures.
   */
  constructor(
    failureThreshold: number = 3,
    successThreshold: number = 2,
    timeout: number = 15000,
    failureWindow: number = 60000,
  ) {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;

    this.failureThreshold = failureThreshold;
    this.successThreshold = successThreshold;
    this.timeout = timeout;
    this.failureWindow = failureWindow;
    this.firstWindowFailure = Date.now();
  }

  getState(): CircuitState {
    return this.state;
  }

  async call<T>(apiFunction: () => Promise<T>): Promise<T> {
    // OPEN state: fail immediately
    // No need to check for changing to HALF-OPEN state as the timer will handle
    // it.
    if (this.state === CircuitState.OPEN) {
      throw new Error('Circuit is OPEN. Request blocked.');
    }

    // HALF-OPEN state: allow limited attempts
    // CLOSED state: process normally
    try {
      const response = await apiFunction();
      this.onSuccess();
      return response;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.restartCircuit();
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0; // Reset failures on success
    }
  }

  private onFailure() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN; // Revert to OPEN immediately
      this.initializeTimeout();
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount++;

      // Reset failure count if outside the failure window
      const now = Date.now();
      if (now - this.firstWindowFailure > this.failureWindow) {
        this.firstWindowFailure = now;
        this.failureCount = 1;
      }

      if (this.failureCount >= this.failureThreshold) {
        this.state = CircuitState.OPEN;
        this.initializeTimeout();
      }
    }
  }

  /**
   * Starts a timer that sets the circuit state to HALF-OPEN after a specified
   * timeout.
   *
   * - Records the current time as the last failure time.
   * - Clears any existing timer.
   * - Sets a new timer that:
   *   - Changes the circuit state to HALF-OPEN after the timeout period.
   *   - Resets the success count to 0.
   *
   * @private
   */
  private initializeTimeout() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    this.timeoutTimer = setTimeout(() => {
      this.state = CircuitState.HALF_OPEN; // Move to HALF-OPEN after timeout
      this.successCount = 0;
    }, this.timeout);
  }

  /**
   * Resets the circuit breaker state to CLOSED and clears the failure and
   * success counts. If a timer is active, it will be cleared and set to null.
   *
   * @private
   */
  private restartCircuit() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }
}
