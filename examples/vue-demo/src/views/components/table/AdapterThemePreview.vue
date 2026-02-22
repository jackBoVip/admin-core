<script setup lang="ts">
import { getVueFormAdapterRegistry } from '@admin-core/form-vue';
import { onMounted, onUnmounted, ref } from 'vue';

const demoSwitch = ref(true);
const demoChecked = ref(true);
const demoLevel = ref<'high' | 'low' | 'medium'>('medium');
const demoName = ref('Theme Adapter');
const activeFormLibrary = getVueFormAdapterRegistry().getActiveLibrary();
const primaryColor = ref('');

let observer: MutationObserver | null = null;

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
      <vxe-switch v-model="demoSwitch" size="small" />
      <vxe-checkbox v-model="demoChecked" content="Checkbox" />
      <vxe-select
        v-model="demoLevel"
        :options="[
          { label: '高', value: 'high' },
          { label: '中', value: 'medium' },
          { label: '低', value: 'low' },
        ]"
        size="small"
        style="width: 120px"
      />
      <vxe-input
        v-model="demoName"
        size="small"
        style="width: 180px"
      />
      <vxe-button status="primary" size="small">
        主按钮
      </vxe-button>
    </div>
  </div>
</template>
