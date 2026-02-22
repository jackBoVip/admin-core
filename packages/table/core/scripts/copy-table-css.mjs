import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const styleFiles = [
  'table.css',
  'vxe-iconfont.css',
  'vxe-table-icon.woff2',
];

styleFiles.forEach((file) => {
  const source = `src/styles/${file}`;
  const target = `dist/styles/${file}`;

  if (!existsSync(source)) {
    return;
  }

  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
});
