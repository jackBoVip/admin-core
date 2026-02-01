export default function DashboardWorkplace() {
  return (
    <div className="page-container">
      <h1 className="page-title">工作台</h1>
      <p className="page-description">欢迎回来，Admin！</p>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="card">
          <h2 className="card-title">待办事项</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="checkbox" style={{ width: 18, height: 18 }} />
              <span>完成布局组件开发</span>
              <span style={{ marginLeft: 'auto', color: '#ef4444', fontSize: 12 }}>紧急</span>
            </li>
            <li style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="checkbox" style={{ width: 18, height: 18 }} />
              <span>编写单元测试</span>
              <span style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: 12 }}>重要</span>
            </li>
            <li style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
              <span style={{ textDecoration: 'line-through', color: '#9ca3af' }}>更新文档</span>
              <span style={{ marginLeft: 'auto', color: '#10b981', fontSize: 12 }}>已完成</span>
            </li>
            <li style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="checkbox" style={{ width: 18, height: 18 }} />
              <span>代码审查</span>
              <span style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: 12 }}>普通</span>
            </li>
          </ul>
        </div>

        <div className="card">
          <h2 className="card-title">快捷操作</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <button className="btn btn-primary">新建项目</button>
            <button className="btn btn-secondary">上传文件</button>
            <button className="btn btn-secondary">导出数据</button>
            <button className="btn btn-secondary">系统设置</button>
          </div>
        </div>
      </div>
    </div>
  );
}
