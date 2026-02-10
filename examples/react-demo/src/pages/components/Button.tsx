export default function ComponentsButton() {
  return (
    <div className="page-container">
      <h1 className="page-title">按钮</h1>
      <p className="page-description">按钮组件示例</p>

      <div className="card">
        <h2 className="card-title">基础按钮</h2>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-secondary">Secondary</button>
          <button className="btn bg-success text-white hover:opacity-90">Success</button>
          <button className="btn bg-destructive text-white hover:opacity-90">Danger</button>
          <button className="btn bg-warning text-white hover:opacity-90">Warning</button>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="card-title">按钮尺寸</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary px-2 py-1 text-xs">Small</button>
          <button className="btn btn-primary">Default</button>
          <button className="btn btn-primary px-6 py-3 text-base">Large</button>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="card-title">禁用状态</h2>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" disabled>Disabled</button>
          <button className="btn btn-secondary" disabled>Disabled</button>
        </div>
      </div>
    </div>
  );
}
