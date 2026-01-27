<script setup lang="ts">
import { computed } from 'vue';
import { usePreferences } from '@admin-core/preferences-vue';

const { preferences } = usePreferences();

// 模拟统计数据
const stats = [
  { label: '总用户', value: '12,345', color: 'var(--primary)', trend: '+12%' },
  { label: '今日访问', value: '1,234', color: 'var(--success)', trend: '+5%' },
  { label: '订单数', value: '567', color: 'var(--warning)', trend: '+8%' },
  { label: '收入', value: '¥89,012', color: 'var(--info)', trend: '+15%' },
];

// 配置信息
const configItems = computed(() => [
  { label: '主题模式', value: preferences.value?.theme.mode },
  { label: '布局类型', value: preferences.value?.app.layout },
  { label: '侧边栏折叠', value: preferences.value?.sidebar.collapsed ? '是' : '否' },
  { label: '顶栏固定', value: preferences.value?.header.mode },
  { label: '标签页启用', value: preferences.value?.tabbar.enable ? '是' : '否' },
  { label: '面包屑启用', value: preferences.value?.breadcrumb.enable ? '是' : '否' },
  { label: '动画过渡', value: preferences.value?.transition.name },
  { label: '圆角大小', value: preferences.value?.theme.radius + 'rem' },
]);
</script>

<template>
  <div>
    <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 24px; color: var(--foreground);">
      仪表盘
    </h1>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-value" :style="{ color: stat.color }">
          {{ stat.value }}
        </div>
        <div class="stat-label">
          {{ stat.label }}
          <span style="color: var(--success); margin-left: 8px;">{{ stat.trend }}</span>
        </div>
      </div>
    </div>

    <!-- 配置详情 -->
    <div class="card" style="margin-bottom: 24px;">
      <h2 class="card-title">当前偏好配置</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <div
          v-for="item in configItems"
          :key="item.label"
          style="display: flex; justify-content: space-between; padding: 12px; background: var(--muted); border-radius: var(--radius);"
        >
          <span style="color: var(--muted-foreground);">{{ item.label }}</span>
          <span style="font-weight: 500; color: var(--foreground);">{{ item.value }}</span>
        </div>
      </div>
    </div>

    <!-- 颜色变量展示 -->
    <div class="card">
      <h2 class="card-title">当前主题颜色</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;">
        <div
          v-for="color in ['primary', 'success', 'warning', 'destructive', 'info']"
          :key="color"
          style="text-align: center;"
        >
          <div
            :style="{
              width: '100%',
              height: '60px',
              borderRadius: 'var(--radius)',
              backgroundColor: `var(--${color})`,
              marginBottom: '8px',
            }"
          />
          <span style="font-size: 12px; color: var(--muted-foreground);">{{ color }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
