export default function DashboardAnalysis() {
  return (
    <div className="page-container">
      <h1 className="page-title">分析页</h1>
      <p className="page-description">数据分析与统计</p>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-title">页面浏览量</div>
          <div className="stat-card-value">12,345</div>
          <div className="stat-card-trend up">↑ 20.5%</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">独立访客</div>
          <div className="stat-card-value">3,456</div>
          <div className="stat-card-trend up">↑ 15.2%</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">跳出率</div>
          <div className="stat-card-value">32.5%</div>
          <div className="stat-card-trend down">↓ 5.1%</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">平均停留时长</div>
          <div className="stat-card-value">4m 32s</div>
          <div className="stat-card-trend up">↑ 8.3%</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">图表区域</h2>
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: 8 }}>
          <span style={{ color: '#9ca3af' }}>图表占位符</span>
        </div>
      </div>
    </div>
  );
}
