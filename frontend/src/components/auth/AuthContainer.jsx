/**
 * AuthContainer Component
 * Container component managing auth state and logic
 * Pattern: Container/Presenter
 */
import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts';
import { useForm } from '../../hooks';
import { Card } from '../ui';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

/**
 * Validate login form
 */
function validateLogin(values) {
  const errors = {};

  if (!values.email) {
    errors.email = 'Vui lòng nhập email';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Email không đúng định dạng';
  }

  if (!values.password) {
    errors.password = 'Vui lòng nhập mật khẩu';
  }

  return errors;
}

/**
 * Validate register form
 */
function validateRegister(values) {
  const errors = {};

  if (!values.name) {
    errors.name = 'Vui lòng nhập họ tên';
  } else if (values.name.length < 2) {
    errors.name = 'Họ tên phải có ít nhất 2 ký tự';
  }

  if (!values.email) {
    errors.email = 'Vui lòng nhập email';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Email không đúng định dạng';
  }

  if (!values.password) {
    errors.password = 'Vui lòng nhập mật khẩu';
  } else if (values.password.length < 6) {
    errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Mật khẩu không khớp';
  }

  return errors;
}

export function AuthContainer({ onSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const { login, register } = useAuth();

  // Login form
  const loginForm = useForm(
    { email: '', password: '' },
    async (values) => {
      const result = await login(values);
      const loggedInUser = result?.user;
      onSuccess?.(loggedInUser);
    },
    validateLogin
  );

  // Register form
  const registerForm = useForm(
    { name: '', email: '', password: '', confirmPassword: '' },
    async (values) => {
      await register(values);
      setRegisterSuccess(true);
      setTimeout(() => {
        setMode('login');
        setRegisterSuccess(false);
      }, 2000);
    },
    validateRegister
  );

  const switchMode = useCallback(() => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    loginForm.reset();
    registerForm.reset();
    setRegisterSuccess(false);
  }, [loginForm, registerForm]);

  return (
    <div className="auth-container">
      <Card className="auth-card">
        {mode === 'login' ? (
          <LoginForm
            values={loginForm.values}
            errors={loginForm.errors}
            touched={loginForm.touched}
            loading={loginForm.loading}
            submitError={loginForm.submitError}
            onChange={loginForm.handleChange}
            onBlur={loginForm.handleBlur}
            onSubmit={loginForm.handleSubmit}
            onSwitchMode={switchMode}
          />
        ) : (
          <RegisterForm
            values={registerForm.values}
            errors={registerForm.errors}
            touched={registerForm.touched}
            loading={registerForm.loading}
            submitError={registerForm.submitError}
            success={registerSuccess}
            onChange={registerForm.handleChange}
            onBlur={registerForm.handleBlur}
            onSubmit={registerForm.handleSubmit}
            onSwitchMode={switchMode}
          />
        )}
      </Card>
    </div>
  );
}

export default AuthContainer;
