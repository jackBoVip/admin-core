import {
  usePreferences,
  useTheme,
  useLayout,
  AdminIcon,
  AdminLayoutIcon,
} from '@admin-core/preferences-react';
import {
  BUILT_IN_THEME_PRESETS,
  LAYOUT_OPTIONS,
  type BuiltinThemePreset,
  type LayoutType,
} from '@admin-core/preferences';

// 主色阶梯色
const primaryShades = [
  { name: '50', var: '--primary-50', textColor: '#000' },
  { name: '100', var: '--primary-100', textColor: '#000' },
  { name: '200', var: '--primary-200', textColor: '#000' },
  { name: '300', var: '--primary-300', textColor: '#000' },
  { name: '400', var: '--primary-400', textColor: '#fff' },
  { name: '500', var: '--primary-500', textColor: '#fff' },
  { name: '600', var: '--primary-600', textColor: '#fff' },
  { name: '700', var: '--primary-700', textColor: '#fff' },
  { name: '800', var: '--primary-800', textColor: '#fff' },
  { name: '900', var: '--primary-900', textColor: '#fff' },
  { name: '950', var: '--primary-950', textColor: '#fff' },
];

// 语义色
const semanticColors = [
  {
    name: 'semantic',
    label: '语义色 (Semantic)',
    shades: [
      { name: 'success', var: '--success', textColor: 'var(--success-foreground)' },
      { name: 'warning', var: '--warning', textColor: 'var(--warning-foreground)' },
      { name: 'destructive', var: '--destructive', textColor: 'var(--destructive-foreground)' },
      { name: 'info', var: '--info', textColor: 'var(--info-foreground)' },
    ],
  },
  {
    name: 'neutral',
    label: '中性色 (Neutral)',
    shades: [
      { name: 'background', var: '--background', textColor: 'var(--foreground)' },
      { name: 'card', var: '--card', textColor: 'var(--card-foreground)' },
      { name: 'muted', var: '--muted', textColor: 'var(--muted-foreground)' },
      { name: 'accent', var: '--accent', textColor: 'var(--accent-foreground)' },
      { name: 'border', var: '--border', textColor: 'var(--foreground)' },
    ],
  },
  {
    name: 'text',
    label: '文字色 (Text)',
    shades: [
      { name: 'foreground', var: '--foreground', textColor: 'var(--background)' },
      { name: 'muted-fg', var: '--muted-foreground', textColor: 'var(--background)' },
      { name: 'primary-fg', var: '--primary-foreground', textColor: 'var(--primary)' },
    ],
  },
];

function Home() {
  const { preferences, setPreferences } = usePreferences();
  const { actualThemeMode } = useTheme();
  const { currentLayout, setLayout } = useLayout();

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: 'var(--foreground)' }}>
        欢迎使用 Admin Core Preferences
      </h1>

      {/* 状态卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {actualThemeMode}
          </div>
          <div className="stat-label">当前主题模式</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {currentLayout}
          </div>
          <div className="stat-label">当前布局</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>
            {preferences.app.locale}
          </div>
          <div className="stat-label">当前语言</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--info)' }}>
            {preferences.theme.builtinType}
          </div>
          <div className="stat-label">主题预设</div>
        </div>
      </div>

      {/* 布局选择 - 使用 LayoutIcon 组件 */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">
          <AdminIcon name="layout" size="sm" style={{ marginRight: 8, verticalAlign: 'middle' }} />
          布局模式选择
        </h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {LAYOUT_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              onClick={() => setLayout(opt.value as LayoutType)}
              style={{
                cursor: 'pointer',
                padding: 12,
                borderRadius: 'var(--radius)',
                border: currentLayout === opt.value
                  ? '2px solid var(--primary)'
                  : '2px solid var(--border)',
                background: currentLayout === opt.value ? 'var(--accent)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
              title={opt.value}
            >
              <AdminLayoutIcon
                layout={opt.value as LayoutType}
                active={currentLayout === opt.value}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 功能介绍 */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">
          <AdminIcon name="info" size="sm" style={{ marginRight: 8, verticalAlign: 'middle' }} />
          功能特性
        </h2>
        <div className="card-content">
          <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2.2 }}>
            <li><AdminIcon name="sun" size="sm" style={{ marginRight: 8 }} /> 支持浅色/深色/跟随系统三种主题模式</li>
            <li><AdminIcon name="palette" size="sm" style={{ marginRight: 8 }} /> 14 种内置主题预设 + 自定义主色</li>
            <li><AdminIcon name="layout" size="sm" style={{ marginRight: 8 }} /> 7 种布局模式可视化选择</li>
            <li><AdminIcon name="globe" size="sm" style={{ marginRight: 8 }} /> 中英文国际化支持</li>
            <li><AdminIcon name="palette" size="sm" style={{ marginRight: 8 }} /> 基于 OKLCH 色彩空间的智能配色</li>
            <li><AdminIcon name="save" size="sm" style={{ marginRight: 8 }} /> 自动持久化到 localStorage</li>
            <li><AdminIcon name="settings" size="sm" style={{ marginRight: 8 }} /> 支持多种 UI 库适配</li>
          </ul>
        </div>
      </div>

      {/* 主题预设展示 */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">
          <AdminIcon name="palette" size="sm" style={{ marginRight: 8, verticalAlign: 'middle' }} />
          内置主题预设
        </h2>
        <div className="color-palette">
          {BUILT_IN_THEME_PRESETS.filter((p: BuiltinThemePreset) => p.type !== 'custom').map((preset: BuiltinThemePreset) => (
            <div
              key={preset.type}
              className="color-swatch"
              style={{
                backgroundColor: preset.color,
                border: preferences.theme.builtinType === preset.type
                  ? '3px solid var(--foreground)'
                  : 'none',
              }}
              onClick={() => setPreferences({ theme: { builtinType: preset.type } })}
              title={preset.type}
            >
              {preset.type.slice(0, 2)}
            </div>
          ))}
        </div>
      </div>

      {/* 阶梯色展示 */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">
          <AdminIcon name="palette" size="sm" style={{ marginRight: 8, verticalAlign: 'middle' }} />
          主色阶梯色 (Primary Scale)
        </h2>
        <div className="color-scale">
          {primaryShades.map((shade) => (
            <div
              key={shade.name}
              className="color-scale-item"
              style={{ backgroundColor: `var(${shade.var})` }}
            >
              <span className="color-scale-label" style={{ color: shade.textColor }}>{shade.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 语义色展示 */}
      <div className="card">
        <h2 className="card-title">
          <AdminIcon name="palette" size="sm" style={{ marginRight: 8, verticalAlign: 'middle' }} />
          语义色 (Semantic Colors)
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {semanticColors.map((group) => (
            <div key={group.name}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--foreground)' }}>
                {group.label}
              </div>
              <div className="color-scale">
                {group.shades.map((shade) => (
                  <div
                    key={shade.name}
                    className="color-scale-item"
                    style={{ backgroundColor: `var(${shade.var})` }}
                  >
                    <span className="color-scale-label" style={{ color: shade.textColor }}>{shade.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
