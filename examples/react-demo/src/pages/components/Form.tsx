import { useState } from 'react';

export default function ComponentsForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    remember: false,
  });

  return (
    <div className="page-container">
      <h1 className="page-title">表单</h1>
      <p className="page-description">表单组件示例</p>

      <div className="card max-w-[500px]">
        <h2 className="card-title">登录表单</h2>
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 font-medium">用户名</label>
            <input
              type="text"
              placeholder="请输入用户名"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">邮箱</label>
            <input
              type="email"
              placeholder="请输入邮箱"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">密码</label>
            <input
              type="password"
              placeholder="请输入密码"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              checked={formData.remember}
              onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
              className="h-4 w-4"
            />
            <label htmlFor="remember">记住我</label>
          </div>
          <button type="submit" className="btn btn-primary w-full">登录</button>
        </form>
      </div>
    </div>
  );
}
