import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NetworkService } from '../../application/network.service';
import { AppError } from '../../domain/app-error';
import { errorNormaliseInterceptor } from './error-normalise.interceptor';

describe('errorNormaliseInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  const onlineSignal = signal(true);

  beforeEach(() => {
    onlineSignal.set(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorNormaliseInterceptor])),
        provideHttpClientTesting(),
        { provide: NetworkService, useValue: { online: onlineSignal.asReadonly() } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  async function kindFor(status: number): Promise<unknown> {
    const response = firstValueFrom(http.get('/x'));
    controller.expectOne('/x').flush('err', { status, statusText: 'x' });
    return response.catch((error: unknown) => error);
  }

  it('maps a 404 to notFound', async () => {
    const error = await kindFor(404);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).kind).toBe('notFound');
  });

  it('maps a network status 0 to offline', async () => {
    expect(((await kindFor(0)) as AppError).kind).toBe('offline');
  });

  it('maps a 500 to offline when the device is known offline', async () => {
    onlineSignal.set(false);
    expect(((await kindFor(500)) as AppError).kind).toBe('offline');
  });

  it('maps a 500 to transient when online', async () => {
    expect(((await kindFor(500)) as AppError).kind).toBe('transient');
  });
});
