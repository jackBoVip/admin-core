<script lang="ts">
/**
 * 内容刷新容器
 * @description 仅刷新路由视图内容，不影响内容区外层布局
 */
import { defineComponent, Fragment, h } from 'vue';
import { useLayoutContext } from '../../composables';

/**
 * 默认导出内容刷新容器组件。
 */
export default defineComponent({
  name: 'LayoutRefreshView',
  /**
   * 刷新视图渲染逻辑。
   * @param _props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(_, { slots }) {
    /**
     * 布局上下文
     * @description 读取刷新键以触发仅内容区域的重建。
     */
    const context = useLayoutContext();
    return () => h(Fragment, { key: context.state.refreshKey }, slots.default?.());
  },
});
</script>
