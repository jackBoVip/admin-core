import type { TableRenderContext } from '@admin-core/table-core';

import { Button, Popconfirm, Space, Switch, Tag } from 'antd';
import { createElement } from 'react';

import { registerReactTableRenderer } from './registry';

function normalizeOptions(value: any) {
  if (Array.isArray(value)) {
    return value;
  }
  return [
    { color: 'success', label: 'Enabled', value: 1 },
    { color: 'error', label: 'Disabled', value: 0 },
  ];
}

function cellTag(context: TableRenderContext) {
  const options = normalizeOptions(context.options);
  const item = options.find((entry) => entry.value === context.value);
  return createElement(Tag, { color: item?.color ?? 'default' }, item?.label ?? String(context.value ?? ''));
}

function cellSwitch(context: TableRenderContext) {
  const checkedValue = context.props?.checkedValue ?? 1;
  const uncheckedValue = context.props?.uncheckedValue ?? 0;
  const checked = context.value === checkedValue;

  return createElement(Switch, {
    checked,
    onChange: async (nextChecked: boolean) => {
      const nextValue = nextChecked ? checkedValue : uncheckedValue;
      const result = await context.attrs?.beforeChange?.(nextValue, context.row);
      if (result === false) return;
      if (context.column.field) {
        context.row[context.column.field] = nextValue;
      }
    },
  });
}

function buildOperations(context: TableRenderContext) {
  const presets: Record<string, Record<string, any>> = {
    delete: { code: 'delete', danger: true, text: 'Delete' },
    edit: { code: 'edit', text: 'Edit' },
  };

  const options = (context.options || ['edit', 'delete']).map((item: any) => {
    if (typeof item === 'string') {
      return presets[item] ? { ...presets[item] } : { code: item, text: item };
    }
    return { ...(presets[item.code] ?? {}), ...item };
  });

  return options
    .map((item: any) => {
      const normalized: Record<string, any> = {};
      Object.keys(item).forEach((key) => {
        const value = item[key];
        normalized[key] = typeof value === 'function' ? value(context.row) : value;
      });
      return normalized;
    })
    .filter((item: any) => item.show !== false);
}

function cellOperation(context: TableRenderContext) {
  const operations = buildOperations(context);

  return createElement(
    Space,
    null,
    operations.map((item: any) => {
      const disabled = !!item.disabled;
      const onClick = () => {
        if (disabled) return;
        context.attrs?.onClick?.({
          code: item.code,
          row: context.row,
        });
      };

      if (item.code === 'delete') {
        return createElement(
          Popconfirm,
          {
            key: String(item.code),
            title: `Delete ${context.row[context.attrs?.nameField || 'name'] ?? ''}?`,
            onConfirm: onClick,
          },
          createElement(Button, { danger: !!item.danger, size: 'small', type: 'link', disabled }, item.text)
        );
      }

      return createElement(
        Button,
        {
          key: String(item.code),
          danger: !!item.danger,
          disabled,
          size: 'small',
          type: 'link',
          onClick,
        },
        item.text
      );
    })
  );
}

export function registerBuiltinReactRenderers() {
  registerReactTableRenderer('CellTag', cellTag);
  registerReactTableRenderer('CellSwitch', cellSwitch);
  registerReactTableRenderer('CellOperation', cellOperation);
}
