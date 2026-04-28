/**
 * useRequest Hook Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRequest } from '../../src/hooks/useRequest';

describe('useRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with initial data', () => {
    const { result } = renderHook(() => useRequest(vi.fn(), { initialData: [] }));

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should execute request and set data', async () => {
    const requestFn = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useRequest(requestFn));

    await act(async () => {
      await result.current.execute('arg1');
    });

    expect(requestFn).toHaveBeenCalledWith('arg1');
    expect(result.current.data).toEqual({ ok: true });
    expect(result.current.loading).toBe(false);
  });

  it('should set error on request failure', async () => {
    const requestFn = vi.fn().mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useRequest(requestFn));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        expect(error.message).toBe('Failed');
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed');
      expect(result.current.loading).toBe(false);
    });
  });

  it('should auto fetch when enabled', async () => {
    const requestFn = vi.fn().mockResolvedValue('ok');
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useRequest(requestFn, {
        autoFetch: true,
        onSuccess,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(requestFn).toHaveBeenCalled();
    expect(result.current.data).toBe('ok');
    expect(onSuccess).toHaveBeenCalledWith('ok');
  });

  it('should reset state', async () => {
    const requestFn = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useRequest(requestFn, { initialData: null }));

    await act(async () => {
      await result.current.execute();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
