import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AppError } from '../../domain/app-error';

/**
 * Normalises transport failures into the app's `AppError` vocabulary so screens
 * branch on `kind` without touching HTTP.
 */
export const errorNormaliseInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 404) {
          return throwError(() => new AppError('notFound', error.message));
        }
        if (error.status === 0 || !navigator.onLine) {
          return throwError(() => new AppError('offline', error.message));
        }
        return throwError(() => new AppError('transient', error.message));
      }
      return throwError(() => new AppError('transient'));
    }),
  );
