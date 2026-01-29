import { useMemo } from 'react';
import {
  usePreferences,
  useTheme,
  usePreferencesContext,
} from '@admin-core/preferences-react';
import {
  BUILT_IN_THEME_PRESETS,
  LAYOUT_OPTIONS,
  translateOptions,
  zhCN,
  enUS,
  type ThemeModeType,
  type BuiltinThemeType,
  type LayoutType,
  type BuiltinThemePreset,
  type LocaleMessages,
} from '@admin-core/preferences';
import { useUIConfigState } from '../App';

function Settings() {
  const { preferences, setPreferences, resetPreferences } = usePreferences();
  const { actualThemeMode } = useTheme();
  const { openPreferences } = usePreferencesContext();
  
  // 从 App 获取 UI 配置状态
  const uiConfig = useUIConfigState();

  // 主题模式选项
  const themeModeOptions = [
    { label: '浅色', value: 'light' },
    { label: '深色', value: 'dark' },
    { label: '跟随系统', value: 'auto' },
  ];

  // 国际化
  const locale = useMemo(() => {
    return preferences.app.locale === 'en-US' ? enUS : zhCN;
  }, [preferences.app.locale]);

  // 布局选项（翻译后）
  const layoutOptions = useMemo(
    () => translateOptions(LAYOUT_OPTIONS, locale as LocaleMessages),
    [locale]
  );

  // 圆角选项
  const radiusOptions = ['0', '0.25', '0.5', '0.75', '1'];

  // JSON 预览
  const preferencesJson = useMemo(() => {
    return JSON.stringify(preferences, null, 2);
  }, [preferences]);

  // 复制配置
  const copyConfig = async () => {
    try {
      await navigator.clipboard.writeText(preferencesJson);
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

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: 'var(--foreground)' }}>
        设置演示
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* 左侧：快捷设置 */}
        <div>
          {/* 主题模式 */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">主题模式</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {themeModeOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`btn ${preferences.theme.mode === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPreferences({ theme: { mode: opt.value as ThemeModeType } })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--muted-foreground)' }}>
              当前实际模式: {actualThemeMode}
            </p>
          </div>

          {/* 主题预设 */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">主题预设</h2>
            <div className="color-palette">
              {BUILT_IN_THEME_PRESETS.filter((p: BuiltinThemePreset) => p.type !== 'custom').map((preset: BuiltinThemePreset) => (
                <div
                  key={preset.type}
                  className="color-swatch"
                  style={{
                    backgroundColor: preset.color,
                    cursor: 'pointer',
                    border: preferences.theme.builtinType === preset.type
                      ? '3px solid var(--foreground)'
                      : 'none',
                  }}
                  onClick={() => setPreferences({ theme: { builtinType: preset.type as BuiltinThemeType } })}
                  title={preset.type}
                />
              ))}
            </div>
          </div>

          {/* 圆角大小 */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">圆角大小</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {radiusOptions.map((r) => (
                <button
                  key={r}
                  className={`btn ${preferences.theme.radius === r ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPreferences({ theme: { radius: r } })}
                >
                  {r}rem
                </button>
              ))}
            </div>
          </div>

          {/* 布局选择 */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">布局类型</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {layoutOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`btn ${preferences.app.layout === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPreferences({ app: { layout: opt.value as LayoutType } })}
                  style={{ fontSize: 12 }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 快捷开关 */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">快捷设置</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>侧边栏折叠</span>
                <input
                  type="checkbox"
                  checked={preferences.sidebar.collapsed}
                  onChange={() => setPreferences({ sidebar: { collapsed: !preferences.sidebar.collapsed } })}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>显示标签栏</span>
                <input
                  type="checkbox"
                  checked={preferences.tabbar.enable}
                  onChange={() => setPreferences({ tabbar: { enable: !preferences.tabbar.enable } })}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>显示面包屑</span>
                <input
                  type="checkbox"
                  checked={preferences.breadcrumb.enable}
                  onChange={() => setPreferences({ breadcrumb: { enable: !preferences.breadcrumb.enable } })}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>页面过渡动画</span>
                <input
                  type="checkbox"
                  checked={preferences.transition.enable}
                  onChange={() => setPreferences({ transition: { enable: !preferences.transition.enable } })}
                />
              </label>
            </div>
          </div>

          {/* UI 配置控制（演示 uiConfig 功能） */}
          <div className="card">
            <h2 className="card-title">🎛️ 抽屉 UI 配置（演示）</h2>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 12 }}>
              控制偏好设置抽屉中功能项的显示/禁用（勾选后打开设置抽屉查看效果）
            </p>
            
            {/* Tab 级别 */}
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '12px 0 8px', color: 'var(--primary)' }}>📑 Tab 控制</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>隐藏「快捷键」Tab</span>
                <input type="checkbox" checked={uiConfig.hideShortcutKeys} onChange={() => uiConfig.setHideShortcutKeys(!uiConfig.hideShortcutKeys)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>隐藏「外观」Tab</span>
                <input type="checkbox" checked={uiConfig.hideAppearanceTab} onChange={() => uiConfig.setHideAppearanceTab(!uiConfig.hideAppearanceTab)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>禁用「布局」Tab</span>
                <input type="checkbox" checked={uiConfig.disableLayoutTab} onChange={() => uiConfig.setDisableLayoutTab(!uiConfig.disableLayoutTab)} />
              </label>
            </div>
            
            {/* 头部按钮 */}
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '12px 0 8px', color: 'var(--primary)' }}>🔘 头部按钮</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>隐藏「导入」按钮</span>
                <input type="checkbox" checked={uiConfig.hideImportButton} onChange={() => uiConfig.setHideImportButton(!uiConfig.hideImportButton)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>禁用「重置」按钮</span>
                <input type="checkbox" checked={uiConfig.disableReset} onChange={() => uiConfig.setDisableReset(!uiConfig.disableReset)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>隐藏「固定」按钮</span>
                <input type="checkbox" checked={uiConfig.hidePinButton} onChange={() => uiConfig.setHidePinButton(!uiConfig.hidePinButton)} />
              </label>
            </div>
            
            {/* 底部按钮 */}
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '12px 0 8px', color: 'var(--primary)' }}>📋 底部按钮</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>隐藏「复制配置」按钮</span>
                <input type="checkbox" checked={uiConfig.hideCopyButton} onChange={() => uiConfig.setHideCopyButton(!uiConfig.hideCopyButton)} />
              </label>
            </div>
            
            {/* 外观设置 */}
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '12px 0 8px', color: 'var(--primary)' }}>🎨 外观设置</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>禁用「主题模式」</span>
                <input type="checkbox" checked={uiConfig.disableThemeMode} onChange={() => uiConfig.setDisableThemeMode(!uiConfig.disableThemeMode)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>隐藏「内置主题」</span>
                <input type="checkbox" checked={uiConfig.hideBuiltinTheme} onChange={() => uiConfig.setHideBuiltinTheme(!uiConfig.hideBuiltinTheme)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>禁用「圆角大小」</span>
                <input type="checkbox" checked={uiConfig.disableRadius} onChange={() => uiConfig.setDisableRadius(!uiConfig.disableRadius)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>隐藏「字体缩放」</span>
                <input type="checkbox" checked={uiConfig.hideFontSize} onChange={() => uiConfig.setHideFontSize(!uiConfig.hideFontSize)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>禁用「颜色模式」区块</span>
                <input type="checkbox" checked={uiConfig.disableColorMode} onChange={() => uiConfig.setDisableColorMode(!uiConfig.disableColorMode)} />
              </label>
            </div>
            
            {/* 布局设置 */}
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '12px 0 8px', color: 'var(--primary)' }}>📐 布局设置</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>隐藏「布局类型」</span>
                <input type="checkbox" checked={uiConfig.hideLayoutType} onChange={() => uiConfig.setHideLayoutType(!uiConfig.hideLayoutType)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>禁用「内容宽度」</span>
                <input type="checkbox" checked={uiConfig.disableContentWidth} onChange={() => uiConfig.setDisableContentWidth(!uiConfig.disableContentWidth)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>隐藏「侧边栏」区块</span>
                <input type="checkbox" checked={uiConfig.hideSidebar} onChange={() => uiConfig.setHideSidebar(!uiConfig.hideSidebar)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>禁用「功能区」区块</span>
                <input type="checkbox" checked={uiConfig.disablePanel} onChange={() => uiConfig.setDisablePanel(!uiConfig.disablePanel)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>隐藏「顶栏」区块</span>
                <input type="checkbox" checked={uiConfig.hideHeader} onChange={() => uiConfig.setHideHeader(!uiConfig.hideHeader)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>禁用「标签栏」区块</span>
                <input type="checkbox" checked={uiConfig.disableTabbar} onChange={() => uiConfig.setDisableTabbar(!uiConfig.disableTabbar)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>隐藏「面包屑」区块</span>
                <input type="checkbox" checked={uiConfig.hideBreadcrumb} onChange={() => uiConfig.setHideBreadcrumb(!uiConfig.hideBreadcrumb)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>禁用「页脚」区块</span>
                <input type="checkbox" checked={uiConfig.disableFooterBlock} onChange={() => uiConfig.setDisableFooterBlock(!uiConfig.disableFooterBlock)} />
              </label>
            </div>
            
            {/* 通用设置 */}
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '12px 0 8px', color: 'var(--primary)' }}>⚙️ 通用设置</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>隐藏「语言」</span>
                <input type="checkbox" checked={uiConfig.hideLanguage} onChange={() => uiConfig.setHideLanguage(!uiConfig.hideLanguage)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>禁用「动态标题」</span>
                <input type="checkbox" checked={uiConfig.disableDynamicTitle} onChange={() => uiConfig.setDisableDynamicTitle(!uiConfig.disableDynamicTitle)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>隐藏「锁屏」区块</span>
                <input type="checkbox" checked={uiConfig.hideLockScreen} onChange={() => uiConfig.setHideLockScreen(!uiConfig.hideLockScreen)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>禁用「水印」区块</span>
                <input type="checkbox" checked={uiConfig.disableWatermark} onChange={() => uiConfig.setDisableWatermark(!uiConfig.disableWatermark)} />
              </label>
            </div>
          </div>
        </div>

        {/* 右侧：配置预览 */}
        <div>
          <div className="card" style={{ height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 className="card-title" style={{ margin: 0 }}>配置预览</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={openPreferences}>
                  打开完整设置
                </button>
                <button className="btn btn-secondary" onClick={copyConfig}>
                  复制配置
                </button>
                <button className="btn btn-primary" onClick={handleReset}>
                  重置
                </button>
              </div>
            </div>
            <pre
              style={{
                background: 'var(--muted)',
                padding: 16,
                borderRadius: 'var(--radius)',
                overflow: 'auto',
                maxHeight: 500,
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {preferencesJson}
            </pre>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Settings;
