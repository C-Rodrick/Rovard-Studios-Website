// Decides whether this device should run real-time WebGL at all, and at what quality.
// Kept apart from core.js so that devices that say no never download Three.js.
export function hasRealGPU(search = location.search) {
  const force = /[?&]core=(force|poster)/.test(search);
  const nav = navigator;
  if (force) return true;
  if (nav.connection?.saveData || (nav.deviceMemory && nav.deviceMemory < 4) || (nav.hardwareConcurrency && nav.hardwareConcurrency < 4)) return false;
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
  if (!gl) return false;
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const name = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return !/swiftshader|llvmpipe|software|basic render/i.test(name);
}

export function coreQuality() {
  if (!hasRealGPU()) return null;
  const small = innerWidth < 1024 || matchMedia('(pointer: coarse)').matches;
  return small ? { detail: 24, dpr: 1.25, particles: 0, aa: false } : { detail: 56, dpr: 1.75, particles: 240, aa: true };
}
