<script setup lang="ts">
/**
 * 偏好设置抽屉组件模块。
 * @description 提供偏好配置查看、修改、导入、复制、重置等完整管理能力。
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

/**
 * 偏好抽屉组件入参
 * @description 控制抽屉显隐、遮罩行为、固定按钮显示及 UI 功能配置。
 */
export interface PreferencesDrawerProps {
  /** 是否显示。 */
  open?: boolean;
  /** 是否显示遮罩。 */
  showOverlay?: boolean;
  /** 点击遮罩关闭。 */
  closeOnOverlay?: boolean;
  /** 是否显示固定按钮。 */
  showPinButton?: boolean;
  /** UI 配置（控制功能项显示/禁用）。 */
  uiConfig?: PreferencesDrawerUIConfig;
}

/**
 * 偏好抽屉组件事件签名。
 */
export interface PreferencesDrawerEmits {
  /** 更新抽屉开关状态。 */
  (e: 'update:open', value: boolean): void;
  /** 抽屉关闭时触发。 */
  (e: 'close'): void;
  /** 抽屉固定状态变化时触发。 */
  (e: 'pinChange', value: boolean): void;
}

/**
 * 导入错误状态。
 */
interface ImportErrorState {
  /** 是否显示错误弹窗。 */
  show: boolean;
  /** 错误提示文案。 */
  message: string;
}

/**
 * 抽屉可见标签项结构。
 */
interface DrawerVisibleTabItem {
  /** 标签文案。 */
  label: string;
  /** 标签值。 */
  value: DrawerTabType;
}

const props = withDefaults(defineProps<PreferencesDrawerProps>(), {
  open: false,
  showOverlay: true,
  closeOnOverlay: true,
  showPinButton: true,
});

/**
 * 偏好抽屉组件事件
 * @description 对外同步抽屉开关、关闭通知与固定状态变化。
 */
const emit = defineEmits<PreferencesDrawerEmits>();

/**
 * 偏好上下文状态与操作方法。
 * @description 提供当前偏好配置、变更检测、重置与批量写入能力。
 */
const { preferences, resetPreferences, setPreferences, hasChanges } = usePreferences();

/**
 * 当前激活标签
 * @description 标记当前展示的偏好分组面板。
 */
const activeTab = ref<DrawerTabType>('appearance');

/**
 * 抽屉内容容器引用
 * @description 标签切换时用于重置滚动位置。
 */
const bodyRef = ref<HTMLElement | null>(null);

/** 标签值到索引的映射表。 */
const tabsIndexMap = computed(() => {
  const map = new Map<DrawerTabType, number>();
  tabs.value.forEach((tab, index) => map.set(tab.value, index));
  return map;
});

/** 当前激活标签索引（用于头部指示器动画）。 */
const activeTabIndex = computed(() => {
  const index = tabsIndexMap.value.get(activeTab.value);
  return index !== undefined ? index : 0;
});

/** 标签头部运行时样式变量。 */
const tabsStyle = computed(() => ({
  '--pref-tab-columns': tabs.value.length,
  '--pref-active-tab-index': activeTabIndex.value,
}));

/**
 * 切换抽屉内部的活动标签页
 * @description 更新当前激活的标签值，并在切换后将滚动容器回滚到顶部。
 * @param tab 目标标签标识。
 */
const handleTabChange = (tab: DrawerTabType) => {
  activeTab.value = tab;
  if (bodyRef.value) {
    bodyRef.value.scrollTop = 0;
  }
};

/**
 * 处理标签按钮点击事件
 * @description 从按钮 `data-value` 中提取标签值并委托到标签切换逻辑。
 * @param e 标签按钮点击事件对象。
 */
const handleTabClick = (e: MouseEvent) => {
  const tab = (e.currentTarget as HTMLElement | null)?.dataset?.value as DrawerTabType | undefined;
  if (tab) {
    handleTabChange(tab);
  }
};

/**
 * 标签栏固定状态
 * @description 控制分段标签是否吸顶展示。
 */
const isPinned = ref(false);

/**
 * 导入错误弹窗状态
 * @description 记录导入失败弹窗显示状态与错误文案。
 */
const importError = ref<ImportErrorState>({ show: false, message: '' });

/**
 * 关闭导入错误提示弹窗
 * @description 清空错误文案并将错误弹窗状态重置为关闭。
 */
const closeImportError = () => {
  importError.value = { show: false, message: '' };
};

/**
 * 复制按钮状态控制器
 * @description 统一管理复制成功态、自动恢复与资源清理。
 */
const copyController = createCopyButtonController();
/**
 * 复制按钮当前状态
 * @description 保存是否已复制与相关时序状态。
 */
const copyState = ref(copyController.getInitialState());

/**
 * 重置复制按钮状态
 * @description 将复制按钮从“已复制”或异常中间态恢复到初始可复制状态。
 */
const resetCopyStatus = () => {
  copyState.value = copyController.reset();
};

/**
 * 监听偏好设置变化并自动重置复制状态。
 * @description 仅在引用变化且满足重置条件时执行，避免不必要更新。
 */
watch(
  () => preferences.value,
  (newVal, oldVal) => {
    /**
     * 引用变化检查。
     * @description 仅在配置引用变更且状态需重置时执行恢复逻辑。
     */
    if (newVal !== oldVal && copyController.shouldResetOnChange(copyState.value, newVal)) {
      resetCopyStatus();
    }
  }
);

/**
 * Tooltip 清理函数引用
 * @description 保存提示层绑定的清理回调，在卸载时释放监听与 DOM 绑定。
 */
let tooltipCleanup: (() => void) | null = null;

