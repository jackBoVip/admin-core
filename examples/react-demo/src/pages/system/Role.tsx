export default function SystemRole() {
  return (
    <div className="page-container">
      <h1 className="page-title">角色管理</h1>
      <p className="page-description">管理系统角色与权限</p>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button className="btn btn-primary">+ 新增角色</button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>角色名称</th>
              <th>角色标识</th>
              <th>描述</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>超级管理员</td>
              <td>admin</td>
              <td>拥有所有权限</td>
              <td><span style={{ color: '#10b981' }}>启用</span></td>
              <td>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }}>编辑</button>
              </td>
            </tr>
            <tr>
              <td>普通用户</td>
              <td>user</td>
              <td>基础权限</td>
              <td><span style={{ color: '#10b981' }}>启用</span></td>
              <td>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }}>编辑</button>
              </td>
            </tr>
            <tr>
              <td>访客</td>
              <td>guest</td>
              <td>只读权限</td>
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
