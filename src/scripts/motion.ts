export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export function motionOptions(): KeyframeAnimationOptions {
  // Inline modules may run before CSS in WebKit. Read tokens when an interaction
  // starts, not at module evaluation; also accept the optimizer's seconds syntax.
  const style = getComputedStyle(document.documentElement);
  const value = style.getPropertyValue('--motion-duration').trim();
  const duration = parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
  return {
    duration: reducedMotion.matches || !Number.isFinite(duration) ? 0 : duration,
    easing: style.getPropertyValue('--motion-easing').trim() || 'linear',
    fill: 'both',
  };
}
