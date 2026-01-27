import { useState, useMemo } from 'react';
import {
  usePreferences,
  useTheme,
  PreferencesDrawer,
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

function Settings() {
  const { preferences, setPreferences, resetPreferences } = usePreferences();
  const { actualThemeMode } = useTheme();

  // 单独的抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          <div className="card">
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
        </div>

        {/* 右侧：配置预览 */}
        <div>
          <div className="card" style={{ height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 className="card-title" style={{ margin: 0 }}>配置预览</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => setDrawerOpen(true)}>
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

      {/* 偏好设置抽屉 */}
      <PreferencesDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

export default Settings;
