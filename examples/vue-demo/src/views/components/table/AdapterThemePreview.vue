<script setup lang="ts">
import { getVueFormAdapterRegistry } from '@admin-core/form-vue';
import {
  VxeButton,
  VxeCheckbox,
  VxeInput,
  VxeSelect,
  VxeSwitch,
} from 'vxe-pc-ui';
import { onMounted, onUnmounted, ref } from 'vue';

/**
 * 开关示例值。
 */
const demoSwitch = ref(true);
/**
 * 复选框示例值。
 */
const demoChecked = ref(true);
/**
 * 下拉示例值。
 */
const demoLevel = ref<'high' | 'low' | 'medium'>('medium');
/**
 * 输入框示例值。
 */
const demoName = ref('Theme Adapter');
/**
 * 当前激活的表单适配器标识。
 */
const activeFormLibrary = getVueFormAdapterRegistry().getActiveLibrary();
/**
 * 主题主色变量快照。
 */
const primaryColor = ref('');

/**
 * 文档根节点样式监听器。
 */
let observer: MutationObserver | null = null;

/**
 * 同步当前主题色快照。
 *
 * @returns 无返回值。
 */
function syncThemeSnapshot() {
  const styles = getComputedStyle(document.documentElement);
  primaryColor.value = styles.getPropertyValue('--primary').trim();
}

onMounted(() => {
  syncThemeSnapshot();
  observer = new MutationObserver(() => {
    syncThemeSnapshot();
  });
  observer.observe(document.documentElement, {
    attributeFilter: ['class', 'data-theme', 'style'],
    attributes: true,
  });
});

onUnmounted(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <div class="card" style="margin-bottom: 12px">
    <p class="page-description" style="margin-bottom: 12px">
      第三方组件库验证：{{ activeFormLibrary }} | --primary: {{ primaryColor || '-' }}
    </p>
    <div style="align-items: center; display: flex; flex-wrap: wrap; gap: 12px">
      <VxeSwitch v-model="demoSwitch" size="small" />
      <VxeCheckbox v-model="demoChecked" content="Checkbox" />
      <VxeSelect
        v-model="demoLevel"
        :options="[
          { label: '高', value: 'high' },
          { label: '中', value: 'medium' },
          { label: '低', value: 'low' },
        ]"
        size="small"
        style="width: 120px"
      />
      <VxeInput
        v-model="demoName"
        size="small"
        style="width: 180px"
      />
      <VxeButton status="primary" size="small">
        主按钮
      </VxeButton>
    </div>
  </div>
</template>
