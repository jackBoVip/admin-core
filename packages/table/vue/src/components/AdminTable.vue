<script lang="ts" setup>
import type {
  VxeGridDefines,
  VxeGridInstance,
  VxeGridListeners,
  VxeGridProps as VxeTableGridProps,
} from 'vxe-table';

import type { AdminTableApi } from '@admin-core/table-core';
import type { AdminTableVueProps } from '../types';

import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  toRaw,
  useSlots,
  watch,
} from 'vue';

import {
  deepEqual,
  extendProxyOptions,
  getLocaleMessages,
  mergeWithArrayOverride,
} from '@admin-core/table-core';
import { useAdminForm } from '@admin-core/form-vue';
import { VxeButton } from 'vxe-pc-ui';
import { VxeGrid, VxeUI } from 'vxe-table';

import '../styles/index.css';

interface Props extends AdminTableVueProps {
  api: AdminTableApi;
}

const props = defineProps<Props>();
const slots = useSlots() as Record<string, (...args: any[]) => any>;
const gridRef = ref<VxeGridInstance>();

const state = ref(props.api.getSnapshot().props as AdminTableVueProps);
const unsub = props.api.store.subscribeSelector(
  (snapshot) => snapshot.props,
  (next) => {
    state.value = next as AdminTableVueProps;
  }
);

watch(
  () => props,
  (next) => {
    const { api: _api, ...rest } = next;
    props.api.setState(rest as any);
  },
  { deep: true, immediate: true }
);

const [SearchForm, formApi] = useAdminForm({
  compact: true,
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  handleSubmit: async () => {
    const values = await formApi.getValues();
    formApi.setLatestSubmissionValues(values);
    await props.api.reload(values);
  },
  handleReset: async () => {
    const prevValues = await formApi.getValues();
    await formApi.resetForm();
    const values = await formApi.getValues();
    formApi.setLatestSubmissionValues(values);
    if (deepEqual(prevValues, values) || !state.value.formOptions?.submitOnChange) {
      await props.api.reload(values);
    }
  },
  showCollapseButton: true,
  submitButtonOptions: {
    content: getLocaleMessages().table.search,
  },
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
});

watch(
  () => state.value.formOptions,
  (next) => {
    formApi.setState((prev) => mergeWithArrayOverride(next ?? {}, prev));
  },
  { deep: true, immediate: true }
);

const isMobile = ref(false);

const updateMobile = () => {
  if (typeof window === 'undefined') return;
  isMobile.value = window.matchMedia('(max-width: 768px)').matches;
};

const showTableTitle = computed<boolean>(() => {
  return !!slots['table-title']?.() || !!state.value.tableTitle;
});

const showToolbar = computed<boolean>(() => {
  return (
    !!slots['toolbar-actions']?.() ||
    !!slots['toolbar-tools']?.() ||
    showTableTitle.value
  );
});

const toolbarOptions = computed(() => {
  const config = state.value.gridOptions?.toolbarConfig ?? {};
  const tools = Array.isArray(config.tools) ? [...config.tools] : [];

  if (config.search && state.value.formOptions) {
    tools.push({
      code: 'search',
      circle: true,
      icon: 'vxe-icon-search',
      status: state.value.showSearchForm ? 'primary' : undefined,
      title: state.value.showSearchForm
        ? getLocaleMessages().table.hideSearchPanel
        : getLocaleMessages().table.showSearchPanel,
    });
  }

  return {
    ...config,
    tools,
  };
});

const gridOptions = computed(() => {
  const globalGridConfig = (VxeUI?.getConfig()?.grid ?? {}) as VxeTableGridProps;
  const merged = mergeWithArrayOverride(
    {
      ...state.value.gridOptions,
      toolbarConfig: toolbarOptions.value,
    },
    globalGridConfig
  ) as VxeTableGridProps;

  if (merged.proxyConfig) {
    merged.proxyConfig = {
      ...merged.proxyConfig,
      autoLoad: false,
      enabled: !!merged.proxyConfig.ajax,
    };
  }

  if (merged.formConfig) {
    merged.formConfig = {
      ...merged.formConfig,
      enabled: false,
    };
  }

  if (merged.pagerConfig) {
    const mobileLayouts = ['PrevJump', 'PrevPage', 'Number', 'NextPage', 'NextJump'];
    const layouts = ['Total', 'Sizes', 'Home', ...mobileLayouts, 'End'];

    merged.pagerConfig = {
      ...merged.pagerConfig,
      background: true,
      className: 'mt-2 w-full',
      layouts: isMobile.value ? mobileLayouts : layouts,
      pageSize: merged.pagerConfig.pageSize ?? 20,
      pageSizes: merged.pagerConfig.pageSizes ?? [10, 20, 30, 50, 100, 200],
      size: 'mini',
    } as any;
  }

  return extendProxyOptions(merged as Record<string, any>, () => {
    return formApi.getLatestSubmissionValues?.() ?? {};
  });
});

