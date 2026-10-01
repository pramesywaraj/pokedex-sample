import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, timer } from 'rxjs';
import { retry } from 'rxjs/operators';
import { NetworkService } from '../../application/network.service';

/** How many times a failed request is retried before the error surfaces. */
const MAX_RETRIES = 2;
/** Base delay in ms, the actual wait grows linearly with the attempt. */
const BASE_DELAY_MS = 300;

/**
 * Retries a failed request a couple of times with short increasing delay, so
 * transient blips and stray 429s heal before the UI shows an error. A 404 is
 * never retried, since it cannot succeed on retry. When the device is already
 * known to be offline the retries are skipped and the error fails fast, so the
 * offline state screens take over without the user waiting on dead requests.
 */
export const retryBackoffInterceptor: HttpInterceptorFn = (req, next) => {
  const network = inject(NetworkService);
  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error, retryCount) => {
        if (!network.online() || !isRetryable(error)) {
          return throwError(() => error);
        }
        return timer(BASE_DELAY_MS * retryCount);
      },
    }),
  );
};

/**
 * Only transport blips and server hiccups earn a retry. A 404 is permanent, a
 * 4xx other than 429 is a bad request we shouldn't repeat.
 */
function isRetryable(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }
  if (error.status === 0) {
    return true;
  }
  if (error.status === 429) {
    return true;
  }
  return error.status >= 500 && error.status < 600;
}
