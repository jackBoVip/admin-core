export default function ComponentsButton() {
  return (
    <div className="page-container">
      <h1 className="page-title">按钮</h1>
      <p className="page-description">按钮组件示例</p>

      <div className="card">
        <h2 className="card-title">基础按钮</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-secondary">Secondary</button>
          <button className="btn" style={{ background: '#10b981', color: 'white' }}>Success</button>
          <button className="btn" style={{ background: '#ef4444', color: 'white' }}>Danger</button>
          <button className="btn" style={{ background: '#f59e0b', color: 'white' }}>Warning</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 className="card-title">按钮尺寸</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 12 }}>Small</button>
          <button className="btn btn-primary">Default</button>
          <button className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 16 }}>Large</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 className="card-title">禁用状态</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Disabled</button>
          <button className="btn btn-secondary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Disabled</button>
        </div>
      </div>
    </div>
  );
}
