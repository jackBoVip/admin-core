<script setup lang="ts">
import type { VxeTableGridOptions } from '@admin-core/table-vue';

import { useAdminTable } from '@admin-core/table-vue';
import {
  ElButton,
  ElCheckbox,
  ElInput,
  ElOption,
  ElSelect,
  ElSwitch,
} from 'element-plus';
import { onMounted, onUnmounted, ref } from 'vue';

import { BASIC_ROWS, type DemoRow } from './data';

const primaryColor = ref('');
const demoSwitch = ref(true);
const demoChecked = ref(true);
const demoLevel = ref<'high' | 'low' | 'medium'>('medium');
const demoName = ref('Element Plus');
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

const gridOptions: VxeTableGridOptions<DemoRow> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'name', title: 'Name', width: 130 },
    { field: 'age', title: 'Age', width: 90 },
    { field: 'enabled', slots: { default: 'ep-switch' }, title: 'Switch(EP)', width: 140 },
    { field: 'selected', slots: { default: 'ep-checkbox' }, title: 'Checkbox(EP)', width: 150 },
    { field: 'level', slots: { default: 'ep-select' }, title: 'Select(EP)', width: 170 },
    { field: 'nickname', slots: { default: 'ep-input' }, title: 'Input(EP)', width: 190 },
    { field: 'actions', slots: { default: 'ep-actions' }, title: 'Action(EP)', width: 130 },
    { field: 'address', showOverflow: true, title: 'Address' },
  ],
  data: BASIC_ROWS,
  pagerConfig: {
    enabled: false,
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    zoom: true,
  },
};

const [Grid] = useAdminTable<DemoRow>({
  gridOptions,
});
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">表格 - Element Plus 插槽</h1>
    <p class="page-description">
      在 table slot 中使用 Element Plus 组件，并验证偏好系统主题联动。
    </p>

    <div class="card" style="margin-bottom: 12px">
      <p class="page-description" style="margin-bottom: 12px">
        主题变量快照：--primary = {{ primaryColor || '-' }}
      </p>
      <div style="align-items: center; display: flex; flex-wrap: wrap; gap: 12px">
        <ElSwitch v-model="demoSwitch" />
        <ElCheckbox v-model="demoChecked">Checkbox</ElCheckbox>
        <ElSelect v-model="demoLevel" :teleported="false" style="width: 130px">
          <ElOption label="高" value="high" />
          <ElOption label="中" value="medium" />
          <ElOption label="低" value="low" />
        </ElSelect>
        <ElInput v-model="demoName" style="width: 180px" />
        <ElButton type="primary">主按钮</ElButton>
      </div>
    </div>

    <div class="card">
      <Grid table-title="Element Plus 插槽表格" table-title-help="Element Plus Slot Demo">
        <template #ep-switch="{ row }">
          <ElSwitch v-model="row.enabled" />
        </template>

        <template #ep-checkbox="{ row }">
          <ElCheckbox v-model="row.selected" />
        </template>

        <template #ep-select="{ row }">
          <ElSelect v-model="row.level" :teleported="false" style="width: 130px">
            <ElOption label="高" value="high" />
            <ElOption label="中" value="medium" />
            <ElOption label="低" value="low" />
          </ElSelect>
        </template>

        <template #ep-input="{ row }">
          <ElInput v-model="row.nickname" style="width: 150px" />
        </template>

        <template #ep-actions="{ row }">
          <ElButton
            link
            type="primary"
            @click="() => console.log('element-plus action click:', row.name)"
          >
            详情
          </ElButton>
        </template>
      </Grid>
    </div>
  </div>
</template>
