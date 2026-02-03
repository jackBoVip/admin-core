import { describe, expect, it, vi } from 'vitest';
import renderer from 'react-test-renderer';
import { ErrorBoundary } from '../components/ErrorBoundary';

const Boom = () => {
  throw new Error('boom');
};

describe('ErrorBoundary', () => {
  it('renders fallback when child throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const tree = renderer.create(
      <ErrorBoundary fallback={<div>fallback</div>}>
        <Boom />
      </ErrorBoundary>
    );

    expect(tree.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['fallback'],
    });

    consoleError.mockRestore();
  });

  it('resets when resetKey changes', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const tree = renderer.create(
      <ErrorBoundary resetKey="a" fallback={<span>fallback</span>}>
        <Boom />
      </ErrorBoundary>
    );

    expect(tree.toJSON()).toEqual({
      type: 'span',
      props: {},
      children: ['fallback'],
    });

    tree.update(
      <ErrorBoundary resetKey="b" fallback={<span>fallback</span>}>
        <div>ok</div>
      </ErrorBoundary>
    );

    expect(tree.toJSON()).toEqual({
      type: 'div',
      props: {},
      children: ['ok'],
    });

    consoleError.mockRestore();
  });
});
