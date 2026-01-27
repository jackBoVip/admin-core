<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  usePreferences,
  useTheme,
  PreferencesDrawer,
} from '@admin-core/preferences-vue';
import {
  BUILT_IN_THEME_PRESETS,
  LAYOUT_OPTIONS,
  translateOptions,
  zhCN,
  enUS,
  type ThemeModeType,
  type BuiltinThemeType,
  type LayoutType,
  type LocaleMessages,
} from '@admin-core/preferences';

const { preferences, setPreferences, resetPreferences } = usePreferences();
const { actualThemeMode } = useTheme();

// 单独的抽屉状态
const drawerOpen = ref(false);

// 主题模式选项
const themeModeOptions = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '跟随系统', value: 'auto' },
];

// 圆角选项
const radiusOptions = ['0', '0.25', '0.5', '0.75', '1'];

// 国际化
const locale = computed(() => {
  return preferences.value?.app.locale === 'en-US' ? enUS : zhCN;
});

// 布局选项（翻译后）
const layoutOptions = computed(() =>
  translateOptions(LAYOUT_OPTIONS, locale.value as LocaleMessages)
);

// JSON 预览
const preferencesJson = computed(() => {
  return JSON.stringify(preferences.value, null, 2);
});

// 复制配置
const copyConfig = async () => {
  try {
    await navigator.clipboard.writeText(preferencesJson.value);
    alert('配置已复制到剪贴板');
  } catch {
    console.error('复制失败');
  }
};

// 重置配置
const handleReset = () => {
  if (confirm('确定要重置所有配置吗？')) {
    resetPreferences();
  }
};
</script>

<template>
  <div>
    <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 24px; color: var(--foreground);">
      设置演示
    </h1>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      <!-- 左侧：快捷设置 -->
      <div>
        <!-- 主题模式 -->
        <div class="card" style="margin-bottom: 16px;">
          <h2 class="card-title">主题模式</h2>
          <div style="display: flex; gap: 8px;">
            <button
              v-for="opt in themeModeOptions"
              :key="opt.value"
              class="btn"
              :class="preferences?.theme.mode === opt.value ? 'btn-primary' : 'btn-secondary'"
              @click="setPreferences({ theme: { mode: opt.value as ThemeModeType } })"
            >
              {{ opt.label }}
            </button>
          </div>
          <p style="margin-top: 12px; font-size: 12px; color: var(--muted-foreground);">
            当前实际模式: {{ actualThemeMode }}
          </p>
        </div>

        <!-- 主题预设 -->
        <div class="card" style="margin-bottom: 16px;">
          <h2 class="card-title">主题预设</h2>
          <div class="color-palette">
            <div
              v-for="preset in BUILT_IN_THEME_PRESETS.filter(p => p.type !== 'custom')"
              :key="preset.type"
              class="color-swatch"
              :style="{
                backgroundColor: preset.color,
                cursor: 'pointer',
                border: preferences?.theme.builtinType === preset.type ? '3px solid var(--foreground)' : 'none',
              }"
              @click="setPreferences({ theme: { builtinType: preset.type as BuiltinThemeType } })"
              :title="preset.type"
            />
          </div>
        </div>

        <!-- 圆角大小 -->
        <div class="card" style="margin-bottom: 16px;">
          <h2 class="card-title">圆角大小</h2>
          <div style="display: flex; gap: 8px;">
            <button
              v-for="r in radiusOptions"
              :key="r"
              class="btn"
              :class="preferences?.theme.radius === r ? 'btn-primary' : 'btn-secondary'"
              @click="setPreferences({ theme: { radius: r } })"
            >
              {{ r }}rem
            </button>
          </div>
        </div>

        <!-- 布局选择 -->
        <div class="card" style="margin-bottom: 16px;">
          <h2 class="card-title">布局类型</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <button
              v-for="opt in layoutOptions"
              :key="opt.value"
              class="btn"
              :class="preferences?.app.layout === opt.value ? 'btn-primary' : 'btn-secondary'"
              @click="setPreferences({ app: { layout: opt.value as LayoutType } })"
              style="font-size: 12px;"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 快捷开关 -->
        <div class="card">
          <h2 class="card-title">快捷设置</h2>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <label style="display: flex; align-items: center; justify-content: space-between;">
              <span>侧边栏折叠</span>
              <input
                type="checkbox"
                :checked="preferences?.sidebar.collapsed"
                @change="setPreferences({ sidebar: { collapsed: !preferences?.sidebar.collapsed } })"
              />
            </label>
            <label style="display: flex; align-items: center; justify-content: space-between;">
              <span>显示标签栏</span>
              <input
                type="checkbox"
                :checked="preferences?.tabbar.enable"
                @change="setPreferences({ tabbar: { enable: !preferences?.tabbar.enable } })"
              />
            </label>
            <label style="display: flex; align-items: center; justify-content: space-between;">
              <span>显示面包屑</span>
              <input
                type="checkbox"
                :checked="preferences?.breadcrumb.enable"
                @change="setPreferences({ breadcrumb: { enable: !preferences?.breadcrumb.enable } })"
              />
            </label>
            <label style="display: flex; align-items: center; justify-content: space-between;">
              <span>页面过渡动画</span>
              <input
                type="checkbox"
                :checked="preferences?.transition.enable"
                @change="setPreferences({ transition: { enable: !preferences?.transition.enable } })"
              />
            </label>
          </div>
        </div>
      </div>

      <!-- 右侧：配置预览 -->
      <div>
        <div class="card" style="height: 100%;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <h2 class="card-title" style="margin: 0;">配置预览</h2>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary" @click="drawerOpen = true">
                打开完整设置
              </button>
              <button class="btn btn-secondary" @click="copyConfig">
                复制配置
              </button>
              <button class="btn btn-primary" @click="handleReset">
                重置
              </button>
            </div>
          </div>
          <pre style="
            background: var(--muted);
            padding: 16px;
            border-radius: var(--radius);
            overflow: auto;
            max-height: 500px;
            font-size: 12px;
            line-height: 1.5;
          ">{{ preferencesJson }}</pre>
        </div>
      </div>
    </div>

    <!-- 偏好设置抽屉 -->
    <PreferencesDrawer v-model:open="drawerOpen" />
  </div>
</template>
