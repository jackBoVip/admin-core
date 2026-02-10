export default function About() {
  return (
    <div className="page-container">
      <h1 className="page-title">关于</h1>
      <p className="page-description">关于 Admin Core 布局包</p>

      <div className="card">
        <h2 className="card-title">项目信息</h2>
        <table className="data-table">
          <tbody>
            <tr>
              <td className="w-[200px] font-medium">项目名称</td>
              <td>@admin-core/layout-react</td>
            </tr>
            <tr>
              <td className="font-medium">版本</td>
              <td>0.0.1</td>
            </tr>
            <tr>
              <td className="font-medium">框架</td>
              <td>React 18 + TypeScript</td>
            </tr>
            <tr>
              <td className="font-medium">样式</td>
              <td>Tailwind CSS v4</td>
            </tr>
            <tr>
              <td className="font-medium">特性</td>
              <td>
                <ul className="m-0 pl-5 list-disc">
                  <li>开箱即用</li>
                  <li>深度集成 @preferences</li>
                  <li>自动标签页/面包屑</li>
                  <li>内置路由处理</li>
                  <li>响应式设计</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
