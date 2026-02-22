import type { VxeUIExport } from 'vxe-table';

import { getColumnValueByPath, setColumnValueByPath } from '@admin-core/table-core';
import { h } from 'vue';

export function registerBuiltinVueRenderers(vxeUI: VxeUIExport) {
  vxeUI.renderer.add('CellTag', {
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
    renderTableDefault({ attrs, props }, { column, row }) {
      const loadingKey = `__loading_${column.field}`;
      const field = String(column.field ?? '');
      const checkedValue = props?.checkedValue ?? 1;
      const uncheckedValue = props?.uncheckedValue ?? 0;
      const checked = getColumnValueByPath(row, field) === checkedValue;

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
