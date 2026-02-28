# @admin-core/build-config

Shared build/test config helpers for this monorepo.

## Exports

- `./vite`: `resolveDtsPlugin(options)`, `createCdnLibraryConfig(options)`, `createLibraryViteConfig(options)`
- `./vitest`: `createCoreVitestConfig(config?)`, `createDomVitestConfig(config?)`
- `./tsup`: `createCoreLibraryTsupConfig(options)`
- `./copy`: `copyFiles(entries, options?)`
- `./eslint`: `createCorePackageEslintConfig(options?)`, `createReactPackageEslintConfig(options?)`, `createVuePackageEslintConfig(options?)`

`createCoreLibraryTsupConfig(options)` supports `copyEntries`:

- type: `Array<{ from: string; to: string; optional?: boolean }>`
- behavior: after ESM/CJS build, auto copy matched files into `dist` (replace per-package `postbuild` copy scripts)

## Prebuilt Config Entrypoints

- `configs/eslint/*`:
  - `core.config.js`
  - `core-disable-import-order.config.js`
  - `react-disable-import-order.config.js`
  - `vue-disable-import-order.config.js`
  - `layout-core.config.js`
  - `layout-react.config.js`
  - `layout-vue.config.js`
  - `preferences-react.config.js`
  - `preferences-vue.config.js`
- `configs/vitest/*`:
  - `core.config.ts`
  - `dom.config.ts`
  - `layout-core.config.ts`
  - `page-react.config.ts`

These files are referenced by package scripts via `eslint -c` and `vitest -c` to avoid duplicated per-package config files.
