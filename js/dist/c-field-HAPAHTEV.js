import"./c-chunk-SST2J3QL.js";var b=`#version 300 es
in vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`,w=`#version 300 es
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
 o=vec4(c,1.);}`;function R(n,{still:x}){let r=document.createElement("canvas");n.appendChild(r);let e=r.getContext("webgl2",{antialias:!1});if(!e)throw new Error("no webgl2");let h=(i,o)=>{let v=e.createShader(i);return e.shaderSource(v,o),e.compileShader(v),v},t=e.createProgram();e.attachShader(t,h(e.VERTEX_SHADER,b)),e.attachShader(t,h(e.FRAGMENT_SHADER,w)),e.linkProgram(t),e.useProgram(t),e.bindBuffer(e.ARRAY_BUFFER,e.createBuffer()),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.bindAttribLocation(t,0,"p"),e.linkProgram(t),e.useProgram(t),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let a={r:e.getUniformLocation(t,"r"),t:e.getUniformLocation(t,"t"),m:e.getUniformLocation(t,"m")},c=0,d=8,f=0,m=0,p=0,u=0,l=0,g=()=>{let i=Math.min(devicePixelRatio,1.25);r.width=n.clientWidth*i,r.height=n.clientHeight*i,e.viewport(0,0,r.width,r.height)},s=()=>{e.uniform2f(a.r,r.width,r.height),e.uniform1f(a.t,d),e.uniform2f(a.m,f,m),e.drawArrays(e.TRIANGLES,0,3)},A=i=>{c=requestAnimationFrame(A),d+=Math.min(.05,(i-l)/1e3||.016),l=i,f+=(p-f)*.06,m+=(u-m)*.06,s()};return n.addEventListener("pointermove",i=>{let o=n.getBoundingClientRect();p=(i.clientX-o.left-o.width/2)/o.height,u=-(i.clientY-o.top-o.height/2)/o.height},{passive:!0}),addEventListener("resize",()=>{g(),s()},{passive:!0}),g(),s(),{start(){!c&&!x&&(l=performance.now(),c=requestAnimationFrame(A))},stop(){cancelAnimationFrame(c),c=0}}}export{R as default};
