export function motionToken(name: string) {
  return typeof window === 'undefined' ? 0 : Number(getComputedStyle(document.documentElement).getPropertyValue(`--motion-${name}`));
}
