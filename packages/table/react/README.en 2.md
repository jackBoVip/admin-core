# @admin-core/table-react

English | [简体中文](./README.md)

React adapter layer for `@admin-core/table-core`, powered by `antd` Table and built-in search-form integration via `@admin-core/form-react`.

## Public API

- `setupAdminTableReact(options)`: initialize global config and built-in renderers
- `useAdminTable(options)`: returns `[Table, tableApi]`
- `AdminTable`: direct component usage
- Re-exports core types and helpers

## Legacy Migration Map

### API Mapping

| Legacy API | New API |
| --- | --- |
| `legacySetupVxeTable` | `setupAdminTableReact` |
| `legacyUseVxeGrid(options)` | `useAdminTable(options)` |
| `use-vxe-grid.vue` | `AdminTable` (React semantic-equivalent implementation) |

### Example Mapping (React)

| Legacy example | New demo file |
| --- | --- |
| `basic` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/Basic.tsx` |
| `remote` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/Remote.tsx` |
| `form` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/Form.tsx` |
| `tree` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/Tree.tsx` |
| `fixed` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/Fixed.tsx` |
| `custom-cell` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/CustomCell.tsx` |
| `edit-cell` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/EditCell.tsx` |
| `edit-row` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/EditRow.tsx` |
| `virtual` | `/Users/zhouhongbo/Documents/workspace/admin-core/examples/react-demo/src/pages/components/table/Virtual.tsx` |

## Install

```bash
pnpm add @admin-core/table-react antd
```

## Column Custom Persistence (Browser)

Enable built-in browser persistence with `gridOptions.columnCustomPersistence` (defaults to `localStorage`):

```ts
const [Table] = useAdminTable({
  gridEvents: {
    columnCustomChange: ({ action, snapshot }) => {
      if (action === 'confirm' || action === 'reset') {
        // Optional: sync to backend
        void saveColumnState(snapshot);
      }
    },
  },
  gridOptions: {
    columnCustomPersistence: {
      key: 'demo:table:basic',
      storage: 'local', // local | session
    },
    toolbarConfig: {
      custom: true,
    },
  },
});
```

## Preferences Integration

- `setupAdminTableReact` subscribes to the default `@admin-core/preferences` store by default (`bindPreferences: true`).
- Locale automatically follows `preferences.app.locale` (`zh-CN/en-US`).
- Theme styling follows preferences CSS variables. It is recommended to import `@admin-core/preferences/styles/antd`.
- If your app does not initialize preferences, disable this behavior explicitly: `setupAdminTableReact({ bindPreferences: false })`.

## Combine with Form/Layout (Avoid Duplicate Styles)

Use a single app-level style entry when combining packages:

```css
@import "@admin-core/preferences/styles/antd";
@import "@admin-core/layout-react/style.css";
@import "@admin-core/form-react/style.css";
@import "@admin-core/table-react/style.css";
```

- `@admin-core/table-react/style.css` already includes `antd/dist/reset.css`; do not import it again.
- `@admin-core/layout-react/style.css` already includes `tailwindcss`; do not import it again.
