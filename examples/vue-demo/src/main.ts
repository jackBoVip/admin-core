import { createApp } from 'vue';
import App from './App.vue';
import router, { setupRouteAccess } from './router';
import { h } from 'vue';
import { setupAdminPageVue } from '@admin-core/page-vue';
import { setupAdminTabsVue } from '@admin-core/tabs-vue';
import {
  VxeButton,
  VxeCheckbox,
  VxeCheckboxGroup,
  VxeDatePicker,
  VxeDateRangePicker,
  VxeInput,
  VxeNumberInput,
  VxePasswordInput,
  VxeRadioGroup,
  VxeSelect,
  VxeSwitch,
  VxeTextarea,
} from 'vxe-pc-ui';

// 样式
import './styles/index.css';

/**
 * 启动 Vue 示例应用。
 * @description 完成组件库适配注册、路由菜单初始化以及应用挂载。
 *
 * @returns 无返回值。
 */
async function bootstrap() {
  /**
   * 根据 `type` 动态切换输入组件。
   * @description 当 `type=number` 时使用 `VxeNumberInput`，其余场景回退为 `VxeInput`。
   *
   * @param props 组件属性。
   * @param slots 组件插槽。
   * @returns 适配后的输入组件 VNode。
   */
  const VxeAdaptiveInput = ((props: any, { slots }: any) => {
    const inputType = `${props?.type ?? ''}`.toLowerCase();
    const component = inputType === 'number' ? VxeNumberInput : VxeInput;
    return h(component as any, props, slots);
  }) as any;

  setupAdminPageVue({
    form: {
      library: 'vxe',
      libraries: {
        vxe: {
          capabilities: {
            customModelProp: true,
            slots: true,
          },
          components: {
            checkbox: VxeCheckbox as any,
            'checkbox-group': VxeCheckboxGroup as any,
            date: VxeDatePicker as any,
            'date-range': VxeDateRangePicker as any,
            'default-button': ((props: any, { slots }: any) =>
              h(
                VxeButton as any,
                {
                  ...props,
                  mode: 'text',
                },
                slots
              )) as any,
            input: VxeAdaptiveInput,
            password: VxePasswordInput as any,
            'primary-button': ((props: any, { slots }: any) =>
              h(
                VxeButton as any,
                {
                  ...props,
                  status: 'primary',
                },
                slots
              )) as any,
            'radio-group': VxeRadioGroup as any,
            select: VxeSelect as any,
            switch: VxeSwitch as any,
            textarea: VxeTextarea as any,
          },
          modelPropNameMap: {
            checkbox: 'modelValue',
            switch: 'modelValue',
          },
        },
      },
    },
    locale: 'zh-CN',
    table: {
      locale: 'zh-CN',
    },
  });
  setupAdminTabsVue({
    locale: {
      close: '关闭',
    },
  });

  /**
   * 路由访问初始化结果，包含布局菜单数据。
   */
  const { menus } = await setupRouteAccess();

  /**
   * Vue 应用实例。
   */
  const app = createApp(App, { menus });
  app.use(router);
  app.mount('#app');
}

bootstrap();
