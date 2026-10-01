import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NetworkService } from '../../application/network.service';
import { retryBackoffInterceptor } from './retry-backoff.interceptor';

describe('retryBackoffInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  const onlineSignal = signal(true);

  beforeEach(() => {
    vi.useFakeTimers();
    onlineSignal.set(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([retryBackoffInterceptor])),
        provideHttpClientTesting(),
        { provide: NetworkService, useValue: { online: onlineSignal.asReadonly() } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    vi.useRealTimers();
  });

  async function flushTimers(times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
      await vi.advanceTimersByTimeAsync(10_000);
    }
  }

  it('retries a 500 up to twice before giving up', async () => {
    const pending = firstValueFrom(http.get('/x'));
    controller.expectOne('/x').flush('err', { status: 500, statusText: 'x' });
    await flushTimers(1);
    controller.expectOne('/x').flush('err', { status: 500, statusText: 'x' });
    await flushTimers(1);
    controller.expectOne('/x').flush('err', { status: 500, statusText: 'x' });
    await expect(pending).rejects.toBeTruthy();
  });

  it('recovers when a retry succeeds', async () => {
    const pending = firstValueFrom(http.get<{ ok: boolean }>('/x'));
    controller.expectOne('/x').flush('err', { status: 500, statusText: 'x' });
    await flushTimers(1);
    controller.expectOne('/x').flush({ ok: true });
    await expect(pending).resolves.toEqual({ ok: true });
  });

  it('does not retry a 404', async () => {
    const pending = firstValueFrom(http.get('/x'));
    controller.expectOne('/x').flush('nf', { status: 404, statusText: 'nf' });
    await expect(pending).rejects.toBeTruthy();
    controller.expectNone('/x');
  });

  it('skips retries when the network is known to be offline', async () => {
    onlineSignal.set(false);
    const pending = firstValueFrom(http.get('/x'));
    controller.expectOne('/x').flush('err', { status: 0, statusText: 'x' });
    await expect(pending).rejects.toBeTruthy();
    controller.expectNone('/x');
  });
});
