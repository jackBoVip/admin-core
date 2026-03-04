/**
 * Table React 内置渲染器集合。
 * @description 提供标签、开关、操作列等常用单元格/编辑渲染器注册实现。
 */
import type { TableRenderContext } from '@admin-core/table-core';

import { Button, Popconfirm, Space, Switch, Tag } from 'antd';
import { createElement } from 'react';

import { registerReactTableRenderer } from './registry';

/**
 * 规范化标签渲染选项。
 * @param value 原始选项配置。
 * @returns 统一选项数组。
 */
function normalizeOptions(value: any) {
  if (Array.isArray(value)) {
    return value;
  }
  return [
    { color: 'success', label: 'Enabled', value: 1 },
    { color: 'error', label: 'Disabled', value: 0 },
  ];
}

/**
 * 内置标签单元格渲染器。
 * @param context 渲染上下文。
 * @returns React 节点。
 */
function cellTag(context: TableRenderContext) {
  const options = normalizeOptions(context.options);
  const item = options.find((entry) => entry.value === context.value);
  return createElement(Tag, { color: item?.color ?? 'default' }, item?.label ?? String(context.value ?? ''));
}

/**
 * 内置开关单元格渲染器。
 * @param context 渲染上下文。
 * @returns React 节点。
 */
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

/**
 * 构建操作列按钮配置。
 * @param context 渲染上下文。
 * @returns 规范化后的操作项数组。
 */
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

/**
 * 内置操作列渲染器。
 * @param context 渲染上下文。
 * @returns React 节点。
 */
function cellOperation(context: TableRenderContext) {
  const operations = buildOperations(context);

  return createElement(
    Space,
    null,
    operations.map((item: any) => {
      const disabled = !!item.disabled;
      /**
       * 处理操作按钮点击
       * @description 在按钮可用时派发操作事件并透传当前行数据。
       * @returns 无返回值。
       */
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

/**
 * 注册 React 内置单元格渲染器。
 * @returns 无返回值。
 */
export function registerBuiltinReactRenderers() {
  registerReactTableRenderer('CellTag', cellTag);
  registerReactTableRenderer('CellSwitch', cellSwitch);
  registerReactTableRenderer('CellOperation', cellOperation);
}
