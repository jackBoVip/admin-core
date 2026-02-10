<script setup lang="ts">
/**
 * 偏好设置抽屉组件
 * @description 完整的偏好设置面板
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { usePreferences } from '../../composables';
import {
  getIcon,
  getLocaleByPreferences,
  getVisibleDrawerTabs,
  getDrawerHeaderActions,
  copyPreferencesConfig,
  importPreferencesConfig,
  getIconStyleString,
  createCopyButtonController,
  getCopyButtonA11yProps,
  getFeatureConfig,
  mergeDrawerUIConfig,
  setupPreferenceTooltip,
  logger,
  type DrawerHeaderActionType,
  type DrawerTabType,
  type PreferencesDrawerUIConfig,
} from '@admin-core/preferences';
import AppearanceTab from './AppearanceTab.vue';
import LayoutTab from './LayoutTab.vue';
import ShortcutKeysTab from './ShortcutKeysTab.vue';
import GeneralTab from './GeneralTab.vue';

const props = withDefaults(defineProps<{
  /** 是否显示 */
  open?: boolean;
  /** 是否显示遮罩 */
  showOverlay?: boolean;
  /** 点击遮罩关闭 */
  closeOnOverlay?: boolean;
  /** 是否显示固定按钮 */
  showPinButton?: boolean;
  /** UI 配置（控制功能项显示/禁用） */
  uiConfig?: PreferencesDrawerUIConfig;
}>(), {
  open: false,
  showOverlay: true,
  closeOnOverlay: true,
  showPinButton: true,
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'close'): void;
  (e: 'pinChange', value: boolean): void;
}>();

const { preferences, resetPreferences, setPreferences, hasChanges } = usePreferences();

// 当前激活的标签
const activeTab = ref<DrawerTabType>('appearance');

// 内容容器引用
const bodyRef = ref<HTMLElement | null>(null);

const tabsIndexMap = computed(() => {
  const map = new Map<DrawerTabType, number>();
  tabs.value.forEach((tab, index) => map.set(tab.value, index));
  return map;
});

// 计算当前激活 tab 的索引（用于滑动指示器动画）
const activeTabIndex = computed(() => {
  const index = tabsIndexMap.value.get(activeTab.value);
  return index !== undefined ? index : 0;
});

// 缓存 tabs 样式对象，避免每次渲染创建新对象
const tabsStyle = computed(() => ({
  '--pref-tab-columns': tabs.value.length,
  '--pref-active-tab-index': activeTabIndex.value,
}));

// 切换标签时回到顶部
const handleTabChange = (tab: DrawerTabType) => {
  activeTab.value = tab;
  if (bodyRef.value) {
    bodyRef.value.scrollTop = 0;
  }
};

const handleTabClick = (e: MouseEvent) => {
  const tab = (e.currentTarget as HTMLElement | null)?.dataset?.value as DrawerTabType | undefined;
  if (tab) {
    handleTabChange(tab);
  }
};

// 是否固定标签栏
const isPinned = ref(false);

// 导入错误弹窗状态
const importError = ref<{ show: boolean; message: string }>({ show: false, message: '' });

// 关闭错误弹窗
const closeImportError = () => {
  importError.value = { show: false, message: '' };
};

// 复制按钮控制器
const copyController = createCopyButtonController();
const copyState = ref(copyController.getInitialState());

// 重置复制状态
const resetCopyStatus = () => {
  copyState.value = copyController.reset();
};

// 监听偏好设置变化，自动重置复制状态（浅层监听引用变化即可）
watch(
  () => preferences.value,
  (newVal, oldVal) => {
    // 只在引用变化且复制状态需要重置时处理
    if (newVal !== oldVal && copyController.shouldResetOnChange(copyState.value, newVal)) {
      resetCopyStatus();
    }
  }
);

// 清理
let tooltipCleanup: (() => void) | null = null;

onMounted(() => {
  tooltipCleanup = setupPreferenceTooltip();
});

onUnmounted(() => {
  tooltipCleanup?.();
  copyController.dispose();
});

// 国际化文本
const locale = computed(() => getLocaleByPreferences(preferences.value));

// 合并后的 UI 配置
const mergedUIConfig = computed(() => mergeDrawerUIConfig(props.uiConfig));

// 标签配置（根据 uiConfig 过滤）
const tabs = computed(() => getVisibleDrawerTabs(locale.value, mergedUIConfig.value));

// 确保 activeTab 在可见 Tab 中
watch(tabs, (newTabs: Array<{ label: string; value: DrawerTabType }>) => {
  if (newTabs.length > 0 && !newTabs.some((t: { label: string; value: DrawerTabType }) => t.value === activeTab.value)) {
    activeTab.value = newTabs[0].value;
  }
}, { immediate: true });

