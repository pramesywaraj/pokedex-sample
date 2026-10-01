import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NetworkService } from '../../application/network.service';
import { AppError } from '../../domain/app-error';

/**
 * Normalises transport failures into the app's `AppError` vocabulary so screens
 * branch on `kind` without touching HTTP. A 404 maps to `notFound` (never
 * retryable, flows past the cache), a transport failure while the device is
 * known offline maps to `offline` (lets views swap to the offline state and
 * auto recover on reconnect), anything else maps to `transient`.
 */
export const errorNormaliseInterceptor: HttpInterceptorFn = (req, next) => {
  const network = inject(NetworkService);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 404) {
          return throwError(() => new AppError('notFound', error.message));
        }
        if (error.status === 0 || !network.online()) {
          return throwError(() => new AppError('offline', error.message));
        }
        return throwError(() => new AppError('transient', error.message));
      }
      return throwError(() => new AppError('transient'));
    }),
  );
};
