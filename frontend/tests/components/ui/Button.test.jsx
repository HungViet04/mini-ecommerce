/**
 * Button Component Tests
 * Comprehensive tests for reusable button component
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Button } from '../../../src/components/ui/Button';

describe('Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Click Me');
    });

    it('should render children correctly', () => {
      render(
        <Button>
          <span>Icon</span> Text
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should have default type of button', () => {
      render(<Button>Test</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('should accept type prop', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('variants', () => {
    it('should apply primary variant class by default', () => {
      render(<Button>Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });

    it('should apply secondary variant class', () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-secondary');
    });

    it('should apply ghost variant class', () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-ghost');
    });

    it('should apply danger variant class', () => {
      render(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-danger');
    });

    it('should always have btn base class', () => {
      render(<Button variant="secondary">Test</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn');
    });
  });

  describe('sizes', () => {
    it('should apply medium size by default', () => {
      render(<Button>Medium</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-md');
    });

    it('should apply small size', () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-sm');
    });

    it('should apply large size', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-lg');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should be enabled by default', () => {
      render(<Button>Enabled</Button>);
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should not trigger onClick when disabled', () => {
      const onClick = vi.fn();
      render(
        <Button disabled onClick={onClick}>
          Disabled
        </Button>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should be disabled when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show spinner when loading', () => {
      render(<Button loading>Submit</Button>);
      expect(screen.getByRole('button').querySelector('.spinner')).toBeInTheDocument();
    });

    it('should hide children when loading', () => {
      render(<Button loading>Submit Text</Button>);
      expect(screen.queryByText('Submit Text')).not.toBeInTheDocument();
    });

    it('should add loading class when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-loading');
    });

    it('should not trigger onClick when loading', () => {
      const onClick = vi.fn();
      render(
        <Button loading onClick={onClick}>
          Loading
        </Button>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('click handling', () => {
    it('should call onClick when clicked', () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should pass event to onClick', () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click</Button>);

      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle multiple clicks', () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click</Button>);

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('className prop', () => {
    it('should append custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should keep base classes with custom className', () => {
      render(
        <Button className="custom" variant="primary">
          Test
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn');
      expect(button).toHaveClass('btn-primary');
      expect(button).toHaveClass('custom');
    });

    it('should handle empty className', () => {
      render(<Button className="">Empty</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn');
    });
  });

  describe('additional props', () => {
    it('should pass additional props to button', () => {
      render(
        <Button data-testid="custom-btn" aria-label="Custom">
          Props
        </Button>
      );

      expect(screen.getByTestId('custom-btn')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom');
    });

    it('should handle id prop', () => {
      render(<Button id="my-button">ID Button</Button>);
      expect(document.getElementById('my-button')).toBeInTheDocument();
    });
  });

  describe('combined states', () => {
    it('should be disabled when both disabled and loading', () => {
      render(
        <Button disabled loading>
          Both
        </Button>
      );
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should combine variant and size classes', () => {
      render(
        <Button variant="danger" size="lg">
          Danger Large
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-danger');
      expect(button).toHaveClass('btn-lg');
    });

    it('should combine all classes correctly', () => {
      render(
        <Button variant="secondary" size="sm" loading className="extra">
          All
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn');
      expect(button).toHaveClass('btn-secondary');
      expect(button).toHaveClass('btn-sm');
      expect(button).toHaveClass('btn-loading');
      expect(button).toHaveClass('extra');
    });
  });
});
