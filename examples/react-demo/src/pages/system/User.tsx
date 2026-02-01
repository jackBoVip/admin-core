export default function SystemUser() {
  return (
    <div className="page-container">
      <h1 className="page-title">用户管理</h1>
      <p className="page-description">管理系统用户</p>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="搜索用户..." style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, width: 240 }} />
            <button className="btn btn-primary">搜索</button>
          </div>
          <button className="btn btn-primary">+ 新增用户</button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>姓名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>admin</td>
              <td>管理员</td>
              <td>admin@example.com</td>
              <td>超级管理员</td>
              <td><span style={{ color: '#10b981' }}>启用</span></td>
              <td>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }}>编辑</button>
              </td>
            </tr>
            <tr>
              <td>user1</td>
              <td>张三</td>
              <td>zhangsan@example.com</td>
              <td>普通用户</td>
              <td><span style={{ color: '#10b981' }}>启用</span></td>
              <td>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }}>编辑</button>
              </td>
            </tr>
            <tr>
              <td>user2</td>
              <td>李四</td>
              <td>lisi@example.com</td>
              <td>普通用户</td>
              <td><span style={{ color: '#ef4444' }}>禁用</span></td>
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
