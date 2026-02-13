import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { setupAdminFormReact } from '@admin-core/form-react';
import { setupAdminTableReact } from '@admin-core/table-react';
import { Button, Checkbox, ConfigProvider, DatePicker, Input, Radio, Select, Switch } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// 样式
import './styles/index.css';

setupAdminFormReact({
  library: 'antd',
  libraries: {
    antd: {
      baseModelPropName: 'value',
      capabilities: {
        customModelProp: true,
        dateRange: true,
        slots: true,
      },
      components: {
        checkbox: Checkbox as any,
        'checkbox-group': Checkbox.Group as any,
        date: DatePicker as any,
        'date-range': ((props: any) => <DatePicker.RangePicker {...props} />) as any,
        'default-button': ((props: any) => <Button {...props} />) as any,
        input: Input as any,
        password: Input.Password as any,
        'primary-button': ((props: any) => <Button type="primary" {...props} />) as any,
        'radio-group': Radio.Group as any,
        select: Select as any,
        switch: Switch as any,
        textarea: Input.TextArea as any,
        time: ((props: any) => <DatePicker picker="time" {...props} />) as any,
      },
      modelPropNameMap: {
        checkbox: 'checked',
        switch: 'checked',
      },
    },
  },
});

setupAdminTableReact({
  locale: 'zh-CN',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);
