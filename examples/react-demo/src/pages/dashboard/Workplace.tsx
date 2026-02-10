export default function DashboardWorkplace() {
  return (
    <div className="page-container">
      <h1 className="page-title">工作台</h1>
      <p className="page-description">欢迎回来，Admin！</p>

      <div className="grid gap-6 grid-cols-[2fr_1fr]">
        <div className="card">
          <h2 className="card-title">待办事项</h2>
          <ul className="list-none p-0 m-0">
            <li className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
              <input type="checkbox" className="h-[18px] w-[18px]" />
              <span>完成布局组件开发</span>
              <span className="ml-auto text-xs text-destructive">紧急</span>
            </li>
            <li className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
              <input type="checkbox" className="h-[18px] w-[18px]" />
              <span>编写单元测试</span>
              <span className="ml-auto text-xs text-warning">重要</span>
            </li>
            <li className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
              <input type="checkbox" defaultChecked className="h-[18px] w-[18px]" />
              <span className="line-through text-muted-foreground">更新文档</span>
              <span className="ml-auto text-xs text-success">已完成</span>
            </li>
            <li className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
              <input type="checkbox" className="h-[18px] w-[18px]" />
              <span>代码审查</span>
              <span className="ml-auto text-xs text-primary">普通</span>
            </li>
          </ul>
        </div>

        <div className="card">
          <h2 className="card-title">快捷操作</h2>
          <div className="grid grid-cols-2 gap-3">
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
