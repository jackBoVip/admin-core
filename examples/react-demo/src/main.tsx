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

/**
 * 偏好系统初始化参数。
 */
const preferencesInitOptions = { namespace: 'admin-core' };

initPreferences(preferencesInitOptions);

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

/**
 * React 示例应用 Provider 组合器。
 * @description 注入 antd 主题、国际化以及路由上下文。
 */
function AppProviders() {
  /**
   * antd 主题配置（由偏好设置驱动）。
   */
  const antdThemeConfig = useAdminAntdTheme({
    algorithms: {
      dark: antdTheme.darkAlgorithm,
      light: antdTheme.defaultAlgorithm,
    },
    cssVar: { key: 'admin-core' },
  });

  /**
   * 当前偏好设置快照。
   */
  const { preferences } = usePreferences();

  /**
   * antd 国际化配置。
   */
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

/**
 * 应用挂载根节点。
 */
const rootElement = document.getElementById('root')!;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>
);
