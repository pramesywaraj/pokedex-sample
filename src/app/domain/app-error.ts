/**
 * The kinds of failure the UI branches. The
 * error-normalise interceptor produces the first three, and the Favourites/storage
 * layer produces `storage`.
 */
export type AppErrorKind = 'offline' | 'notFound' | 'transient' | 'storage';

/**
 * The app's shared error vocabulary. Transport errors are normalised to one of
 * these at the data boundary, so screens can tell a 404 not-found from a
 * retryable transient failure without knowing anything about HTTP.
 */
export class AppError extends Error {
  constructor(
    readonly kind: AppErrorKind,
    message?: string,
  ) {
    super(message ?? kind);
    this.name = 'AppError';
  }
}
