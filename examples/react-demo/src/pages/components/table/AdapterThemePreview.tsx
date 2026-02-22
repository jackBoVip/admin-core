import { getReactFormAdapterRegistry } from '@admin-core/form-react';
import { Button, Checkbox, Input, Select, Switch } from 'antd';
import { useEffect, useState } from 'react';

export function resolveTablePopupContainer(triggerNode: HTMLElement) {
  const nearest = triggerNode?.closest?.('.admin-table');
  if (nearest instanceof HTMLElement) {
    return nearest;
  }
  if (triggerNode?.parentElement) {
    return triggerNode.parentElement;
  }
  return document.body;
}

export function AdapterThemePreview() {
  const [themeSnapshot, setThemeSnapshot] = useState({
    antPrimary: '',
    primary: '',
  });
  const activeFormLibrary = getReactFormAdapterRegistry().getActiveLibrary();

  useEffect(() => {
    const syncThemeSnapshot = () => {
      const styles = getComputedStyle(document.documentElement);
      setThemeSnapshot({
        antPrimary: styles.getPropertyValue('--ant-color-primary').trim(),
        primary: styles.getPropertyValue('--primary').trim(),
      });
    };

    syncThemeSnapshot();

    const observer = new MutationObserver(() => {
      syncThemeSnapshot();
    });
    observer.observe(document.documentElement, {
      attributeFilter: ['class', 'data-theme', 'style'],
      attributes: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <p className="page-description" style={{ marginBottom: 12 }}>
        第三方组件库验证：{activeFormLibrary} | --primary: {themeSnapshot.primary || '-'} |
        --ant-color-primary: {themeSnapshot.antPrimary || '-'}
      </p>
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <Switch defaultChecked size="small" />
        <Checkbox defaultChecked>Checkbox</Checkbox>
        <Select
          defaultValue="medium"
          getPopupContainer={resolveTablePopupContainer}
          options={[
            { label: '高', value: 'high' },
            { label: '中', value: 'medium' },
            { label: '低', value: 'low' },
          ]}
          size="small"
          style={{ width: 120 }}
        />
        <Input defaultValue="Theme Adapter" size="small" style={{ width: 180 }} />
        <Button size="small" type="primary">
          主按钮
        </Button>
      </div>
    </div>
  );
}
