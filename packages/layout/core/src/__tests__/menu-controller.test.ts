import { describe, expect, it } from 'vitest';
import {
  buildActiveParentSet,
  buildMenuParentPathMap,
  computeBaseVisibleMenus,
  computeOpenedMenusOnClose,
  computeOpenedMenusOnCollapseChange,
  computeOpenedMenusOnOpen,
  computeOverflowMenus,
  getMenuRootClassName,
  isMenuPopup,
} from '../utils/menu-controller';
import type { MenuItem } from '../types';

const menus: MenuItem[] = [
  {
    key: 'root',
    name: 'Root',
    path: '/root',
    children: [
      {
        key: 'child-a',
        name: 'ChildA',
        path: '/root/a',
        children: [
          {
            key: 'leaf',
            name: 'Leaf',
            path: '/root/a/leaf',
          },
        ],
      },
      {
        name: 'ChildB',
        path: '/root/b',
      },
    ],
  },
  {
    key: 'reports',
    name: 'Reports',
    path: '/reports',
  },
];

describe('menu-controller helpers', () => {
  it('buildMenuParentPathMap should build parent map for key/path/id', () => {
    const map = buildMenuParentPathMap(menus);
    expect(map.get('root')).toBeNull();
    expect(map.get('/root')).toBeNull();
    expect(map.get('child-a')).toBe('root');
    expect(map.get('/root/a')).toBe('root');
    expect(map.get('leaf')).toBe('child-a');
    expect(map.get('/root/a/leaf')).toBe('child-a');
    expect(map.get('/root/b')).toBe('root');
  });

  it('buildActiveParentSet should resolve full parent chain and avoid infinite loops', () => {
    const map = buildMenuParentPathMap(menus);
    const set = buildActiveParentSet('leaf', map);
    expect(set.has('child-a')).toBe(true);
    expect(set.has('root')).toBe(true);

    const cycle = new Map<string, string | null>([
      ['a', 'b'],
      ['b', 'a'],
    ]);
    const cycleSet = buildActiveParentSet('a', cycle);
    expect(cycleSet.has('a')).toBe(true);
    expect(cycleSet.has('b')).toBe(true);
  });

  it('computeOpenedMenusOnOpen should respect accordion mode', () => {
    const rootAccordion = computeOpenedMenusOnOpen(['reports'], 'root', {
      accordion: true,
      parentPaths: [],
    });
    expect(rootAccordion).toEqual(['root']);

    const branchAccordion = computeOpenedMenusOnOpen(
      ['reports', 'root', 'root:child-a'],
      'root:child-b',
      {
        accordion: true,
        parentPaths: ['root'],
      }
    );
    expect(branchAccordion).toEqual(['root', 'root:child-a', 'root:child-b']);

    const noAccordion = computeOpenedMenusOnOpen(['reports'], 'root', {
      accordion: false,
    });
    expect(noAccordion).toEqual(['reports', 'root']);
  });

  it('computeOpenedMenusOnOpen/Close should be idempotent for no-op cases', () => {
    const opened = ['root'];
    const sameOnOpen = computeOpenedMenusOnOpen(opened, 'root');
    expect(sameOnOpen).toBe(opened);

    const sameOnClose = computeOpenedMenusOnClose(opened, 'missing');
    expect(sameOnClose).toBe(opened);
  });

  it('collapse change should clear opened menus only when collapsing', () => {
    expect(computeOpenedMenusOnCollapseChange(['a', 'b'], true)).toEqual([]);
    const opened: string[] = ['a'];
    expect(computeOpenedMenusOnCollapseChange(opened, false)).toBe(opened);
    const empty: string[] = [];
    expect(computeOpenedMenusOnCollapseChange(empty, true)).toBe(empty);
  });

  it('popup/visible/overflow/class helpers should work', () => {
    expect(isMenuPopup('horizontal', false)).toBe(true);
    expect(isMenuPopup('vertical', true)).toBe(true);
    expect(isMenuPopup('vertical', false)).toBe(false);

    expect(
      computeBaseVisibleMenus({
        menus,
        mode: 'horizontal',
        sliceIndex: 1,
        renderCount: 99,
      })
    ).toEqual([menus[0]]);
    expect(
      computeBaseVisibleMenus({
        menus,
        mode: 'horizontal',
        sliceIndex: -1,
        renderCount: 99,
      })
    ).toEqual(menus);
    expect(
      computeBaseVisibleMenus({
        menus,
        mode: 'vertical',
        sliceIndex: -1,
        renderCount: 1,
      })
    ).toEqual([menus[0]]);

    expect(
      computeOverflowMenus({
        menus,
        mode: 'horizontal',
        sliceIndex: 1,
      })
    ).toEqual([menus[1]]);
    expect(
      computeOverflowMenus({
        menus,
        mode: 'vertical',
        sliceIndex: 1,
      })
    ).toEqual([]);

    const className = getMenuRootClassName({
      mode: 'vertical',
      theme: 'dark',
      collapse: true,
      rounded: true,
    });
    expect(className).toContain('menu--vertical');
    expect(className).toContain('menu--dark');
    expect(className).toContain('menu--collapse');
    expect(className).toContain('menu--rounded');
  });
});
