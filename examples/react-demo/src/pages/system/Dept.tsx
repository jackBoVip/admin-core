export default function SystemDept() {
  return (
    <div className="page-container">
      <h1 className="page-title">部门管理</h1>
      <p className="page-description">管理组织部门结构</p>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button className="btn btn-primary">+ 新增部门</button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>部门名称</th>
              <th>负责人</th>
              <th>人数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>总公司</td>
              <td>王总</td>
              <td>100</td>
              <td><span style={{ color: '#10b981' }}>启用</span></td>
              <td>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }}>编辑</button>
              </td>
            </tr>
            <tr>
              <td style={{ paddingLeft: 24 }}>├ 技术部</td>
              <td>张经理</td>
              <td>30</td>
              <td><span style={{ color: '#10b981' }}>启用</span></td>
              <td>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }}>编辑</button>
              </td>
            </tr>
            <tr>
              <td style={{ paddingLeft: 24 }}>├ 产品部</td>
              <td>李经理</td>
              <td>20</td>
              <td><span style={{ color: '#10b981' }}>启用</span></td>
              <td>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }}>编辑</button>
              </td>
            </tr>
            <tr>
              <td style={{ paddingLeft: 24 }}>└ 运营部</td>
              <td>赵经理</td>
              <td>15</td>
              <td><span style={{ color: '#10b981' }}>启用</span></td>
              <td>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }}>编辑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
