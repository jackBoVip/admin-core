export default function SystemMenu() {
  return (
    <div className="page-container">
      <h1 className="page-title">菜单管理</h1>
      <p className="page-description">管理系统菜单配置</p>

      <div className="card">
        <div className="flex justify-end mb-4">
          <button className="btn btn-primary">+ 新增菜单</button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>菜单名称</th>
              <th>路径</th>
              <th>图标</th>
              <th>排序</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>首页</td>
              <td>/</td>
              <td>home</td>
              <td>1</td>
              <td><span className="text-success">显示</span></td>
              <td>
                <button className="btn btn-secondary px-2 py-1 text-xs">编辑</button>
              </td>
            </tr>
            <tr>
              <td className="pl-6">├ 仪表盘</td>
              <td>/dashboard</td>
              <td>dashboard</td>
              <td>2</td>
              <td><span className="text-success">显示</span></td>
              <td>
                <button className="btn btn-secondary px-2 py-1 text-xs">编辑</button>
              </td>
            </tr>
            <tr>
              <td className="pl-12">│ ├ 分析页</td>
              <td>/dashboard/analysis</td>
              <td>chart</td>
              <td>1</td>
              <td><span className="text-success">显示</span></td>
              <td>
                <button className="btn btn-secondary px-2 py-1 text-xs">编辑</button>
              </td>
            </tr>
            <tr>
              <td className="pl-12">│ └ 监控页</td>
              <td>/dashboard/monitor</td>
              <td>monitor</td>
              <td>2</td>
              <td><span className="text-success">显示</span></td>
              <td>
                <button className="btn btn-secondary px-2 py-1 text-xs">编辑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
