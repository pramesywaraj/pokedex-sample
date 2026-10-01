import type { ConnectionStatus } from '@capacitor/network';
import { Network } from '@capacitor/network';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CapacitorNetworkConnectivity } from './capacitor-network.connectivity';

vi.mock('@capacitor/network', () => ({
  Network: { getStatus: vi.fn(), addListener: vi.fn() },
}));

describe('CapacitorNetworkConnectivity', () => {
  const getStatus = vi.mocked(Network.getStatus);
  const addListener = vi.mocked(Network.addListener);
  const remove = vi.fn().mockResolvedValue(undefined);
  let notify: ((status: ConnectionStatus) => void) | undefined;

  function status(connected: boolean): ConnectionStatus {
    return { connected, connectionType: connected ? 'wifi' : 'none' };
  }

  beforeEach(() => {
    notify = undefined;
    getStatus.mockResolvedValue(status(true));
    addListener.mockImplementation((_event, listener) => {
      notify = listener;
      return Promise.resolve({ remove });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens on the browser guess, then corrects it to the platform state', async () => {
    getStatus.mockResolvedValue(status(false));
    const reported: boolean[] = [];
    const stop = new CapacitorNetworkConnectivity().watch((online) => reported.push(online));
    expect(reported).toEqual([navigator.onLine]);
    await vi.waitFor(() => expect(reported.at(-1)).toBe(false));
    stop();
  });

  it('reports every platform status change', async () => {
    const reported: boolean[] = [];
    const stop = new CapacitorNetworkConnectivity().watch((online) => reported.push(online));
    await vi.waitFor(() => expect(reported.at(-1)).toBe(true));
    notify?.(status(false));
    notify?.(status(true));
    expect(reported.slice(-2)).toEqual([false, true]);
    stop();
  });

  it('drops the platform listener once torn down', async () => {
    const stop = new CapacitorNetworkConnectivity().watch(() => undefined);
    await vi.waitFor(() => expect(notify).toBeDefined());
    stop();
    await vi.waitFor(() => expect(remove).toHaveBeenCalled());
  });

  it('ignores a status that lands after teardown', async () => {
    let resolveStatus: ((value: ConnectionStatus) => void) | undefined;
    getStatus.mockReturnValue(
      new Promise<ConnectionStatus>((resolve) => {
        resolveStatus = resolve;
      }),
    );
    const reported: boolean[] = [];
    const stop = new CapacitorNetworkConnectivity().watch((online) => reported.push(online));
    const beforeTeardown = reported.length;
    stop();
    resolveStatus?.(status(false));
    await Promise.resolve();
    expect(reported).toHaveLength(beforeTeardown);
  });
});
