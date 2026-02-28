import { describe, expect, it, vi } from 'vitest';
import {
  createFormAdapterBridge,
  createFormAdapterRegistry,
  createNativeAdapter,
} from '../adapter';

describe('form adapter registry', () => {
  it('should resolve explicit component first', () => {
    const registry = createFormAdapterRegistry({
      nativeAdapter: createNativeAdapter({
        input: 'native-input',
      }),
    });
    const resolved = registry.resolveComponent({
      key: 'input',
      explicitComponent: { name: 'custom-input' },
    });
    expect(resolved?.source).toBe('explicit');
  });

  it('should resolve active library before native fallback', () => {
    const registry = createFormAdapterRegistry<string>({
      activeLibrary: 'antd',
      nativeAdapter: createNativeAdapter({
        input: 'native-input',
      }),
      libraries: {
        antd: {
          version: 1,
          name: 'antd',
          capabilities: { customModelProp: true },
          components: {
            input: 'antd-input',
          },
        },
      },
    });

    const resolved = registry.resolveComponent({ key: 'input' });
    expect(resolved?.component).toBe('antd-input');
    expect(resolved?.source).toBe('library');
    expect(resolved?.library).toBe('antd');
  });

  it('should fallback to native component when library key missing', () => {
    const registry = createFormAdapterRegistry<string>({
      activeLibrary: 'antd',
      nativeAdapter: createNativeAdapter({
        input: 'native-input',
      }),
      libraries: {
        antd: {
          version: 1,
          name: 'antd',
          capabilities: {},
          components: {},
        },
      },
    });
    const resolved = registry.resolveComponent({ key: 'input' });
    expect(resolved?.source).toBe('native');
    expect(resolved?.component).toBe('native-input');
  });

  it('should fallback to native when library lacks required capability', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const registry = createFormAdapterRegistry<string>({
        activeLibrary: 'mini-ui',
        nativeAdapter: createNativeAdapter({
          'date-range': 'native-range',
        }),
        libraries: {
          'mini-ui': {
            version: 1,
            name: 'mini-ui',
            capabilities: {
              dateRange: false,
            },
            components: {
              'date-range': 'mini-range',
            },
          },
        },
      });

      const resolved = registry.resolveComponent({ key: 'date-range' });
      expect(resolved?.source).toBe('native');
      expect(resolved?.component).toBe('native-range');
      expect(warnSpy).toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('should expose setup/register flow through adapter bridge', () => {
    const bridge = createFormAdapterBridge<string>({
      nativeComponents: {
        input: 'native-input',
      },
    });

    bridge.setup({
      library: 'demo',
      libraries: {
        demo: {
          components: {
            input: 'demo-input',
          },
        },
      },
    });

    const resolvedFromLibrary = bridge.registry.resolveComponent({ key: 'input' });
    expect(resolvedFromLibrary?.component).toBe('demo-input');

    bridge.register(
      {
        select: 'custom-select',
      },
      { library: 'custom' }
    );
    bridge.registry.setActiveLibrary('custom');
    const resolvedFromRegistered = bridge.registry.resolveComponent({ key: 'select' });
    expect(resolvedFromRegistered?.component).toBe('custom-select');
  });

  it('should apply default base model prop in adapter bridge', () => {
    const bridge = createFormAdapterBridge<string>({
      defaultBaseModelPropName: 'value',
      nativeComponents: {
        input: 'native-input',
      },
    });

    const nativeResolved = bridge.registry.resolveComponent({ key: 'input' });
    expect(nativeResolved?.modelPropName).toBe('value');

    bridge.setup({
      libraries: {
        demo: {
          components: {
            input: 'demo-input',
          },
        },
      },
      library: 'demo',
    });
    const libraryResolved = bridge.registry.resolveComponent({ key: 'input' });
    expect(libraryResolved?.modelPropName).toBe('value');
  });
});
