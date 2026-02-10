export default function ComponentsCard() {
  return (
    <div className="page-container">
      <h1 className="page-title">卡片</h1>
      <p className="page-description">卡片布局与容器样式示例</p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="card-title">基础卡片</h2>
          <p className="text-sm text-muted-foreground">
            这是一个基础卡片示例，可用于展示概要信息或表单区块。
          </p>
        </div>

        <div className="card">
          <h2 className="card-title">带操作</h2>
          <p className="text-sm text-muted-foreground">
            卡片内容可以组合按钮或操作区域。
          </p>
          <div className="mt-4 flex gap-3">
            <button className="btn btn-primary">主要操作</button>
            <button className="btn btn-secondary">次要操作</button>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="card-title">信息列表</h2>
        <ul className="space-y-3 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">订单状态</span>
            <span className="font-medium">进行中</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">更新时间</span>
            <span className="font-medium">刚刚</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">负责人</span>
            <span className="font-medium">Admin User</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
