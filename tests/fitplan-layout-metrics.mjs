// Runs inside the real outer FitPlan document, where portal controls are mounted.
export function measureFitPlanControls() {
  const frame = document.getElementById('appFrame').getBoundingClientRect();
  const selectors = ['.portal-home-link', '.portal-preferences', '.offline-control', '.portal-ai-launch'];
  const controls = selectors.map(selector => {
    const element = document.querySelector(selector);
    if (!element) return { selector, missing: true };
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2);
    return {
      selector, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
      reachable: hit === element || element.contains(hit),
      overlapsApp: rect.left < frame.right && rect.right > frame.left && rect.top < frame.bottom && rect.bottom > frame.top
    };
  });
  const collisions = [];
  for (let i = 0; i < controls.length; i++) {
    for (let j = i + 1; j < controls.length; j++) {
      const a = controls[i], b = controls[j];
      if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) collisions.push([a.selector, b.selector]);
    }
  }
  return { width: innerWidth, height: innerHeight, frameBottom: frame.bottom, controls, collisions };
}

export function measureFitPlanAIPanel() {
  const panel = document.querySelector('.portal-ai-panel');
  const rect = panel.getBoundingClientRect();
  const blockers = ['.portal-home-link', '.portal-preferences', '.offline-control', '.portal-ai-launch'].filter(selector => {
    const element = document.querySelector(selector), r = element.getBoundingClientRect();
    if (r.left >= rect.right || r.right <= rect.left || r.top >= rect.bottom || r.bottom <= rect.top) return false;
    const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    return hit === element || element.contains(hit);
  });
  const actions = ['[data-ai-close]', '[data-ai-input]', '.portal-ai-send'].map(selector => {
    const element = panel.querySelector(selector), r = element.getBoundingClientRect();
    if (!r.width || !r.height) return { selector, visible: false };
    const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    return { selector, visible: true, reachable: hit === element || element.contains(hit) };
  });
  return { blockers, actions };
}

export function measureFitPlanOfflineNotice() {
  const toast = document.querySelector('.offline-toast'), rect = toast.getBoundingClientRect();
  const frame = document.getElementById('appFrame').getBoundingClientRect();
  return { visible: !toast.hidden, overlapsApp: rect.left < frame.right && rect.right > frame.left && rect.top < frame.bottom && rect.bottom > frame.top };
}
