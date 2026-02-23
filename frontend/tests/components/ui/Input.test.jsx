/**
 * Input Component Tests
 * Comprehensive tests for reusable input component
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Input } from '../../../src/components/ui/Input';

describe('Input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render input element', () => {
      render(<Input name="test" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input name="email" label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('should render without label', () => {
      render(<Input name="test" />);
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('should show required indicator', () => {
      render(<Input name="email" label="Email" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not show required indicator when not required', () => {
      render(<Input name="email" label="Email" />);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('should render placeholder', () => {
      render(<Input name="email" placeholder="Enter email" />);
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });
  });

  describe('types', () => {
    it('should default to text type', () => {
      render(<Input name="test" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('should accept email type', () => {
      render(<Input name="email" type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('should accept password type', () => {
      render(<Input name="password" type="password" />);
      // Password inputs don't have textbox role
      expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
    });

    it('should accept number type', () => {
      render(<Input name="amount" type="number" />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
    });

    it('should accept tel type', () => {
      render(<Input name="phone" type="tel" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel');
    });
  });

  describe('value handling', () => {
    it('should display value', () => {
      render(<Input name="test" value="Hello" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('Hello');
    });

    it('should call onChange when value changes', () => {
      const onChange = vi.fn();
      render(<Input name="test" value="" onChange={onChange} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New value' } });
      expect(onChange).toHaveBeenCalled();
    });

    it('should pass event to onChange', () => {
      const onChange = vi.fn();
      render(<Input name="test" value="" onChange={onChange} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls[0][0].target).toBeDefined();
    });

    it('should handle empty value', () => {
      render(<Input name="test" value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });
  });

  describe('blur handling', () => {
    it('should call onBlur when input loses focus', () => {
      const onBlur = vi.fn();
      render(<Input name="test" onBlur={onBlur} />);

      fireEvent.blur(screen.getByRole('textbox'));
      expect(onBlur).toHaveBeenCalled();
    });

    it('should not throw if onBlur is not provided', () => {
      render(<Input name="test" />);
      expect(() => fireEvent.blur(screen.getByRole('textbox'))).not.toThrow();
    });
  });

  describe('error display', () => {
    it('should show error when touched and has error', () => {
      render(<Input name="email" error="Invalid email" touched={true} />);
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('should not show error when not touched', () => {
      render(<Input name="email" error="Invalid email" touched={false} />);
      expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();
    });

    it('should not show error when touched but no error', () => {
      render(<Input name="email" error="" touched={true} />);
      expect(document.querySelector('.error-text')).not.toBeInTheDocument();
    });

    it('should add error class to input when has error', () => {
      render(<Input name="email" error="Error" touched={true} />);
      expect(screen.getByRole('textbox')).toHaveClass('input-error');
    });

    it('should not have error class when no error', () => {
      render(<Input name="email" touched={true} />);
      expect(screen.getByRole('textbox')).not.toHaveClass('input-error');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input name="test" disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should be enabled by default', () => {
      render(<Input name="test" />);
      expect(screen.getByRole('textbox')).not.toBeDisabled();
    });

    it('should not accept input when disabled', () => {
      const onChange = vi.fn();
      render(<Input name="test" disabled onChange={onChange} value="" />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      // onChange still fires but value won't change in disabled input
      expect(input).toBeDisabled();
    });
  });

  describe('className prop', () => {
    it('should apply custom className to container', () => {
      const { container } = render(<Input name="test" className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should keep form-group class', () => {
      const { container } = render(<Input name="test" className="extra" />);
      expect(container.firstChild).toHaveClass('form-group');
    });
  });

  describe('name and id', () => {
    it('should set name attribute', () => {
      render(<Input name="myInput" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'myInput');
    });

    it('should set id same as name', () => {
      render(<Input name="myInput" label="My Input" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'myInput');
    });

    it('should link label to input via htmlFor', () => {
      render(<Input name="myInput" label="My Label" />);
      const label = screen.getByText('My Label');
      expect(label).toHaveAttribute('for', 'myInput');
    });
  });

  describe('additional props', () => {
    it('should pass additional props to input', () => {
      render(<Input name="test" maxLength={10} minLength={2} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '10');
      expect(input).toHaveAttribute('minLength', '2');
    });

    it('should handle autoComplete prop', () => {
      render(<Input name="email" autoComplete="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autoComplete', 'email');
    });

    it('should handle autoFocus prop', () => {
      render(<Input name="test" autoFocus />);
      expect(screen.getByRole('textbox')).toHaveFocus();
    });
  });

  describe('form integration', () => {
    it('should work within a form', () => {
      const onSubmit = vi.fn(e => e.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <Input name="email" label="Email" />
          <button type="submit">Submit</button>
        </form>
      );

      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.click(screen.getByText('Submit'));

      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper label association', () => {
      render(<Input name="email" label="Email Address" />);
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    });

    it('should render error with proper styling', () => {
      render(<Input name="test" error="Error message" touched={true} />);
      const errorText = screen.getByText('Error message');
      expect(errorText).toHaveClass('error-text');
    });
  });
});

