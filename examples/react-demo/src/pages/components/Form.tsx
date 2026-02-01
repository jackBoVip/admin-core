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

      <div className="card" style={{ maxWidth: 500 }}>
        <h2 className="card-title">登录表单</h2>
        <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>用户名</label>
            <input
              type="text"
              placeholder="请输入用户名"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>邮箱</label>
            <input
              type="email"
              placeholder="请输入邮箱"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>密码</label>
            <input
              type="password"
              placeholder="请输入密码"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="remember"
              checked={formData.remember}
              onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
              style={{ width: 16, height: 16 }}
            />
            <label htmlFor="remember">记住我</label>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>登录</button>
        </form>
      </div>
    </div>
  );
}
