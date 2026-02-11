import React from 'react';
import { describe, expect, it } from 'vitest';
import { createReactRouteAccess } from '../router/route-access';

describe('createReactRouteAccess', () => {
  it('should wrap import() loader with Suspense lazy element', async () => {
    const result = await createReactRouteAccess({
      staticRoutes: [
        {
          name: 'Demo',
          path: '/demo',
          component: '/Demo',
        },
      ],
      pageMap: {
        '/Demo': () => import('./fixtures/DemoPage'),
      },
      routerComponents: {},
    });

    const route = result.routeObjects[0];
    expect(route).toBeDefined();
    expect(route.path).toBe('/demo');
    expect(React.isValidElement(route.element)).toBe(true);
    expect((route.element as React.ReactElement).type).toBe(React.Suspense);
  });

  it('should keep plain function component as direct element', async () => {
    const PlainPage = () => null;

    const result = await createReactRouteAccess({
      staticRoutes: [
        {
          name: 'Plain',
          path: '/plain',
          component: '/Plain',
        },
      ],
      pageMap: {
        '/Plain': PlainPage,
      },
      routerComponents: {},
    });

    const route = result.routeObjects[0];
    expect(React.isValidElement(route.element)).toBe(true);
    expect((route.element as React.ReactElement).type).toBe(PlainPage);
  });
});
