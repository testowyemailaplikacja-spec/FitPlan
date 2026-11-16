(() => {
  'use strict';
  const frame = document.getElementById('appFrame');
  if (frame && !Object.getOwnPropertyDescriptor(window, 'FitPlanState')) {
    Object.defineProperty(window, 'FitPlanState', { get: () => frame.contentWindow?.FitPlanState || null });
  }
  function progress() {
    const state = frame ? frame.contentWindow?.FitPlanState : window.FitPlanState;
    if (!state) throw new Error('FitPlan state is not ready');
    return state.progress;
  }
  const api = Object.freeze({
    get key() { return progress().key; },
    read: () => progress().read(), write: value => progress().write(value),
    completed: () => progress().completed(), isCompleted: id => progress().isCompleted(id),
    setCompleted: (id, value = true) => progress().setCompleted(id, value)
  });
  if (!window.FitPlanProgress) Object.defineProperty(window, 'FitPlanProgress', { value: api });
  window.dispatchEvent(new CustomEvent('fitplan:progress:ready'));
})();
