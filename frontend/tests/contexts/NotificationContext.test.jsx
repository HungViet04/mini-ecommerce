/**
 * NotificationContext Tests
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NotificationProvider, useNotification } from '../../src/contexts/NotificationContext';

vi.mock('react-hot-toast', () => {
  const toastFn = vi.fn();
  toastFn.success = vi.fn();
  toastFn.error = vi.fn();
  return {
    Toaster: () => <div data-testid="toaster" />,
    toast: toastFn,
  };
});

import { toast } from 'react-hot-toast';

const wrapper = ({ children }) => <NotificationProvider>{children}</NotificationProvider>;

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call success toast with min duration', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.notifyToast('Saved', { type: 'success', duration: 1000 });
    });

    expect(toast.success).toHaveBeenCalledWith('Saved', { duration: 3000 });
  });

  it('should call error toast', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.notifyToast('Failed', { type: 'error', duration: 4500 });
    });

    expect(toast.error).toHaveBeenCalledWith('Failed', { duration: 4500 });
  });

  it('should call default toast for info', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.notifyToast('Hello');
    });

    expect(toast).toHaveBeenCalledWith('Hello', { duration: 4000 });
  });

  it('should support notify alias', () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    act(() => {
      result.current.notify('Alias');
    });

    expect(toast).toHaveBeenCalledWith('Alias', { duration: 4000 });
  });
});
