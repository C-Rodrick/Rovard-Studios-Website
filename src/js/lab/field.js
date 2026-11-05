// Study 01, Cobalt Field: domain-warped noise in a single fragment shader, quantised into the logo's square.
// Raw WebGL2, no library.
const VS = `#version 300 es
in vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FS = `#version 300 es
precision highp float;uniform vec2 r;uniform float t;uniform vec2 m;out vec4 o;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.02+7.;a*=.5;}return v;}
void main(){vec2 u=(gl_FragCoord.xy-.5*r)/r.y;vec2 q=u*2.2;float d=length(u-m);
 vec2 w=vec2(fbm(q+t*.07),fbm(q+vec2(5.2,1.3)-t*.05));float f=fbm(q+2.6*w+vec2(m*1.2));
 f+=.28*exp(-d*d*9.);
 float cell=mix(150.,34.,smoothstep(.45,.0,d));vec2 g=floor(u*cell)/cell;f=mix(f,fbm(g*2.2+2.6*w),.35);
 vec3 ink=vec3(.063,.067,.086),blue=vec3(.086,.176,.686),el=vec3(.141,.357,1.),y=vec3(1.,.847,.239);
 vec3 c=mix(ink,blue,smoothstep(.28,.55,f));c=mix(c,el,smoothstep(.52,.7,f));c=mix(c,y,smoothstep(.76,.8,f));
 o=vec4(c,1.);}`;

export default function field(stage, { still }) {
  const c = document.createElement('canvas');
  stage.appendChild(c);
  const gl = c.getContext('webgl2', { antialias: false });
  if (!gl) throw new Error('no webgl2');
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.bindAttribLocation(pr, 0, 'p'); gl.linkProgram(pr); gl.useProgram(pr);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = { r: gl.getUniformLocation(pr, 'r'), t: gl.getUniformLocation(pr, 't'), m: gl.getUniformLocation(pr, 'm') };
  let raf = 0, t = 8, mx = 0, my = 0, tx = 0, ty = 0, last = 0;
  const size = () => { const d = Math.min(devicePixelRatio, 1.25); c.width = stage.clientWidth * d; c.height = stage.clientHeight * d; gl.viewport(0, 0, c.width, c.height); };
  const draw = () => { gl.uniform2f(U.r, c.width, c.height); gl.uniform1f(U.t, t); gl.uniform2f(U.m, mx, my); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    t += Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    draw();
  };
  stage.addEventListener('pointermove', (e) => { const r = stage.getBoundingClientRect(); tx = (e.clientX - r.left - r.width / 2) / r.height; ty = -(e.clientY - r.top - r.height / 2) / r.height; }, { passive: true });
  addEventListener('resize', () => { size(); draw(); }, { passive: true });
  size(); draw();
  return { start() { if (!raf && !still) { last = performance.now(); raf = requestAnimationFrame(loop); } }, stop() { cancelAnimationFrame(raf); raf = 0; } };
}
