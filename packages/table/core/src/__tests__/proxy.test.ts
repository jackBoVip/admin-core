import { describe, expect, it, vi } from 'vitest';
import { extendProxyOptions } from '../proxy';

describe('extendProxyOptions', () => {
  it('should merge form values to ajax query custom values', async () => {
    const query = vi.fn((_params, values) => values);

    const options = extendProxyOptions(
      {
        proxyConfig: {
          ajax: {
            query,
          },
        },
      },
      () => ({ keyword: 'admin' })
    );

    const result = await options.proxyConfig.ajax.query(
      { page: 1 },
      { status: 'enabled' }
    );

    expect(result).toEqual({ keyword: 'admin', status: 'enabled' });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('should ignore event-like custom values', async () => {
    const query = vi.fn((_params, values) => values);

    const options = extendProxyOptions(
      {
        proxyConfig: {
          ajax: {
            query,
          },
        },
      },
      () => ({ keyword: 'table' })
    );

    const eventLike = {
      preventDefault() {},
      stopPropagation() {},
    };

    const result = await options.proxyConfig.ajax.query({ page: 1 }, eventLike);

    expect(result).toEqual({ keyword: 'table' });
  });

  it('should keep form values as final priority on key conflict', async () => {
    const query = vi.fn((_params, values) => values);

    const options = extendProxyOptions(
      {
        proxyConfig: {
          ajax: {
            query,
          },
        },
      },
      () => ({ pageSize: 20, keyword: 'from-form' })
    );

    const result = await options.proxyConfig.ajax.query(
      { page: 1 },
      { keyword: 'from-custom', status: 'enabled' }
    );

    expect(result).toEqual({
      keyword: 'from-form',
      pageSize: 20,
      status: 'enabled',
    });
  });
});
