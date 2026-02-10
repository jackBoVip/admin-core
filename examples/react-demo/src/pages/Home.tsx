export default function Home() {
  return (
    <div className="page-container">
      <h1 className="page-title">首页</h1>
      <p className="page-description">欢迎使用 React Layout Demo！</p>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-title">总访问量</div>
          <div className="stat-card-value">8,846</div>
          <div className="stat-card-trend up">↑ 12.5% 较昨日</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">活跃用户</div>
          <div className="stat-card-value">1,234</div>
          <div className="stat-card-trend up">↑ 8.2% 较昨日</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">订单数量</div>
          <div className="stat-card-value">456</div>
          <div className="stat-card-trend down">↓ 3.1% 较昨日</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">成交金额</div>
          <div className="stat-card-value">¥28,456</div>
          <div className="stat-card-trend up">↑ 15.3% 较昨日</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">快速开始</h2>
        <p>这是一个基于 <code>@admin-core/layout-react</code> 的布局演示项目。</p>
        <ul className="mt-4 pl-5 list-disc">
          <li>✅ 自动标签页管理</li>
          <li>✅ 自动面包屑导航</li>
          <li>✅ 内置路由处理</li>
          <li>✅ 响应式布局</li>
          <li>✅ 主题切换</li>
          <li>✅ 国际化支持</li>
        </ul>
      </div>
    </div>
  );
}
