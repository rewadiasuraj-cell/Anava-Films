/**
 * Velaris — slow tungsten light in deep black (WebGL).
 *
 * React + TypeScript version of the hero light layer on anavafilms.com.
 * The live site is static HTML, so the running copy is the vanilla
 * implementation in assets/js/anava.js (search "Velaris"); keep the two
 * shaders in step. This file has no dependencies beyond React and can be
 * dropped into a shadcn-style project as-is.
 *
 *   <section className="relative isolate overflow-hidden bg-black">
 *     <Velaris className="absolute inset-0" />
 *     <div className="relative z-10">…</div>
 *   </section>
 */
import * as React from "react";

type Props = {
  bg?: string;
  colors?: [string, string, string, string] | string[];
  speed?: number;
  grain?: number;
  height?: string | number;
  /** Centre of the main light pool, 0–1 from the left and from the bottom. */
  focus?: [number, number];
  className?: string;
  style?: React.CSSProperties;
};

const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const VERT = "attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}";
const FRAG = `precision mediump float;
varying vec2 v;
uniform vec2 uRes;uniform float uTime;uniform vec3 uBg;
uniform vec3 uC0;uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uC3;
uniform float uGrain;uniform vec2 uFocus;uniform float uGain;uniform vec2 uShift;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float s=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);
 for(int i=0;i<4;i++){s+=a*n(p);p=m*p;a*=.5;}return s;}
void main(){
 float asp=uRes.x/uRes.y;
 vec2 p=vec2((v.x-.5)*asp,v.y-.5)*1.7+uShift;float t=uTime;
 vec2 q=vec2(fbm(p+vec2(0.,t*.9)),fbm(p+vec2(5.2,1.3)-t*.7));
 vec2 r=vec2(fbm(p+1.8*q+vec2(1.7,9.2)+t*.5),fbm(p+1.8*q+vec2(8.3,2.8)-t*.4));
 float f=fbm(p+1.6*r);
 vec2 d=(v-uFocus)*vec2(asp,1.);
 vec2 d2=(v-uFocus-vec2(.42,.26))*vec2(asp,1.);
 float pool=exp(-dot(d,d)*2.4)+exp(-dot(d2,d2)*5.)*.32;
 float e=clamp(f*f*2.6*pool*uGain,0.,1.);
 vec3 c=uBg;
 c=mix(c,uC3,smoothstep(.04,.2,e));
 c=mix(c,uC2,smoothstep(.14,.42,e));
 c=mix(c,uC1,smoothstep(.34,.66,e)*.85);
 c=mix(c,uC0,smoothstep(.55,.9,e)*.7);
 float vg=smoothstep(1.,.18,length((v-.5)*vec2(asp*.78,1.))*1.24);
 c=mix(uBg,c,vg*smoothstep(0.,.32,v.y)*smoothstep(1.,.76,v.y)*smoothstep(0.,.1,v.x)*smoothstep(1.,.9,v.x));
 c+=(h(v*uRes+fract(t*61.))-.5)*uGrain*.045;
 gl_FragColor=vec4(c,1.);
}`;

function hex(c: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return [0, 0, 0];
  const x = parseInt(m[1], 16);
  return [((x >> 16) & 255) / 255, ((x >> 8) & 255) / 255, (x & 255) / 255];
}

export function Velaris({
  bg = "#000000",
  colors = ["#F05223", "#D94318", "#7A210E", "#090301"],
  speed = 0.5,
  grain = 0.12,
  height = "100%",
  focus,
  className,
  style,
}: Props) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  // Parse colours only when they change
  const key = colors.join(",");
  const rgb = React.useMemo(() => colors.map(hex), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const bgRgb = React.useMemo(() => hex(bg), [bg]);

  React.useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const gl = cv.getContext("webgl", {
      antialias: false, alpha: false, depth: false, stencil: false,
      premultipliedAlpha: false, powerPreference: "low-power",
    });
    if (!gl) return;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    const U = (k: string) => gl.getUniformLocation(prog, k);
    const uRes = U("uRes"), uTime = U("uTime"), uFocus = U("uFocus"), uGain = U("uGain"), uShift = U("uShift");
    gl.uniform3fv(U("uBg"), bgRgb);
    ["uC0", "uC1", "uC2", "uC3"].forEach((k, i) => gl.uniform3fv(U(k), rgb[i] ?? rgb[rgb.length - 1]));
    gl.uniform1f(U("uGrain"), grain);

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const host = (cv.parentElement ?? cv) as HTMLElement;

    const compose = () => {
      const w = cv.clientWidth || 1, h = cv.clientHeight || 1, narrow = w < 768, portrait = h > w;
      const f = focus ?? [narrow || portrait ? 0.18 : 0.19, narrow ? 0.26 : portrait ? 0.28 : 0.4];
      gl.uniform2f(uFocus, f[0], f[1]);
      gl.uniform1f(uGain, narrow ? 0.95 : 1.0);
      const scale = Math.max(0.75, Math.min(window.devicePixelRatio || 1, 2) * 0.5);
      const W = Math.round(w * scale), H = Math.round(h * scale);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      gl.viewport(0, 0, W, H);
      gl.uniform2f(uRes, W, H);
    };

    const t0 = performance.now();
    const shift = [0, 0], aim = [0, 0];
    let raf = 0, last = 0, onScreen = true, lost = false;
    const draw = (now: number) => {
      const secs = calm ? 7.3 : (now - t0) / 1000;
      gl.uniform1f(uTime, secs * speed * 0.05);
      shift[0] += (aim[0] - shift[0]) * 0.04;
      shift[1] += (aim[1] - shift[1]) * 0.04;
      gl.uniform2f(uShift, shift[0], shift[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      cv.style.opacity = "1";
    };
    const loop = (now: number) => {
      raf = 0;
      if (lost || !onScreen || document.hidden) return;
      if (now - last >= 33) { last = now; draw(now); }
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!calm && !raf && !lost) raf = requestAnimationFrame(loop); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

    compose();
    draw(performance.now());
    start();

    const ro = new ResizeObserver(() => { compose(); draw(performance.now()); });
    ro.observe(cv);
    const io = new IntersectionObserver(([en]) => {
      onScreen = en.isIntersecting;
      if (onScreen) start(); else stop();
    }, { rootMargin: "100px 0px" });
    io.observe(host);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      aim[0] = ((e.clientX - r.left) / r.width - 0.5) * 0.06;
      aim[1] = -((e.clientY - r.top) / r.height - 0.5) * 0.04;
    };
    const onLeave = () => { aim[0] = aim[1] = 0; };
    if (fine && !calm) {
      host.addEventListener("pointermove", onMove, { passive: true });
      host.addEventListener("pointerleave", onLeave);
    }
    const onLost = (e: Event) => { e.preventDefault(); lost = true; stop(); };
    cv.addEventListener("webglcontextlost", onLost);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      cv.removeEventListener("webglcontextlost", onLost);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [rgb, bgRgb, speed, grain, focus?.[0], focus?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      tabIndex={-1}
      className={cn("pointer-events-none block w-full", className)}
      style={{
        height,
        opacity: 0,
        transition: "opacity 2.4s cubic-bezier(.22,1,.36,1)",
        ...style,
      }}
    />
  );
}

export default Velaris;
