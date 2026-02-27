import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { setupAdminPageReact } from '@admin-core/page-react';
import { setupAdminTabsReact } from '@admin-core/tabs-react';
import {
  initPreferences,
  useAdminAntdTheme,
  usePreferences,
} from '@admin-core/layout-react';
import {
  Button,
  Checkbox,
  ConfigProvider,
  DatePicker,
  Input,
  Radio,
  Select,
  Switch,
  theme as antdTheme,
} from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';

// 样式
import './styles/index.css';

initPreferences({ namespace: 'admin-core' });

setupAdminPageReact({
  form: {
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
  },
  locale: 'zh-CN',
  table: {
    locale: 'zh-CN',
  },
});
setupAdminTabsReact({
  locale: {
    close: '关闭',
  },
});

function AppProviders() {
  const antdThemeConfig = useAdminAntdTheme({
    algorithms: {
      dark: antdTheme.darkAlgorithm,
      light: antdTheme.defaultAlgorithm,
    },
    cssVar: { key: 'admin-core' },
  });
  const { preferences } = usePreferences();
  const antdLocale =
    preferences.app.locale === 'en-US'
      ? enUS
      : zhCN;

  return (
    <ConfigProvider locale={antdLocale} theme={antdThemeConfig as any}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>
);
