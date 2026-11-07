// Installed before parsing: no wait for load/document.fonts.ready before sampling.
export function observeLayout() {
  const selectors = ['.site-header', '.header-inner', '.brand img', '.mobile-menu summary', '.menu-label', '.menu-glyph', '.desktop-nav', '.header-phone', 'main', 'main > :first-child', 'h1', '.lead', '.intro-photo', '.intro-photo img', 'main > section:nth-of-type(2)', '.service-choice', '.contact-grid'];
  const data = window.__layout = { frames: [], fonts: [], shifts: [], styleStates: [], clsSupported: PerformanceObserver.supportedEntryTypes.includes('layout-shift') };
  let previous = '';
  let previousStyle;
  function sample() {
    const styled = getComputedStyle(document.documentElement).getPropertyValue('--header-height').trim();
    if (styled !== previousStyle) { data.styleStates.push({ time: performance.now(), styled: Boolean(styled) }); previousStyle = styled; }
    if (styled && document.querySelector('main > :first-child')) {
      const boxes = {};
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (!element || !element.getClientRects().length) continue;
        // A following sibling proves the parser has closed this element (or an
        // ancestor). Do not mistake HTML still being appended below the fold
        // for a geometry regression. Complete headers/heroes are sampled even
        // while the rest of the document is still streaming.
        let parsed = document.readyState !== 'loading';
        for (let node = element; node && !parsed; node = node.parentElement) parsed = Boolean(node.nextSibling);
        if (!parsed) continue;
        const { x, y, width, height } = element.getBoundingClientRect();
        boxes[selector] = { x, y: y + scrollY, width, height };
      }
      const frame = { boxes, parsing: document.readyState === 'loading', viewport: document.documentElement.clientWidth, fontStatus: document.fonts.status, loaded: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family) };
      const key = JSON.stringify(frame);
      if (key !== previous) { data.frames.push({ time: performance.now(), ...frame }); previous = key; }
    }
    requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
  for (const type of ['loading', 'loadingdone', 'loadingerror']) document.fonts.addEventListener(type, event => {
    data.fonts.push({ type, time: performance.now(), faces: [...(event.fontfaces || [])].map(f => ({ family: f.family, weight: f.weight, status: f.status })) });
  });
  if (data.clsSupported) new PerformanceObserver(list => {
    for (const entry of list.getEntries()) data.shifts.push({ time: entry.startTime, value: entry.value, hadRecentInput: entry.hadRecentInput, sources: entry.sources.map(source => ({ node: source.node?.className || source.node?.nodeName, previous: source.previousRect.toJSON(), current: source.currentRect.toJSON() })) });
  }).observe({ type: 'layout-shift', buffered: true });
}

export function geometryChanges(frames) {
  const changes = {};
  for (const selector of new Set(frames.flatMap(frame => Object.keys(frame.boxes)))) {
    const boxes = frames.map(frame => frame.boxes[selector]).filter(Boolean);
    changes[selector] = Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, Math.max(...boxes.map(box => box[key])) - Math.min(...boxes.map(box => box[key]))]));
  }
  return changes;
}

export function clsValue(shifts) {
  let max = 0, value = 0, start = 0, last = 0;
  for (const shift of shifts.filter(s => !s.hadRecentInput)) {
    if (shift.time - last > 1000 || shift.time - start > 5000) { value = 0; start = shift.time; }
    value += shift.value; last = shift.time; max = Math.max(max, value);
  }
  return max;
}
