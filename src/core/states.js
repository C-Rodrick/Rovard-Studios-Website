// Presentation states for the one Core component. Every page and section picks from these,
// and the scroll timeline only ever moves between them. Nothing else moves the object.
//
// core: where the sculpture sits and how it is turned.   cam: the camera.   light: the rig.
// Positions are for a wide screen. `portrait` overrides are merged in for tall screens.

const base = {
  cx: 0, cy: 0, cz: 0, rx: 0.1, ry: -0.42, rz: 0.03, scale: 1,
  camX: 0, camY: 0.35, camZ: 11, lookX: 0, lookY: 0.2, lookZ: -1, fov: 30,
  key: 1, fill: 1, rim: 1, blue: 1, yellow: 1, glow: 1, env: 1, arch: 1,
};

export const STATES = {
  // Above the headline, on the right, large enough to read as an object in a room.
  hero: { ...base, cx: 2.2, cy: 0.98, ry: -0.5, scale: 0.92, lookY: 0.34,
    portrait: { cx: -0.12, cy: 1.42, scale: 0.72, camZ: 13.5 } },
  // Pulled back down the corridor. The room becomes the subject.
  recede: { ...base, cx: 0.4, cy: 0.6, cz: -8.5, ry: 0.3, rx: 0.02, scale: 0.86, camX: -0.9, camY: 0.9, camZ: 9.4, lookY: 1.1, key: 0.55, fill: 0.5, rim: 1.15, blue: 1.75, yellow: 0.5, glow: 1.5,
    portrait: { cx: 0.2, cy: 4.4, camX: 0, camZ: 12 } },
  // Covered by the gallery plate: settle somewhere cheap and stop.
  rest: { ...base, cx: 3.3, cy: 0.3, cz: -2, ry: 0.9, scale: 0.8, key: 0.5, rim: 0.8, blue: 1.1, yellow: 0.6, glow: 0.8,
    portrait: { cx: 0.8, cy: 2.4 } },
  // Off to one side while the disciplines are listed: present but not competing.
  capabilities: { ...base, cx: 3.3, cy: 0.1, cz: -0.6, rx: -0.04, ry: -0.72, rz: -0.08, scale: 1.04, camX: 0.4, lookX: 0.4, key: 0.6, fill: 0.7, rim: 1.25, blue: 1.4, yellow: 1.2, glow: 0.9,
    portrait: { cx: 0.3, cy: 1.75, scale: 0.68, camZ: 13.5 } },
  // The closing composition: centred, close, and lit from behind.
  closing: { ...base, cx: 0, cy: 0.95, cz: 0.6, ry: -0.86, rx: 0.14, rz: -0.03, scale: 0.92, camY: 0.1, lookY: 0.3, key: 0.82, fill: 0.7, rim: 1.5, blue: 1.45, yellow: 1.3, glow: 1.3,
    portrait: { cy: 1.75, scale: 0.68, camZ: 13.5 } },
  // Inner-page versions.
  studio: { ...base, cx: 3.05, cy: 0.42, ry: 0.32, rz: -0.06, scale: 1, key: 0.82, rim: 1.25, blue: 1.25, glow: 1.1,
    portrait: { cx: 0.5, cy: 2.3, scale: 0.72, camZ: 13.5 } },
  contact: { ...base, cx: 3.15, cy: 0.1, ry: -1.02, rx: 0.2, scale: 0.92, key: 0.75, rim: 1.2, blue: 1.2, yellow: 1.2,
    portrait: { cx: 0.6, cy: 2.5, scale: 0.68, camZ: 13.5 } },
};

export const KEYS = Object.keys(base);

export function stateFor(name, isPortrait) {
  const s = STATES[name] || STATES.hero;
  const out = {};
  for (const k of KEYS) out[k] = s[k];
  if (isPortrait && s.portrait) Object.assign(out, s.portrait);
  return out;
}
