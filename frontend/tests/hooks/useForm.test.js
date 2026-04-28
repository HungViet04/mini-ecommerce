/**
 * useForm Hook Tests
 * Tests for form state management hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from '../../src/hooks/useForm';

describe('useForm', () => {
  const initialValues = {
    email: '',
    password: '',
    name: '',
  };

  const mockSubmit = vi.fn();
  const mockValidate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidate.mockReturnValue({});
  });

  describe('Initial state', () => {
    it('should initialize with provided values', () => {
      const { result } = renderHook(() => useForm(initialValues, mockSubmit, mockValidate));

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.loading).toBe(false);
      expect(result.current.submitError).toBeNull();
    });

    it('should initialize with empty object if no initial values', () => {
      const { result } = renderHook(() => useForm(undefined, mockSubmit, mockValidate));

      expect(result.current.values).toEqual({});
    });
  });

  describe('handleChange', () => {
    it('should update value on change', () => {
      const { result } = renderHook(() => useForm(initialValues, mockSubmit, mockValidate));

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'test@example.com', type: 'text' },
        });
      });

      expect(result.current.values.email).toBe('test@example.com');
    });

    it('should handle checkbox inputs', () => {
      const { result } = renderHook(() => useForm({ remember: false }, mockSubmit, mockValidate));

      act(() => {
        result.current.handleChange({
          target: { name: 'remember', checked: true, type: 'checkbox' },
        });
      });

      expect(result.current.values.remember).toBe(true);
    });

    it('should clear error when field changes', () => {
      const { result } = renderHook(() => useForm(initialValues, mockSubmit, mockValidate));

      // Set an error first
      act(() => {
        result.current.setFieldError('email', 'Invalid email');
      });

      expect(result.current.errors.email).toBe('Invalid email');

      // Change the field
      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'new@example.com', type: 'text' },
        });
      });

      expect(result.current.errors.email).toBeUndefined();
    });
  });

  describe('handleBlur', () => {
    it('should mark field as touched on blur', () => {
      const { result } = renderHook(() => useForm(initialValues, mockSubmit, mockValidate));

      act(() => {
        result.current.handleBlur({
          target: { name: 'email' },
        });
      });

      expect(result.current.touched.email).toBe(true);
    });

    it('should validate on blur if validate function provided', () => {
      mockValidate.mockReturnValue({ email: 'Email is required' });

      const { result } = renderHook(() => useForm(initialValues, mockSubmit, mockValidate));

      act(() => {
        result.current.handleBlur({
          target: { name: 'email' },
        });
      });

      expect(mockValidate).toHaveBeenCalledWith(initialValues);
      expect(result.current.errors.email).toBe('Email is required');
    });
  });

  describe('setFieldValue', () => {
    it('should set specific field value', () => {
      const { result } = renderHook(() => useForm(initialValues, mockSubmit, mockValidate));

      act(() => {
        result.current.setFieldValue('email', 'set@example.com');
      });

      expect(result.current.values.email).toBe('set@example.com');
    });
  });

  describe('setFieldError', () => {
    it('should set specific field error', () => {
      const { result } = renderHook(() => useForm(initialValues, mockSubmit, mockValidate));

      act(() => {
        result.current.setFieldError('email', 'Custom error');
      });

      expect(result.current.errors.email).toBe('Custom error');
    });
  });

  describe('handleSubmit', () => {
    it('should call onSubmit with values', async () => {
      mockSubmit.mockResolvedValue({});
      mockValidate.mockReturnValue({});

      const { result } = renderHook(() =>
        useForm({ email: 'test@example.com' }, mockSubmit, mockValidate)
      );

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      expect(mockSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should prevent default form submission', async () => {
      const preventDefault = vi.fn();
      mockSubmit.mockResolvedValue({});

      const { result } = renderHook(() => useForm(initialValues, mockSubmit, mockValidate));

      await act(async () => {
        await result.current.handleSubmit({ preventDefault });
      });

      expect(preventDefault).toHaveBeenCalled();
    });

    it('should not submit if validation fails', async () => {
      mockValidate.mockReturnValue({ email: 'Email is required' });

      const { result } = renderHook(() => useForm(initialValues, mockSubmit, mockValidate));

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      expect(mockSubmit).not.toHaveBeenCalled();
      expect(result.current.errors).toEqual({ email: 'Email is required' });
    });

    it('should set loading state during submission', async () => {
      let resolveSubmit;
      mockSubmit.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSubmit = resolve;
          })
      );

      const { result } = renderHook(() =>
        useForm({ email: 'test@example.com' }, mockSubmit, mockValidate)
      );

      let submitPromise;
      act(() => {
        submitPromise = result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveSubmit();
        await submitPromise;
      });

      expect(result.current.loading).toBe(false);
    });

    it('should set submitError on submission failure', async () => {
      mockSubmit.mockRejectedValue(new Error('Submit failed'));

      const { result } = renderHook(() =>
        useForm({ email: 'test@example.com' }, mockSubmit, mockValidate)
      );

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      expect(result.current.submitError).toBe('Submit failed');
      expect(result.current.loading).toBe(false);
    });

    it('should mark all fields as touched on validation failure', async () => {
      mockValidate.mockReturnValue({ email: 'Required', password: 'Required' });

      const { result } = renderHook(() => useForm(initialValues, mockSubmit, mockValidate));

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      expect(result.current.touched).toEqual({
        email: true,
        password: true,
        name: true,
      });
    });
  });

  describe('reset', () => {
    it('should reset form to initial values', () => {
      const { result } = renderHook(() => useForm(initialValues, mockSubmit, mockValidate));

      // Modify form state
      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'changed@example.com', type: 'text' },
        });
        result.current.setFieldError('password', 'Error');
        result.current.handleBlur({ target: { name: 'name' } });
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.submitError).toBeNull();
    });
  });

  describe('Form helpers', () => {
    it('should provide isValid helper', () => {
      const { result } = renderHook(() => useForm(initialValues, mockSubmit, mockValidate));

      // No errors = valid
      expect(Object.keys(result.current.errors).length).toBe(0);

      // Add error
      act(() => {
        result.current.setFieldError('email', 'Invalid');
      });

      expect(Object.keys(result.current.errors).length).toBe(1);
    });

    it('should handle form without validation function', async () => {
      mockSubmit.mockResolvedValue({});

      const { result } = renderHook(() => useForm({ email: 'test@example.com' }, mockSubmit));

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() });
      });

      expect(mockSubmit).toHaveBeenCalled();
    });
  });
});
