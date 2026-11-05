// THE ROVARD CORE, built from code. Nothing is downloaded.
//
// The idea is the studio's concept made into an object: BEYOND THE FRAME.
//   The Frame    A heavy obsidian block in the proportions of the logo's blue square (181:171),
//                hollowed out and broken open at one corner.
//   The Gate     A slim polished frame that interlocks with it at an angle.
//   The Current  One continuous liquid-metal form that gathers inside the opening
//                and leaves through the break, going where the frame could not hold it.
//   The Pane     A sheet of smoked glass that the Current passes straight through.
//   The Marks    A blue channel and a yellow key, exactly the logo's blue and the studio's yellow.
import { BoxGeometry, BufferGeometry, CatmullRomCurve3, ExtrudeGeometry, Float32BufferAttribute, Path, Shape, Vector3 } from 'three';

export const FRAME = { w: 2.42, h: 2.42 * (171 / 181), depth: 0.74 };

function bump(t, c, w) {
  const x = (t - c) / w;
  return Math.exp(-x * x);
}

export function frameGeometry() {
  const { w, h, depth } = FRAME;
  const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;
  // Deliberately uneven walls: heavy to the left and at the base, slight on the far side.
  const ix0 = x0 + 0.5, ix1 = x1 - 0.2, iy0 = y0 + 0.62, iy1 = y1 - 0.25;
  const s = new Shape();
  s.moveTo(x0, y0);
  s.lineTo(x1, y0);
  s.lineTo(x1, 0.2);               // right wall stops short: this is the break
  s.lineTo(ix1, 0.34);             // raked cut
  s.lineTo(ix1, iy0);
  s.lineTo(ix0, iy0);
  s.lineTo(ix0, iy1);
  s.lineTo(0.34, iy1);
  s.lineTo(0.56, y1);              // top wall ends in a raked cut, too
  s.lineTo(x0, y1);
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 4, steps: 1 });
  g.translate(0, 0, -depth / 2);
  return g;
}

// A slim portrait frame that threads the Frame's opening.
export function gateGeometry() {
  const w = 1.5, h = 3.3, bar = 0.036;
  const s = new Shape();
  s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
  const hole = new Path();
  hole.moveTo(-w / 2 + bar, -h / 2 + bar); hole.lineTo(-w / 2 + bar, h / 2 - bar); hole.lineTo(w / 2 - bar, h / 2 - bar); hole.lineTo(w / 2 - bar, -h / 2 + bar); hole.closePath();
  s.holes.push(hole);
  const g = new ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1, curveSegments: 2 });
  g.translate(0, 0, -0.035);
  return g;
}

// The Current: a sweep along one curve whose section swells, flattens and turns as it travels.
export function currentGeometry(rings = 240, sides = 36) {
  const curve = new CatmullRomCurve3([
    new Vector3(-2.0, 1.86, -1.3),
    new Vector3(-1.3, 1.32, -1.32),
    new Vector3(-0.62, 0.62, -1.06),
    new Vector3(-0.26, 0.0, -0.56),
    new Vector3(0.0, -0.26, 0.08),
    new Vector3(0.42, -0.08, 0.72),
    new Vector3(1.05, 0.36, 0.96),
    new Vector3(1.62, 0.92, 0.46),
    new Vector3(1.78, 1.52, -0.36),
    new Vector3(1.14, 1.92, -0.72),
    new Vector3(0.46, 1.86, -0.5),
  ], false, 'centripetal');
  const frames = curve.computeFrenetFrames(rings, false);
  const pts = curve.getSpacedPoints(rings);
  const pos = [], idx = [];
  const p = new Vector3();
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const taper = Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.985 + 0.0075)), 0.55);
    const major = taper * (0.075 + 0.3 * bump(t, 0.42, 0.17) + 0.26 * bump(t, 0.74, 0.12) + 0.14 * bump(t, 0.14, 0.11));
    const minor = taper * (0.024 + 0.15 * bump(t, 0.42, 0.13) + 0.022 * bump(t, 0.74, 0.16) + 0.03 * bump(t, 0.14, 0.11));
    const twist = 1.3 + 0.8 * Math.PI * t * t + 0.5 * Math.sin(t * 5.2);
    const N = frames.normals[i], B = frames.binormals[i];
    const ct = Math.cos(twist), st = Math.sin(twist);
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      // Slightly squared section: a surface that was drawn, rather than a tube.
      const ca = Math.cos(a), sa = Math.sin(a);
      const e = 0.82;
      const u = Math.sign(ca) * Math.pow(Math.abs(ca), e) * major;
      const v = Math.sign(sa) * Math.pow(Math.abs(sa), e) * minor;
      const c1 = u * ct - v * st, c2 = u * st + v * ct;
      p.copy(pts[i]).addScaledVector(N, c1).addScaledVector(B, c2);
      pos.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j, b = i * sides + (j + 1) % sides, c = a + sides, d = b + sides;
      idx.push(a, b, d, a, d, c);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function paneGeometry() {
  return new BoxGeometry(1.56, 1.42, 0.022);
}

// The architecture: one merged block of slabs, so it draws in one call.
export function slabs() {
  const list = [];
  const add = (x, z, w, h, d, y = 0) => list.push({ x, z, w, h, d, y });
  // Left wall of the corridor, stepped so it never reads as a repeated pattern.
  add(-9.4, -4, 2.2, 16, 3.4); add(-8.2, -9.5, 1.5, 16, 2.6); add(-10.4, -12.5, 3.4, 16, 4.4); add(-7.1, -16, 1.1, 16, 3); add(-8.8, -21, 2.6, 16, 5);
  // Right wall.
  add(9.8, -2.5, 2.8, 16, 3); add(8.1, -7, 1.2, 16, 2.4); add(10.4, -11, 3, 16, 4.8); add(7.4, -14.6, 0.9, 16, 2.2); add(9.2, -19, 2.8, 16, 4.6);
  // A lintel the eye passes under, and the back wall with its opening.
  add(-1.2, -13.5, 14, 2.2, 1.2, 6.1);
  add(-8.5, -25, 12, 16, 1); add(6.7, -25, 12, 16, 1);
  return list;
}