// 头部操作按钮配置
const headerActions = computed(() => {
  const excludeActions: DrawerHeaderActionType[] = [];
  
  // 根据 showPinButton prop 和 uiConfig 过滤
  if (!props.showPinButton || !getFeatureConfig(mergedUIConfig.value, 'headerActions.pin').visible) {
    excludeActions.push('pin');
  }
  if (!getFeatureConfig(mergedUIConfig.value, 'headerActions.import').visible) {
    excludeActions.push('import');
  }
  if (!getFeatureConfig(mergedUIConfig.value, 'headerActions.reset').visible) {
    excludeActions.push('reset');
  }
  if (!getFeatureConfig(mergedUIConfig.value, 'headerActions.close').visible) {
    excludeActions.push('close');
  }
  
  const actions = getDrawerHeaderActions(locale.value, {
    hasChanges: hasChanges.value,
    isPinned: isPinned.value,
    exclude: excludeActions,
  });

  // 应用 uiConfig 的 disabled 状态
  return actions.map((action) => ({
    ...action,
    disabled: action.disabled || getFeatureConfig(mergedUIConfig.value, `headerActions.${action.type}`).disabled,
  }));
});

// 复制按钮配置
const copyButtonConfig = computed(() => getFeatureConfig(mergedUIConfig.value, 'footerActions.copy'));

// 复制按钮是否可见
const showCopyButton = computed(() => copyButtonConfig.value.visible);

// 复制按钮是否禁用（结合 hasChanges 和 uiConfig）
const copyButtonDisabled = computed(() => 
  !hasChanges.value || copyState.value.isCopied || copyButtonConfig.value.disabled
);

// 关闭抽屉
const closeDrawer = () => {
  emit('update:open', false);
  emit('close');
};

// 点击遮罩
const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    closeDrawer();
  }
};

// 处理头部操作按钮点击
const handleHeaderAction = async (type: string) => {
  switch (type) {
    case 'import':
      await handleImportConfig();
      break;
    case 'reset':
      resetPreferences();
      break;
    case 'pin':
      isPinned.value = !isPinned.value;
      emit('pinChange', isPinned.value);
      break;
    case 'close':
      closeDrawer();
      break;
  }
};

const handleHeaderActionClick = (e: MouseEvent) => {
  const type = (e.currentTarget as HTMLElement | null)?.dataset?.value;
  if (type) {
    handleHeaderAction(type);
  }
};

// 导入配置
const handleImportConfig = async () => {
  const result = await importPreferencesConfig();
  
  if (result.success && result.config) {
    // 导入成功，更新配置
    setPreferences(result.config);
  } else {
    // 导入失败，显示错误弹窗
    let errorMessage = '';
    switch (result.errorType) {
      case 'CLIPBOARD_ACCESS_DENIED':
        errorMessage = locale.value.preferences.importErrorClipboardAccess;
        break;
      case 'EMPTY_CLIPBOARD':
        errorMessage = locale.value.preferences.importErrorEmpty;
        break;
      case 'PARSE_ERROR':
        errorMessage = locale.value.preferences.importErrorParse;
        break;
      case 'VALIDATION_ERROR':
        errorMessage = locale.value.preferences.importErrorValidation;
        break;
      default:
        errorMessage = locale.value.preferences.importErrorValidation;
    }
    importError.value = { show: true, message: errorMessage };
  }
};

// 复制配置（带错误处理）
const handleCopyConfig = async () => {
  if (preferences.value && !copyState.value.isCopied) {
    try {
      const success = await copyPreferencesConfig(preferences.value);
      if (success) {
        copyState.value = copyController.handleCopySuccess(preferences.value);
        // 设置自动恢复定时器
        copyController.scheduleAutoReset(() => {
          copyState.value = copyController.getInitialState();
        });
      }
    } catch (error) {
      logger.error('[PreferencesDrawer] Failed to copy config:', error);
      // 可以在这里添加用户提示
    }
  }
};

// 无障碍属性
const copyButtonA11y = computed(() => getCopyButtonA11yProps(copyState.value.isCopied));

// 图标
const copyIcon = getIcon('copy');
const checkIcon = getIcon('check');
const alertIcon = getIcon('alertCircle');
const iconStyleMd = getIconStyleString('md');
const iconStyleSm = getIconStyleString('sm');
</script>

