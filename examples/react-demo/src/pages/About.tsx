function About() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: 'var(--foreground)' }}>
        关于
      </h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Admin Core Preferences</h2>
        <div className="card-content">
          <p style={{ marginBottom: 16 }}>
            这是一个与框架无关的偏好设置管理包，提供完整的主题、布局、国际化等配置功能。
          </p>

          <h3 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--foreground)' }}>包结构</h3>
          <ul style={{ listStyle: 'disc', paddingLeft: 20, lineHeight: 2, marginBottom: 16 }}>
            <li><code>@admin-core/preferences</code> - 核心包（框架无关）</li>
            <li><code>@admin-core/preferences-vue</code> - Vue 3 集成</li>
            <li><code>@admin-core/preferences-react</code> - React 18 集成</li>
          </ul>

          <h3 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--foreground)' }}>技术特点</h3>
          <ul style={{ listStyle: 'disc', paddingLeft: 20, lineHeight: 2, marginBottom: 16 }}>
            <li>基于 OKLCH 色彩空间的智能配色系统</li>
            <li>仅需配置主色，自动派生语义色</li>
            <li>支持 Tailwind CSS v4 预设</li>
            <li>适配多种 UI 库（Ant Design, Element Plus, Naive UI, shadcn/ui）</li>
            <li>完整的 TypeScript 类型定义</li>
            <li>自动持久化与系统主题监听</li>
          </ul>

          <h3 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--foreground)' }}>使用方式</h3>
          <pre
            style={{
              background: 'var(--muted)',
              padding: 16,
              borderRadius: 'var(--radius)',
              overflow: 'auto',
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
{`// React 18
import { initPreferences, usePreferences, PreferencesDrawer } from '@admin-core/preferences-react';

// 初始化
initPreferences({ namespace: 'my-app' });

// 使用 Hook
const { preferences, setPreferences } = usePreferences();

// 使用抽屉组件
<PreferencesDrawer open={open} onClose={() => setOpen(false)} />`}
          </pre>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">链接</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <a
            href="https://github.com"
            target="_blank"
            className="btn btn-secondary"
          >
            GitHub
          </a>
          <a href="#" className="btn btn-secondary">
            文档
          </a>
        </div>
      </div>
    </div>
  );
}

export default About;