/**
 * 组件挂载初始化。
 * @description 启用偏好项 tooltip 行为并缓存清理函数。
 */
onMounted(() => {
  tooltipCleanup = setupPreferenceTooltip();
});

/**
 * 组件卸载清理。
 * @description 释放 tooltip 监听与复制按钮控制器资源。
 */
onUnmounted(() => {
  tooltipCleanup?.();
  copyController.dispose();
});

/** 当前偏好设置对应的语言包。 */
const locale = computed(() => getLocaleByPreferences(preferences.value));

/** 合并后的抽屉 UI 配置。 */
const mergedUIConfig = computed(() => mergeDrawerUIConfig(props.uiConfig));

/** 过滤后的可见标签配置。 */
const tabs = computed(() => getVisibleDrawerTabs(locale.value, mergedUIConfig.value));

/**
 * 确保当前激活标签始终可见。
 * @description 当当前标签被过滤隐藏时自动回退到首个可见标签。
 */
watch(tabs, (newTabs: DrawerVisibleTabItem[]) => {
  if (newTabs.length > 0 && !newTabs.some((t: DrawerVisibleTabItem) => t.value === activeTab.value)) {
    activeTab.value = newTabs[0].value;
  }
}, { immediate: true });

/**
 * 抽屉头部操作按钮列表。
 * @description 结合 `uiConfig` 与当前状态计算可见性、禁用态与指示点。
 */
const headerActions = computed(() => {
  const excludeActions: DrawerHeaderActionType[] = [];
  
  /**
   * 头部操作过滤规则。
   * @description 结合组件参数与 UI 配置决定需要排除的操作项。
   */
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

  /**
   * 合并禁用状态。
   * @description 将动作自身禁用态与 UI 配置禁用态按“或”规则组合。
   */
  return actions.map((action) => ({
    ...action,
    disabled: action.disabled || getFeatureConfig(mergedUIConfig.value, `headerActions.${action.type}`).disabled,
  }));
});

/** 复制按钮功能配置。 */
const copyButtonConfig = computed(() => getFeatureConfig(mergedUIConfig.value, 'footerActions.copy'));

/** 复制按钮是否可见。 */
const showCopyButton = computed(() => copyButtonConfig.value.visible);

/** 复制按钮是否禁用。 */
const copyButtonDisabled = computed(() => 
  !hasChanges.value || copyState.value.isCopied || copyButtonConfig.value.disabled
);

/**
 * 关闭偏好设置抽屉
 * @description 同步更新 `open` 双向绑定值并触发关闭事件通知外层容器。
 */
const closeDrawer = () => {
  emit('update:open', false);
  emit('close');
};

/**
 * 处理遮罩层点击事件
 * @description 当启用遮罩关闭能力时，点击遮罩会触发抽屉关闭。
 */
const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    closeDrawer();
  }
};

/**
 * 处理抽屉头部操作
 * @description 根据操作类型执行导入、重置、固定或关闭行为。
 * @param type 头部操作类型。
 */
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

/**
 * 处理头部按钮点击事件
 * @description 从按钮 `data-value` 读取操作类型并执行对应操作。
 * @param e 头部按钮点击事件对象。
 */
const handleHeaderActionClick = (e: MouseEvent) => {
  const type = (e.currentTarget as HTMLElement | null)?.dataset?.value;
  if (type) {
    handleHeaderAction(type);
  }
};

/**
 * 从剪贴板导入偏好配置
 * @description 尝试解析并应用导入配置；若失败则根据错误类型展示本地化提示文案。
 * @returns 导入流程完成后返回 `Promise<void>`。
 */
const handleImportConfig = async () => {
  const result = await importPreferencesConfig();
  
  if (result.success && result.config) {
    /**
     * 导入成功后更新配置。
     */
    setPreferences(result.config);
  } else {
    /**
     * 导入失败后展示错误弹窗。
     */
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

/**
 * 复制当前偏好配置到剪贴板
 * @description 在配置存在且尚未复制时执行复制，复制成功后更新状态并注册自动恢复定时器。
 * @returns 复制流程完成后返回 `Promise<void>`。
 */
const handleCopyConfig = async () => {
  if (preferences.value && !copyState.value.isCopied) {
    try {
      const success = await copyPreferencesConfig(preferences.value);
      if (success) {
        copyState.value = copyController.handleCopySuccess(preferences.value);
        /**
         * 注册自动恢复任务。
         * @description 复制成功后在延时结束时将按钮状态恢复为初始值。
         */
        copyController.scheduleAutoReset(() => {
          copyState.value = copyController.getInitialState();
        });
      }
    } catch (error) {
      logger.error('[PreferencesDrawer] Failed to copy config:', error);
      /**
       * 复制失败兜底处理。
       * @description 当前仅记录日志，后续可扩展为用户提示。
       */
    }
  }
};

/** 复制按钮无障碍属性。 */
const copyButtonA11y = computed(() => getCopyButtonA11yProps(copyState.value.isCopied));

/**
 * 复制操作图标
 * @description 用于底部复制按钮的默认态图标。
 */
const copyIcon = getIcon('copy');
/**
 * 复制成功图标
 * @description 复制完成后用于反馈成功态。
 */
const checkIcon = getIcon('check');
/**
 * 导入错误图标
 * @description 错误弹窗中展示的提醒图标。
 */
const alertIcon = getIcon('alertCircle');
/**
 * 中号图标样式
 * @description 头部操作图标统一样式字符串。
 */
const iconStyleMd = getIconStyleString('md');
/**
 * 小号图标样式
 * @description 错误弹窗图标等紧凑场景的样式字符串。
 */
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