<template>
  <!-- 遮罩层 -->
  <div
    v-if="showOverlay"
    class="preferences-drawer-overlay"
    :class="{ open }"
    :data-state="open ? 'open' : 'closed'"
    @click="handleOverlayClick"
  />

  <!-- 抽屉 -->
  <div class="preferences-drawer" :class="{ open }" :data-state="open ? 'open' : 'closed'">
    <!-- 头部 -->
    <div class="preferences-drawer-header">
      <div class="preferences-drawer-title-wrapper">
        <div class="preferences-drawer-title">{{ locale.preferences.title }}</div>
        <div class="preferences-drawer-description">{{ locale.preferences.description }}</div>
      </div>
      <div class="preferences-drawer-actions">
        <button
          v-for="action in headerActions"
          :key="action.type"
          class="preferences-btn-icon pref-disabled"
          :class="{ relative: action.showIndicator }"
          :disabled="action.disabled"
          :aria-disabled="action.disabled || undefined"
          :data-disabled="action.disabled ? 'true' : undefined"
          :aria-label="action.tooltip"
          :data-preference-tooltip="action.tooltip || undefined"
          :data-value="action.type"
          @click="handleHeaderActionClick"
        >
          <span v-if="action.showIndicator" class="dot" />
          <span v-html="action.icon" :style="iconStyleMd" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- 内容区 -->
    <div ref="bodyRef" class="preferences-drawer-body">
      <!-- 分段标签导航 -->
      <div
        class="preferences-tabs-wrapper"
        :class="{ sticky: isPinned }"
        :data-sticky="isPinned ? 'true' : undefined"
      >
        <div 
          class="preferences-segmented" 
          role="tablist" 
          :aria-label="locale.preferences?.category || locale.preferences?.title || 'Categories'"
          :style="tabsStyle"
        >
          <!-- 滑动指示器（水流动画） -->
          <div class="preferences-segmented-indicator" aria-hidden="true" />
          <button
            v-for="tab in tabs"
            :key="tab.value"
            role="tab"
            :id="`pref-tab-${tab.value}`"
            class="preferences-segmented-item data-active:text-foreground data-active:font-semibold aria-selected:text-foreground"
            :class="{ active: activeTab === tab.value }"
            :aria-selected="activeTab === tab.value"
            :aria-controls="`pref-tabpanel-${tab.value}`"
            :data-state="activeTab === tab.value ? 'active' : 'inactive'"
            :data-value="tab.value"
            @click="handleTabClick"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- 标签内容（使用 v-if 按需渲染，避免所有 Tab 同时显示） -->
      <div
        :id="`pref-tabpanel-${activeTab}`"
        role="tabpanel"
        :aria-labelledby="`pref-tab-${activeTab}`"
      >
        <AppearanceTab v-if="activeTab === 'appearance'" :locale="locale" :ui-config="mergedUIConfig.appearance" />
        <LayoutTab v-if="activeTab === 'layout'" :locale="locale" :ui-config="mergedUIConfig.layout" />
        <ShortcutKeysTab v-if="activeTab === 'shortcutKeys'" :locale="locale" :ui-config="mergedUIConfig.shortcutKeys" />
        <GeneralTab v-if="activeTab === 'general'" :locale="locale" :ui-config="mergedUIConfig.general" />
      </div>
    </div>

    <!-- 底部 -->
    <div v-if="showCopyButton" class="preferences-drawer-footer">
      <button
        class="preferences-btn preferences-btn-primary pref-disabled pref-disabled-trigger"
        :class="{ 'is-copied': copyState.isCopied }"
        :disabled="copyButtonDisabled"
        :aria-disabled="copyButtonDisabled || undefined"
        :data-disabled="copyButtonDisabled ? 'true' : undefined"
        :data-state="copyState.isCopied ? 'copied' : 'idle'"
        v-bind="copyButtonA11y"
        @click="handleCopyConfig"
      >
        <span class="copy-btn-icon" v-html="copyState.isCopied ? checkIcon : copyIcon" :style="iconStyleSm" />
        <span class="copy-btn-text">{{ copyState.isCopied ? locale.preferences.copied : locale.preferences.copyConfig }}</span>
      </button>
    </div>
  </div>

  <!-- 导入错误弹窗 -->
  <Teleport to="body">
    <div v-if="importError.show" class="preferences-modal-overlay" @click.self="closeImportError">
      <div class="preferences-modal">
        <div class="preferences-modal-header">
          <span class="preferences-modal-icon error" data-status="error" v-html="alertIcon" />
          <span class="preferences-modal-title">{{ locale.preferences.importErrorTitle }}</span>
        </div>
        <div class="preferences-modal-body">
          {{ importError.message }}
        </div>
        <div class="preferences-modal-footer">
          <button class="preferences-btn preferences-btn-primary" @click="closeImportError">
            {{ locale.common.confirm }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
