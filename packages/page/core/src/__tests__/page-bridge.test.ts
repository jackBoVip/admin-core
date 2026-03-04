/**
 * Page 查询表单与表格桥接配置归一化测试。
 */
import { normalizePageFormTableBridgeOptions } from '../index';

describe('page form-table bridge', () => {
  it('normalizes boolean bridge options', () => {
    expect(normalizePageFormTableBridgeOptions(true)).toEqual({
      enabled: true,
      mapParams: undefined,
      queryOnSubmit: true,
      reloadOnReset: true,
    });
    expect(normalizePageFormTableBridgeOptions(false)).toEqual({
      enabled: false,
      mapParams: undefined,
      queryOnSubmit: true,
      reloadOnReset: true,
    });
  });

  it('normalizes object bridge options', () => {
    const mapParams = vi.fn((values: Record<string, unknown>) => values);
    expect(
      normalizePageFormTableBridgeOptions({
        enabled: true,
        mapParams,
        queryOnSubmit: false,
      })
    ).toEqual({
      enabled: true,
      mapParams,
      queryOnSubmit: false,
      reloadOnReset: true,
    });
  });
});
