/**
 * useForm Hook
 * Generic form state management
 * Pattern: Custom Hooks
 */
import { useState, useCallback } from 'react';

/**
 * Hook for form state management
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Submit handler
 * @param {Function} validate - Validation function
 * @returns {Object}
 */
export function useForm(initialValues = {}, onSubmit, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Handle input change
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setValues((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));

      // Clear error on change
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Handle blur
  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      // Validate all fields on blur (fix cross-field error UX)
      if (validate) {
        const validationErrors = validate(values);
        setErrors(validationErrors);
      }
    },
    [values, validate]
  );

  // Set single field value
  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Set single field error
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  // Handle form submit
  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      setSubmitError(null);

      // Validate all fields
      if (validate) {
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          // Mark all fields as touched
          setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
          return;
        }
      }

      setLoading(true);

      try {
        await onSubmit(values);
      } catch (err) {
        setSubmitError(err.message || 'Submit failed');
      } finally {
        setLoading(false);
      }
    },
    [values, validate, onSubmit]
  );

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitError(null);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    loading,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}

export default useForm;
