/** 页面提交弹层打开时挂到 `body` 的标记类名。 */
const BODY_OPEN_CLASS = 'admin-form-page-open';
/** `body.dataset` 中记录弹层打开计数的键名。 */
const BODY_OPEN_COUNT_KEY = 'adminFormPageOpenCount';

/**
 * 读取页面级提交弹层的打开计数。
 * @param body `document.body` 元素。
 * @returns 当前有效打开计数，异常值会回退为 `0`。
 */
function readOpenCount(body: HTMLElement) {
  const value = Number.parseInt(body.dataset[BODY_OPEN_COUNT_KEY] ?? '0', 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * 为页面提交弹层保留 body 样式类并返回释放函数。
 * @description 通过引用计数避免多个弹层相互覆盖，最后一个关闭时再移除样式类。
 * @returns 当前调用对应的释放函数。
 */
export function retainSubmitPageBodyClass() {
  if (typeof document === 'undefined') {
    return () => {};
  }
  const body = document.body;
  if (!body) {
    return () => {};
  }

  body.dataset[BODY_OPEN_COUNT_KEY] = String(readOpenCount(body) + 1);
  body.classList.add(BODY_OPEN_CLASS);

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;

    const nextCount = Math.max(readOpenCount(body) - 1, 0);
    if (nextCount === 0) {
      delete body.dataset[BODY_OPEN_COUNT_KEY];
      body.classList.remove(BODY_OPEN_CLASS);
      return;
    }
    body.dataset[BODY_OPEN_COUNT_KEY] = String(nextCount);
  };
}
