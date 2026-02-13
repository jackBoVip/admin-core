const BODY_OPEN_CLASS = 'admin-form-page-open';
const BODY_OPEN_COUNT_KEY = 'adminFormPageOpenCount';

function readOpenCount(body: HTMLElement) {
  const value = Number.parseInt(body.dataset[BODY_OPEN_COUNT_KEY] ?? '0', 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

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

