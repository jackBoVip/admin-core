<script setup lang="ts">
/**
 * 偏好设置抽屉组件
 * @description 完整的偏好设置面板，与 Vben Admin 保持一致的样式
 */
import { ref, computed, watch, onUnmounted } from 'vue';
import { usePreferences } from '../../composables';
import {
  getIcon,
  getLocaleByPreferences,
  getDrawerTabs,
  getDrawerHeaderActions,
  copyPreferencesConfig,
  importPreferencesConfig,
  getIconStyleString,
  createCopyButtonController,
  getCopyButtonA11yProps,
  type DrawerHeaderActionType,
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
const activeTab = ref('appearance');

// 内容容器引用
const bodyRef = ref<HTMLElement | null>(null);

// 切换标签时回到顶部
const handleTabChange = (tab: string) => {
  activeTab.value = tab;
  if (bodyRef.value) {
    bodyRef.value.scrollTop = 0;
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

// 监听偏好设置变化，自动重置复制状态（使用 deep watch 替代 JSON.stringify）
watch(
  () => preferences.value,
  () => {
    if (copyController.shouldResetOnChange(copyState.value, preferences.value)) {
      resetCopyStatus();
    }
  },
  { deep: true }
);

// 清理
onUnmounted(() => {
  copyController.dispose();
});

// 国际化文本
const locale = computed(() => getLocaleByPreferences(preferences.value));

// 标签配置
const tabs = computed(() => getDrawerTabs(locale.value));

// 头部操作按钮配置
const headerActions = computed(() => {
  const excludeActions: DrawerHeaderActionType[] = props.showPinButton ? [] : ['pin'];
  return getDrawerHeaderActions(locale.value, {
    hasChanges: hasChanges.value,
    isPinned: isPinned.value,
    exclude: excludeActions,
  });
});

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

// 复制配置
const handleCopyConfig = async () => {
  if (preferences.value && !copyState.value.isCopied) {
    const success = await copyPreferencesConfig(preferences.value);
    if (success) {
      copyState.value = copyController.handleCopySuccess(preferences.value);
      // 设置自动恢复定时器
      copyController.scheduleAutoReset(() => {
        copyState.value = copyController.getInitialState();
      });
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
    @click="handleOverlayClick"
  />

  <!-- 抽屉 -->
  <div class="preferences-drawer" :class="{ open }">
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
          class="preferences-btn-icon"
          :class="{ relative: action.showIndicator }"
          :disabled="action.disabled"
          :data-preference-tooltip="action.tooltip || undefined"
          @click="handleHeaderAction(action.type)"
        >
          <span v-if="action.showIndicator" class="dot" />
          <span v-html="action.icon" :style="iconStyleMd" />
        </button>
      </div>
    </div>

    <!-- 内容区 -->
    <div ref="bodyRef" class="preferences-drawer-body">
      <!-- 分段标签导航 -->
      <div class="preferences-tabs-wrapper" :class="{ sticky: isPinned }">
        <div class="preferences-segmented">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="preferences-segmented-item"
            :class="{ active: activeTab === tab.value }"
            @click="handleTabChange(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- 标签内容 -->
      <AppearanceTab v-if="activeTab === 'appearance'" :locale="locale" />
      <LayoutTab v-if="activeTab === 'layout'" :locale="locale" />
      <ShortcutKeysTab v-if="activeTab === 'shortcutKeys'" :locale="locale" />
      <GeneralTab v-if="activeTab === 'general'" :locale="locale" />
    </div>

    <!-- 底部 -->
    <div class="preferences-drawer-footer">
      <button
        class="preferences-btn preferences-btn-primary"
        :class="{ 'is-copied': copyState.isCopied }"
        :disabled="!hasChanges || copyState.isCopied"
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
          <span class="preferences-modal-icon error" v-html="alertIcon" />
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
