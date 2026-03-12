// ─── Retry Utility ───────────────────────────────────────────────────────────
// Implements exponential backoff retry for failed operations

import { 
  RETRY_MAX_ATTEMPTS, 
  RETRY_INITIAL_DELAY_MS, 
  RETRY_MAX_DELAY_MS 
} from '../constants/AppConstants';

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = RETRY_MAX_ATTEMPTS,
    initialDelay = RETRY_INITIAL_DELAY_MS,
    maxDelay = RETRY_MAX_DELAY_MS,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
}
