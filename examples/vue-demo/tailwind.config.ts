import type { Config } from 'tailwindcss';
import { sharedTailwindConfig } from '../shared/tailwind.config.base';

export default {
  ...sharedTailwindConfig,
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,vue,html}'],
} satisfies Config;
