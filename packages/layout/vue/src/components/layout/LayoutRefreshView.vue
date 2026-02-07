<script lang="ts">
/**
 * 内容刷新容器
 * @description 仅刷新路由视图内容，不影响内容区外层布局
 */
import { defineComponent, Fragment, h } from 'vue';
import { useLayoutContext } from '../../composables';

export default defineComponent({
  name: 'LayoutRefreshView',
  setup(_, { slots }) {
    const context = useLayoutContext();
    return () => h(Fragment, { key: context.state.refreshKey }, slots.default?.());
  },
});
</script>
