export interface DebouncedTask {
  cancel: () => void;
  run: () => void;
}

export function createDebouncedTask(task: () => void, delay = 300): DebouncedTask {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const cancel = () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
  };
  const run = () => {
    cancel();
    timer = setTimeout(() => {
      timer = null;
      task();
    }, delay);
  };
  return { cancel, run };
}
