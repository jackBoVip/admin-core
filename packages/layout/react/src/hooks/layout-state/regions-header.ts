import { createLayoutHeaderStateController } from '@admin-core/layout';
import { useEffect, useMemo, useRef } from 'react';
import { useLayoutComputed, useLayoutContext, useLayoutState } from '../use-layout-context';

export function useHeaderState() {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const [state, setState] = useLayoutState();

  const height = computed.headerHeight;
  const visible = computed.showHeader;

  const stateHiddenRef = useRef(state.headerHidden);
  stateHiddenRef.current = state.headerHidden;
  const configHiddenRef = useRef(context.props.header?.hidden === true);
  configHiddenRef.current = context.props.header?.hidden === true;
  const modeRef = useRef(context.props.header?.mode);
  modeRef.current = context.props.header?.mode;
  const heightRef = useRef(height);
  heightRef.current = height;

  const controller = useMemo(
    () =>
      createLayoutHeaderStateController({
        getStateHidden: () => stateHiddenRef.current,
        getConfigHidden: () => configHiddenRef.current,
        getMode: () => modeRef.current,
        getHeaderHeight: () => heightRef.current,
        setStateHidden: (value: boolean) => {
          setState((prev) => (prev.headerHidden === value ? prev : { ...prev, headerHidden: value }));
        },
      }),
    [setState]
  );

  const snapshot = controller.getSnapshot();
  const hidden = snapshot.hidden;
  const mode = snapshot.mode;

  useEffect(() => {
    controller.start();
    return () => {
      controller.destroy();
    };
  }, [controller]);

  useEffect(() => {
    controller.sync();
  }, [controller, mode]);

  return {
    hidden,
    height,
    visible,
    mode,
    setHidden: controller.setHidden,
  };
}