const gridEvents = computed(() => {
  const events = state.value.gridEvents ?? {};

  return {
    ...events,
    toolbarToolClick: (event: VxeGridDefines.ToolbarToolClickEventParams) => {
      if (event.code === 'search') {
        props.api.toggleSearchForm();
      }
      (events as VxeGridListeners).toolbarToolClick?.(event);
    },
  };
});

const delegatedSlots = computed<string[]>(() => {
  return Object.keys(slots).filter(
    (name) =>
      ![
        'table-title',
        'toolbar-actions',
        'toolbar-tools',
        'form',
        'empty',
        'loading',
      ].includes(name) && !name.startsWith('form-')
  );
});

const delegatedFormSlots = computed<string[]>(() => {
  return Object.keys(slots)
    .filter((name) => name.startsWith('form-'))
    .map((name) => name.replace('form-', ''));
});

const showSeparator = computed(() => {
  const separator = state.value.separator;
  if (!state.value.formOptions || state.value.showSearchForm === false || separator === false) {
    return false;
  }
  if (separator === undefined || separator === true) {
    return true;
  }
  return separator.show !== false;
});

const separatorStyle = computed(() => {
  const separator = state.value.separator;
  if (!separator || typeof separator === 'boolean') {
    return undefined;
  }
  if (!separator.backgroundColor) {
    return undefined;
  }
  return {
    backgroundColor: separator.backgroundColor,
  };
});

async function runCommitProxy(mode: 'query' | 'reload', params: Record<string, any>) {
  if (!gridRef.value?.commitProxy) {
    return undefined;
  }
  return await gridRef.value.commitProxy(mode, toRaw(params));
}

async function initialize() {
  await nextTick();

  props.api.mount(gridRef.value, {
    executors: {
      query: ({ params }) => runCommitProxy('query', params),
      reload: ({ params }) => runCommitProxy('reload', params),
    },
    formApi,
  });

  const autoLoad = !!gridOptions.value.proxyConfig?.autoLoad;
  const enableProxy = !!gridOptions.value.proxyConfig?.enabled;

  if (autoLoad && enableProxy) {
    const values = state.value.formOptions ? await formApi.getValues() : {};
    await runCommitProxy('query', values ?? {});
  }
}

onMounted(() => {
  updateMobile();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateMobile);
  }
  void initialize();
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateMobile);
  }
  formApi.unmount();
  props.api.unmount();
  unsub();
});
</script>

<template>
  <div :class="['admin-table', state.class]">
    <VxeGrid
      ref="gridRef"
      :class="['admin-table-vxe', state.gridClass]"
      v-bind="gridOptions"
      v-on="gridEvents"
    >
      <template v-if="showToolbar" #toolbar-actions="slotProps">
        <slot v-if="showTableTitle" name="table-title">
          <div class="admin-table__toolbar-title">
            <span>{{ state.tableTitle }}</span>
            <span v-if="state.tableTitleHelp" :title="state.tableTitleHelp">?</span>
          </div>
        </slot>
        <slot name="toolbar-actions" v-bind="slotProps" />
      </template>

      <template #toolbar-tools="slotProps">
        <slot name="toolbar-tools" v-bind="slotProps" />
        <VxeButton
          v-if="state.gridOptions?.toolbarConfig?.search && !!state.formOptions"
          class="ml-2"
          icon="vxe-icon-search"
          circle
          :status="state.showSearchForm ? 'primary' : undefined"
          :title="getLocaleMessages().table.search"
          @click="() => props.api.toggleSearchForm()"
        />
      </template>

      <template v-for="slotName in delegatedSlots" :key="slotName" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps" />
      </template>

      <template #form>
        <div v-if="state.formOptions" v-show="state.showSearchForm !== false" class="admin-table__search">
          <slot name="form">
            <SearchForm>
              <template v-for="slotName in delegatedFormSlots" :key="slotName" #[slotName]="slotProps">
                <slot :name="`form-${slotName}`" v-bind="slotProps" />
              </template>
              <template #reset-before="slotProps">
                <slot name="reset-before" v-bind="slotProps" />
              </template>
              <template #submit-before="slotProps">
                <slot name="submit-before" v-bind="slotProps" />
              </template>
              <template #expand-before="slotProps">
                <slot name="expand-before" v-bind="slotProps" />
              </template>
              <template #expand-after="slotProps">
                <slot name="expand-after" v-bind="slotProps" />
              </template>
            </SearchForm>
          </slot>
          <div v-if="showSeparator" class="admin-table__separator" :style="separatorStyle" />
        </div>
      </template>

      <template #loading>
        <slot name="loading">
          <div class="admin-table__empty">Loading...</div>
        </slot>
      </template>

      <template #empty>
        <slot name="empty">
          <div class="admin-table__empty">{{ getLocaleMessages().table.noData }}</div>
        </slot>
      </template>
    </VxeGrid>
  </div>
</template>
