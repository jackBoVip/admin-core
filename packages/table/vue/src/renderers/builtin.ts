/**
 * Table Vue 内置渲染器集合。
 * @description 提供标签、开关、操作列等常用单元格/编辑渲染器注册实现。
 */
import type { VxeUIExport } from 'vxe-table';

import { getColumnValueByPath, setColumnValueByPath } from '@admin-core/table-core';
import { h } from 'vue';

/**
 * 注册 Vue 内置单元格渲染器。
 * @param vxeUI VXE UI 导出对象。
 * @returns 无返回值。
 */
export function registerBuiltinVueRenderers(vxeUI: VxeUIExport) {
  vxeUI.renderer.add('CellTag', {
    /**
     * 渲染标签单元格。
     * @param renderOptions 渲染配置。
     * @param context 列与行上下文。
     * @returns 标签节点。
     */
    renderTableDefault({ options, props }, { column, row }) {
      const value = getColumnValueByPath(row, column.field);
      const tagOptions = options ?? [
        { color: '#16a34a', label: 'Enabled', value: 1 },
        { color: '#dc2626', label: 'Disabled', value: 0 },
      ];
      const item = tagOptions.find((entry: any) => entry.value === value);
      return h(
        'span',
        {
          ...props,
          style: {
            backgroundColor: item?.color ?? '#64748b',
            borderRadius: '999px',
            color: '#fff',
            display: 'inline-flex',
            fontSize: '12px',
            lineHeight: 1,
            padding: '2px 8px',
          },
        },
        item?.label ?? String(value ?? '')
      );
    },
  });

  vxeUI.renderer.add('CellSwitch', {
    /**
     * 渲染开关单元格。
     * @param renderOptions 渲染配置。
     * @param context 列与行上下文。
     * @returns 开关节点。
     */
    renderTableDefault({ attrs, props }, { column, row }) {
      const loadingKey = `__loading_${column.field}`;
      const field = String(column.field ?? '');
      const checkedValue = props?.checkedValue ?? 1;
      const uncheckedValue = props?.uncheckedValue ?? 0;
      const checked = getColumnValueByPath(row, field) === checkedValue;

      /**
       * 处理开关状态切换事件，并在回调允许后同步写回行数据。
       * @param event 原生 change 事件对象。
       */
      const onChange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const nextValue = target.checked ? checkedValue : uncheckedValue;
        row[loadingKey] = true;
        try {
          const result = await attrs?.beforeChange?.(nextValue, row);
          if (result !== false) {
            setColumnValueByPath(row, field, nextValue);
          }
        } finally {
          row[loadingKey] = false;
        }
      };

      return h('input', {
        type: 'checkbox',
        checked,
        disabled: !!row[loadingKey],
        onChange,
      });
    },
  });

  vxeUI.renderer.add('CellOperation', {
    /**
     * 渲染操作列单元格。
     * @param renderOptions 渲染配置。
     * @param context 列与行上下文。
     * @returns 操作按钮节点集合。
     */
    renderTableDefault({ attrs, options, props }, { column, row }) {
      const defaultOperations = ['edit', 'delete'];
      const operationList = (options ?? defaultOperations).map((option: any) => {
        if (typeof option === 'string') {
          if (option === 'edit') return { code: 'edit', text: 'Edit' };
          if (option === 'delete') return { code: 'delete', text: 'Delete', danger: true };
          return { code: option, text: option };
        }
        return option;
      });

      const children = operationList
        .filter((item: any) => item.show !== false)
        .map((item: any) => {
          const disabled = typeof item.disabled === 'function' ? item.disabled(row) : !!item.disabled;

          return h(
            'button',
            {
              ...props,
              disabled,
              style: {
                background: 'transparent',
                border: 'none',
                color: item.danger ? '#dc2626' : '#2563eb',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                padding: '0 6px',
              },
              /**
               * 处理单条操作按钮点击，按需触发删除确认并回传操作信息。
               *
               * @returns 无返回值。
               */
              onClick: () => {
                if (disabled) return;
                if (item.code === 'delete') {
                  const confirmed = window.confirm(
                    `Are you sure to delete ${row[attrs?.nameField || 'name'] ?? ''}?`
                  );
                  if (!confirmed) return;
                }
                attrs?.onClick?.({
                  code: item.code,
                  row,
                });
              },
            },
            item.text ?? item.code
          );
        });

      return h(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent:
              column.align === 'left'
                ? 'flex-start'
                : column.align === 'center'
                  ? 'center'
                  : 'flex-end',
          },
        },
        children
      );
    },
  });
}
