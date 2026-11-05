// The Core's reflections: a small procedural room (cobalt walls, soft light, one yellow strip).
import {
  BackSide, BoxGeometry, Color, CubeCamera, HalfFloatType, LinearMipmapLinearFilter, Mesh, MeshBasicMaterial, Scene, SphereGeometry,
  WebGLCubeRenderTarget,
} from 'three';

function room() {
  const s = new Scene();
  s.add(new Mesh(new SphereGeometry(30, 16, 12), new MeshBasicMaterial({ color: new Color(0.03, 0.05, 0.16), side: BackSide })));
  const panel = (rgb, gain, w, h, x, y, z) => {
    const m = new Mesh(new BoxGeometry(w, h, 0.1), new MeshBasicMaterial({ color: new Color(rgb[0] * gain, rgb[1] * gain, rgb[2] * gain) }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  panel([1, 1, 1], 3.2, 20, 6, 0, 12, 3);            // overhead softbox
  panel([0.14, 0.34, 1], 6, 12, 20, -14, 0, 3);      // cobalt wall
  panel([0.14, 0.34, 1], 3.5, 20, 12, 0, -12, 6);    // cobalt floor bounce
  panel([0.14, 0.34, 1], 2.2, 12, 20, 14, -2, -6);   // far cobalt wall
  panel([1, 0.85, 0.22], 12, 1.4, 14, 13, 2, 7);     // signal-yellow strip
  panel([1, 1, 1], 5, 1.6, 13, 6, 0, 14);            // key strip
  panel([0.6, 0.72, 1], 4, 14, 4, -5, 7, -13);       // rim
  return s;
}

// Three's PMREMGenerator gives slightly more accurate blur, but compiling its filter shader froze the page for
// 2 to 3 seconds on a first visit. Plain mipmaps of the same room look right on this material and cost almost nothing.
const SIZE = 256, LEVELS = 6;

export function environment(renderer) {
  const scene = room();
  const target = new WebGLCubeRenderTarget(SIZE, { type: HalfFloatType, generateMipmaps: true, minFilter: LinearMipmapLinearFilter });
  new CubeCamera(0.1, 100, target).update(renderer, scene);
  scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  const tex = target.texture;
  for (let lod = 0; lod < LEVELS; lod++) tex.mipmaps.push({ width: SIZE >> lod, height: SIZE >> lod });
  tex.isPMREMTexture = true;      // tells the material to pick a mip level from roughness
  return tex;
}
