function setupCanvas(canvas: HTMLCanvasElement) {
  const ratio = window.devicePixelRatio || 1;
  const intrinsicW = parseInt(canvas.getAttribute("width") || "0", 10);
  const intrinsicH = parseInt(canvas.getAttribute("height") || "0", 10);
  canvas.style.width = "100%";
  canvas.style.height = `${(canvas.getBoundingClientRect().width * intrinsicH) / intrinsicW}px`;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.scale(ratio, ratio);
  return { ctx, w: rect.width, h: rect.height };
}

const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  p: "#1f4a8c",
  pFill: "rgba(31,74,140,0.15)",
  q: "#b8412a",
  qFill: "rgba(184,65,42,0.15)",
  purple: "#6b4592",
  green: "#2d7a3e",
};

type Vec2 = [number, number];
type Vec3 = [number, number, number];

function clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)); }

// ─────────── Simplex Visualization ───────────
// Triangle corners in 2D
const corners: Vec2[] = [
  [380, 60],   // Top (p1=1)
  [140, 360],  // Bottom Left (p2=1)
  [620, 360],  // Bottom Right (p3=1)
];

function toSimplex(p: Vec3): Vec2 {
  return [
    p[0] * corners[0][0] + p[1] * corners[1][0] + p[2] * corners[2][0],
    p[0] * corners[0][1] + p[1] * corners[1][1] + p[2] * corners[2][1],
  ];
}

function fromSimplex(x: number, y: number): Vec3 {
  // Solve linear system for barycentric coordinates
  const det = (corners[1][1] - corners[2][1]) * (corners[0][0] - corners[2][0]) + 
              (corners[2][0] - corners[1][0]) * (corners[0][1] - corners[2][1]);
  const p1 = ((corners[1][1] - corners[2][1]) * (x - corners[2][0]) + (corners[2][0] - corners[1][0]) * (y - corners[2][1])) / det;
  const p2 = ((corners[2][1] - corners[0][1]) * (x - corners[2][0]) + (corners[0][0] - corners[2][0]) * (y - corners[2][1])) / det;
  const p3 = 1 - p1 - p2;
  return [clamp(p1, 0, 1), clamp(p2, 0, 1), clamp(p3, 0, 1)];
}

(function figSimplex() {
  const canvas = document.getElementById("fig-ig-simplex") as HTMLCanvasElement;
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig-ig-simplex-readout");

  let ptA: Vec3 = [0.7, 0.2, 0.1];
  let ptB: Vec3 = [0.1, 0.2, 0.7];

  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);

    // Draw Triangle
    ctx.beginPath();
    ctx.moveTo(corners[0][0], corners[0][1]);
    ctx.lineTo(corners[1][0], corners[1][1]);
    ctx.lineTo(corners[2][0], corners[2][1]);
    ctx.closePath();
    ctx.strokeStyle = C.grid; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#fcfaf5"; ctx.fill();

    // Labels
    ctx.fillStyle = C.textDim; ctx.font = "italic 16px serif"; ctx.textAlign = "center";
    ctx.fillText("p₁=1", corners[0][0], corners[0][1] - 15);
    ctx.fillText("p₂=1", corners[1][0] - 25, corners[1][1] + 15);
    ctx.fillText("p₃=1", corners[2][0] + 25, corners[2][1] + 15);

    // Euclidean Path (Mixture)
    ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.02) {
      const p: Vec3 = [
        (1 - t) * ptA[0] + t * ptB[0],
        (1 - t) * ptA[1] + t * ptB[1],
        (1 - t) * ptA[2] + t * ptB[2],
      ];
      const px = toSimplex(p);
      if (t === 0) ctx.moveTo(px[0], px[1]); else ctx.lineTo(px[0], px[1]);
    }
    ctx.strokeStyle = C.p; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);

    // Fisher-Rao Geodesic
    const alpha = Math.acos(clamp(Math.sqrt(ptA[0]*ptB[0]) + Math.sqrt(ptA[1]*ptB[1]) + Math.sqrt(ptA[2]*ptB[2]), -1, 1));
    if (alpha > 0.001) {
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.01) {
        const s1 = Math.sin((1 - t) * alpha) / Math.sin(alpha);
        const s2 = Math.sin(t * alpha) / Math.sin(alpha);
        const p: Vec3 = [
          Math.pow(s1 * Math.sqrt(ptA[0]) + s2 * Math.sqrt(ptB[0]), 2),
          Math.pow(s1 * Math.sqrt(ptA[1]) + s2 * Math.sqrt(ptB[1]), 2),
          Math.pow(s1 * Math.sqrt(ptA[2]) + s2 * Math.sqrt(ptB[2]), 2),
        ];
        const px = toSimplex(p);
        if (t === 0) ctx.moveTo(px[0], px[1]); else ctx.lineTo(px[0], px[1]);
      }
      ctx.strokeStyle = C.q; ctx.lineWidth = 3; ctx.stroke();
    }

    // Endpoints
    [ptA, ptB].forEach((p, i) => {
      const px = toSimplex(p);
      ctx.fillStyle = i === 0 ? C.p : C.q;
      ctx.beginPath(); ctx.arc(px[0], px[1], 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = C.text; ctx.font = "bold 14px sans-serif";
      ctx.fillText(i === 0 ? "A" : "B", px[0] + 12, px[1] - 12);
    });

    readout!.innerHTML = `<div class="row"><span class="lbl">Fisher-Rao distance</span><span>${(2 * alpha).toFixed(3)}</span></div>` +
                         `<div class="row"><span class="lbl">A</span><span>[${ptA.map(v=>v.toFixed(2)).join(", ")}]</span></div>` +
                         `<div class="row"><span class="lbl">B</span><span>[${ptB.map(v=>v.toFixed(2)).join(", ")}]</span></div>`;
  }

  canvas.addEventListener("pointerdown", e => {
    const r = canvas.getBoundingClientRect();
    const getPos = (ee: PointerEvent): Vec2 => [(ee.clientX - r.left) * w / r.width, (ee.clientY - r.top) * h / r.height];
    const pos = getPos(e);
    const distA = Math.hypot(pos[0] - toSimplex(ptA)[0], pos[1] - toSimplex(ptA)[1]);
    const distB = Math.hypot(pos[0] - toSimplex(ptB)[0], pos[1] - toSimplex(ptB)[1]);
    const target = distA < 30 ? "A" : distB < 30 ? "B" : null;
    if (!target) return;

    const move = (ee: PointerEvent) => {
      const p = getPos(ee);
      const b = fromSimplex(p[0], p[1]);
      if (target === "A") ptA = b; else ptB = b;
      draw();
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });

  draw();
})();

// ─────────── Dual Projections ───────────
(function figDual() {
  const canvas = document.getElementById("fig-ig-dual") as HTMLCanvasElement;
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig-ig-dual-readout");

  // Representing a sub-family as a line in the simplex
  let targetP: Vec3 = [0.6, 0.1, 0.3];
  let lineA: Vec3 = [0.1, 0.8, 0.1];
  let lineB: Vec3 = [0.4, 0.1, 0.5];

  function kl(p: Vec3, q: Vec3) {
    let sum = 0;
    for (let i = 0; i < 3; i++) {
      if (p[i] > 0) sum += p[i] * Math.log(p[i] / Math.max(1e-12, q[i]));
    }
    return sum;
  }

  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);

    // Draw Triangle
    ctx.beginPath();
    ctx.moveTo(corners[0][0], corners[0][1]);
    ctx.lineTo(corners[1][0], corners[1][1]);
    ctx.lineTo(corners[2][0], corners[2][1]);
    ctx.closePath();
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.stroke();

    // Sub-family (m-flat line)
    const pxA = toSimplex(lineA), pxB = toSimplex(lineB);
    ctx.beginPath(); ctx.moveTo(pxA[0], pxA[1]); ctx.lineTo(pxB[0], pxB[1]);
    ctx.strokeStyle = C.axis; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = C.axis; ctx.font = "12px sans-serif"; ctx.fillText("sub-family (constraint)", (pxA[0]+pxB[0])/2, (pxA[1]+pxB[1])/2 - 10);

    // Find Projections
    let bestM: Vec3 = lineA, minKL_m = Infinity; // Forward KL: KL(Target || Q)
    let bestE: Vec3 = lineA, minKL_e = Infinity; // Reverse KL: KL(Q || Target)
    
    for (let t = 0; t <= 1; t += 0.005) {
      const q: Vec3 = [(1-t)*lineA[0] + t*lineB[0], (1-t)*lineA[1] + t*lineB[1], (1-t)*lineA[2] + t*lineB[2]];
      const dM = kl(targetP, q);
      if (dM < minKL_m) { minKL_m = dM; bestM = q; }
      const dE = kl(q, targetP);
      if (dE < minKL_e) { minKL_e = dE; bestE = q; }
    }

    const pxP = toSimplex(targetP);
    const pxM = toSimplex(bestM);
    const pxE = toSimplex(bestE);

    // m-projection (Forward)
    ctx.beginPath(); ctx.moveTo(pxP[0], pxP[1]); ctx.lineTo(pxM[0], pxM[1]);
    ctx.strokeStyle = C.p; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = C.p; ctx.beginPath(); ctx.arc(pxM[0], pxM[1], 5, 0, Math.PI*2); ctx.fill();
    ctx.fillText("m-projection", pxM[0], pxM[1] + 20);

    // e-projection (Reverse)
    ctx.beginPath(); ctx.moveTo(pxP[0], pxP[1]); ctx.lineTo(pxE[0], pxE[1]);
    ctx.strokeStyle = C.q; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = C.q; ctx.beginPath(); ctx.arc(pxE[0], pxE[1], 5, 0, Math.PI*2); ctx.fill();
    ctx.fillText("e-projection", pxE[0], pxE[1] + 35);

    // Target P
    ctx.fillStyle = C.purple;
    ctx.beginPath(); ctx.arc(pxP[0], pxP[1], 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillText("Target P", pxP[0], pxP[1] - 15);

    readout!.innerHTML = `<div class="row"><span class="lbl">m-proj (Forward KL)</span><span>at t=${(minKL_m).toFixed(3)} gap</span></div>` +
                         `<div class="row"><span class="lbl">e-proj (Reverse KL)</span><span>at t=${(minKL_e).toFixed(3)} gap</span></div>`;
  }

  canvas.addEventListener("pointerdown", e => {
    const r = canvas.getBoundingClientRect();
    const getPos = (ee: PointerEvent): Vec2 => [(ee.clientX - r.left) * w / r.width, (ee.clientY - r.top) * h / r.height];
    const pos = getPos(e);
    const distP = Math.hypot(pos[0] - toSimplex(targetP)[0], pos[1] - toSimplex(targetP)[1]);
    const distA = Math.hypot(pos[0] - toSimplex(lineA)[0], pos[1] - toSimplex(lineA)[1]);
    const distB = Math.hypot(pos[0] - toSimplex(lineB)[0], pos[1] - toSimplex(lineB)[1]);
    
    const target = distP < 30 ? "P" : distA < 30 ? "A" : distB < 30 ? "B" : null;
    if (!target) return;

    const move = (ee: PointerEvent) => {
      const p = getPos(ee);
      const b = fromSimplex(p[0], p[1]);
      if (target === "P") targetP = b; else if (target === "A") lineA = b; else lineB = b;
      draw();
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });

  draw();
})();

// ─────────── Figure 3: KL surface in 3D (WebGL) ───────────
//
// Two independent Bernoullis with means (μ₁, μ₂). The figure shows three
// stacked artifacts over a unit base square:
//   1. The KL bowl D_KL(θ₀ || θ) as a height field, capped so the boundary
//      blow-up stays legible.
//   2. The Fisher quadratic (2nd-order Taylor of KL at the anchor), as a
//      translucent surface — they agree to 2nd order at θ₀ and diverge away.
//   3. The m-geodesic (μ linear in t) and e-geodesic (η = logit μ linear in t)
//      lifted onto the KL bowl.
//
// Camera is orbital (drag to rotate). Anchor θ₀ and endpoint θ₁ are driven by
// sliders rather than 3D picking — picking on a deforming surface is finicky
// and the sliders make the parameter values explicit.
(function figKLSurface() {
  const canvas = document.getElementById("fig-ig-klsurface") as HTMLCanvasElement | null;
  if (!canvas) return;
  const readout = document.getElementById("fig-ig-klsurface-readout");
  const ctxGl = canvas.getContext("webgl", { antialias: true, premultipliedAlpha: false });
  if (!ctxGl) {
    if (readout) readout.innerHTML = `<div class="row"><span class="lbl">status</span><span>WebGL is not available in this browser.</span></div>`;
    return;
  }
  const gl = ctxGl;

  const slMu0a = document.getElementById("fig-ig-klsurface-mu0a") as HTMLInputElement;
  const slMu0b = document.getElementById("fig-ig-klsurface-mu0b") as HTMLInputElement;
  const slMu1a = document.getElementById("fig-ig-klsurface-mu1a") as HTMLInputElement;
  const slMu1b = document.getElementById("fig-ig-klsurface-mu1b") as HTMLInputElement;
  const slMu0aV = document.getElementById("fig-ig-klsurface-mu0a-v") as HTMLElement;
  const slMu0bV = document.getElementById("fig-ig-klsurface-mu0b-v") as HTMLElement;
  const slMu1aV = document.getElementById("fig-ig-klsurface-mu1a-v") as HTMLElement;
  const slMu1bV = document.getElementById("fig-ig-klsurface-mu1b-v") as HTMLElement;
  const cbQuad = document.getElementById("fig-ig-klsurface-show-quad") as HTMLInputElement;
  const cbM = document.getElementById("fig-ig-klsurface-show-m") as HTMLInputElement;
  const cbE = document.getElementById("fig-ig-klsurface-show-e") as HTMLInputElement;

  const Z_CAP = 2.5;
  const PARAM_EPS = 0.02;
  const WORLD_HEIGHT = 1.6;
  const Z_BASE = -0.4;

  function klBern(p: number, q: number) {
    const qa = Math.max(1e-9, q);
    const qb = Math.max(1e-9, 1 - q);
    const a = p > 1e-9 ? p * Math.log(p / qa) : 0;
    const b = (1 - p) > 1e-9 ? (1 - p) * Math.log((1 - p) / qb) : 0;
    return a + b;
  }
  function klPair(mu0a: number, mu0b: number, mua: number, mub: number) {
    return klBern(mu0a, mua) + klBern(mu0b, mub);
  }
  function fisherQuad(mu0a: number, mu0b: number, mua: number, mub: number) {
    const da = mua - mu0a, db = mub - mu0b;
    return 0.5 * (da * da / (mu0a * (1 - mu0a)) + db * db / (mu0b * (1 - mu0b)));
  }
  function logit(p: number) { return Math.log(p / (1 - p)); }
  function sigmoid(z: number) { return 1 / (1 + Math.exp(-z)); }
  function worldZ(kl: number) { return clamp(kl / Z_CAP, 0, 1) * WORLD_HEIGHT + Z_BASE; }
  function ramp(t: number): [number, number, number] {
    const tt = clamp(t, 0, 1);
    return [0.12 + 0.62 * tt, 0.28 + 0.08 * tt - 0.05 * tt * tt, 0.55 - 0.45 * tt];
  }

  function compile(type: number, source: string) {
    const sh = gl.createShader(type);
    if (!sh) throw new Error("shader creation failed");
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || "shader compile failed");
    return sh;
  }
  const program = gl.createProgram();
  if (!program) return;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, `
    attribute vec3 aPos;
    attribute vec4 aColor;
    uniform mat4 uMvp;
    uniform float uPointSize;
    varying vec4 vColor;
    void main() {
      gl_Position = uMvp * vec4(aPos, 1.0);
      gl_PointSize = uPointSize;
      vColor = aColor;
    }
  `));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec4 vColor;
    void main() { gl_FragColor = vColor; }
  `));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "link failed");
  gl.useProgram(program);
  const aPos = gl.getAttribLocation(program, "aPos");
  const aColor = gl.getAttribLocation(program, "aColor");
  const uMvp = gl.getUniformLocation(program, "uMvp");
  const uPointSize = gl.getUniformLocation(program, "uPointSize");

  const N = 56;
  const surfaceVerts = new Float32Array(N * N * 7);
  const quadVerts = new Float32Array(N * N * 7);
  const meshIndices: number[] = [];
  for (let j = 0; j < N - 1; j++) {
    for (let i = 0; i < N - 1; i++) {
      const a = j * N + i, b = a + 1, c = a + N, d = c + 1;
      meshIndices.push(a, c, b, b, c, d);
    }
  }
  const indexBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshIndices), gl.STATIC_DRAW);

  // Sparse wireframe over the same mesh, for the Fisher quadratic. Drawn on top
  // of the opaque KL bowl with depth-test disabled so it reads as a scaffold
  // rather than a competing surface. Picks every WIRE_STRIDE-th row/column plus
  // the boundary so the quadratic's bowl shape is legible.
  const WIRE_STRIDE = 8;
  const wireIndices: number[] = [];
  for (let j = 0; j < N; j++) {
    if (j % WIRE_STRIDE !== 0 && j !== N - 1) continue;
    for (let i = 0; i < N - 1; i++) wireIndices.push(j * N + i, j * N + i + 1);
  }
  for (let i = 0; i < N; i++) {
    if (i % WIRE_STRIDE !== 0 && i !== N - 1) continue;
    for (let j = 0; j < N - 1; j++) wireIndices.push(j * N + i, (j + 1) * N + i);
  }
  const wireIndexBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireIndexBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(wireIndices), gl.STATIC_DRAW);

  const surfaceBuf = gl.createBuffer()!;
  const quadBuf = gl.createBuffer()!;
  const lineBuf = gl.createBuffer()!;
  const ptBuf = gl.createBuffer()!;
  const dropBuf = gl.createBuffer()!;
  const frameBuf = gl.createBuffer()!;

  // Base-plane frame: square at z=Z_BASE plus two axis ticks
  {
    const arr: number[] = [];
    const gray: [number, number, number, number] = [0.55, 0.55, 0.55, 1];
    const z0 = Z_BASE;
    const push = (x: number, y: number) => arr.push(x, z0, y, gray[0], gray[1], gray[2], gray[3]);
    push(-0.5, -0.5); push(0.5, -0.5);
    push(0.5, -0.5); push(0.5, 0.5);
    push(0.5, 0.5); push(-0.5, 0.5);
    push(-0.5, 0.5); push(-0.5, -0.5);
    gl.bindBuffer(gl.ARRAY_BUFFER, frameBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
  }
  const frameCount = 8;

  function rebuildMesh(mu0a: number, mu0b: number) {
    for (let j = 0; j < N; j++) {
      const muB = PARAM_EPS + (1 - 2 * PARAM_EPS) * j / (N - 1);
      for (let i = 0; i < N; i++) {
        const muA = PARAM_EPS + (1 - 2 * PARAM_EPS) * i / (N - 1);
        const klSurf = klPair(mu0a, mu0b, muA, muB);
        const klQuadV = fisherQuad(mu0a, mu0b, muA, muB);
        const x = muA - 0.5, y = muB - 0.5;
        const c = ramp(klSurf / Z_CAP);
        const off = (j * N + i) * 7;
        surfaceVerts[off + 0] = x;
        surfaceVerts[off + 1] = worldZ(klSurf);
        surfaceVerts[off + 2] = y;
        surfaceVerts[off + 3] = c[0];
        surfaceVerts[off + 4] = c[1];
        surfaceVerts[off + 5] = c[2];
        surfaceVerts[off + 6] = 1.0;
        quadVerts[off + 0] = x;
        quadVerts[off + 1] = worldZ(klQuadV);
        quadVerts[off + 2] = y;
        quadVerts[off + 3] = 0.93;
        quadVerts[off + 4] = 0.62;
        quadVerts[off + 5] = 0.18;
        quadVerts[off + 6] = 1.0;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, surfaceBuf);
    gl.bufferData(gl.ARRAY_BUFFER, surfaceVerts, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.DYNAMIC_DRAW);
  }

  type GeoInfo = {
    mLineStart: number; mLineCount: number;
    eLineStart: number; eLineCount: number;
    mDotStart: number; mDotCount: number;
    eDotStart: number; eDotCount: number;
    markersStart: number;
    endKL: number;
  };

  function rebuildGeodesics(mu0a: number, mu0b: number, mu1a: number, mu1b: number): GeoInfo {
    const STEPS = 60;
    const lineArr: number[] = [];
    const ptArr: number[] = [];
    const eta0a = logit(mu0a), eta0b = logit(mu0b);
    const eta1a = logit(mu1a), eta1b = logit(mu1b);
    const mC: [number, number, number, number] = [0.18, 0.55, 0.30, 1];
    const eC: [number, number, number, number] = [0.72, 0.26, 0.16, 1];

    function pushPair(arr: number[], muA: number, muB: number, lift: number, c: [number, number, number, number]) {
      const kl = klPair(mu0a, mu0b, muA, muB);
      arr.push(muA - 0.5, worldZ(kl) + lift, muB - 0.5, c[0], c[1], c[2], c[3]);
    }

    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      pushPair(lineArr, (1 - t) * mu0a + t * mu1a, (1 - t) * mu0b + t * mu1b, 0.006, mC);
    }
    const eLineStart = lineArr.length / 7;
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      pushPair(lineArr, sigmoid((1 - t) * eta0a + t * eta1a), sigmoid((1 - t) * eta0b + t * eta1b), 0.006, eC);
    }
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      pushPair(ptArr, (1 - t) * mu0a + t * mu1a, (1 - t) * mu0b + t * mu1b, 0.012, mC);
    }
    const eDotStart = ptArr.length / 7;
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      pushPair(ptArr, sigmoid((1 - t) * eta0a + t * eta1a), sigmoid((1 - t) * eta0b + t * eta1b), 0.012, eC);
    }
    const markersStart = ptArr.length / 7;
    const endKL = klPair(mu0a, mu0b, mu1a, mu1b);
    ptArr.push(mu0a - 0.5, worldZ(0) + 0.02, mu0b - 0.5, 0.42, 0.27, 0.57, 1);
    ptArr.push(mu1a - 0.5, worldZ(endKL) + 0.02, mu1b - 0.5, 0.92, 0.55, 0.18, 1);

    // Vertical drop lines from base plane up to anchor and endpoint surface heights.
    // Helps the eye locate (μ_a, μ_b) on the base for each marker.
    const dropArr: number[] = [];
    const dropCol0: [number, number, number, number] = [0.42, 0.27, 0.57, 0.85];
    const dropCol1: [number, number, number, number] = [0.92, 0.55, 0.18, 0.85];
    dropArr.push(mu0a - 0.5, Z_BASE, mu0b - 0.5, dropCol0[0], dropCol0[1], dropCol0[2], dropCol0[3]);
    dropArr.push(mu0a - 0.5, worldZ(0), mu0b - 0.5, dropCol0[0], dropCol0[1], dropCol0[2], dropCol0[3]);
    dropArr.push(mu1a - 0.5, Z_BASE, mu1b - 0.5, dropCol1[0], dropCol1[1], dropCol1[2], dropCol1[3]);
    dropArr.push(mu1a - 0.5, worldZ(endKL), mu1b - 0.5, dropCol1[0], dropCol1[1], dropCol1[2], dropCol1[3]);

    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineArr), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ptArr), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, dropBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dropArr), gl.DYNAMIC_DRAW);

    return {
      mLineStart: 0, mLineCount: STEPS + 1,
      eLineStart, eLineCount: STEPS + 1,
      mDotStart: 0, mDotCount: STEPS + 1,
      eDotStart, eDotCount: STEPS + 1,
      markersStart,
      endKL,
    };
  }

  function mul(a: Float32Array, b: Float32Array) {
    const out = new Float32Array(16);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        out[col * 4 + row] =
          a[0 * 4 + row] * b[col * 4 + 0] +
          a[1 * 4 + row] * b[col * 4 + 1] +
          a[2 * 4 + row] * b[col * 4 + 2] +
          a[3 * 4 + row] * b[col * 4 + 3];
      }
    }
    return out;
  }
  function perspective(fovy: number, aspect: number, near: number, far: number) {
    const f = 1 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ]);
  }
  function translate(z: number) {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -0.1, z, 1]);
  }
  function rotateX(a: number) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  }
  function rotateY(a: number) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
  }

  // Camera. Pitch range is intentionally wide: negative values look down at the
  // bowl from above (≈ -π/2 is straight down), positive values look up at the
  // bowl from below the base plane. Clamp keeps the camera from flipping past
  // the poles where the orbital control becomes ambiguous.
  let yaw = 0.55, pitch = -0.7, dragging = false, dragX = 0, dragY = 0;
  let rafScheduled = false;
  function scheduleRedraw() {
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(() => { rafScheduled = false; draw(); });
  }

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true; dragX = event.clientX; dragY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    yaw += (event.clientX - dragX) * 0.01;
    pitch = clamp(pitch + (event.clientY - dragY) * 0.01, -1.45, 0.55);
    dragX = event.clientX; dragY = event.clientY;
    scheduleRedraw();
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });
  window.addEventListener("resize", scheduleRedraw);

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cw = Math.max(1, Math.floor(rect.width * ratio));
    const ch = Math.max(1, Math.floor(rect.width * 460 / 780 * ratio));
    if (canvas.width === cw && canvas.height === ch) return;
    canvas.width = cw;
    canvas.height = ch;
    canvas.style.height = `${rect.width * 460 / 780}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function setPointers(buffer: WebGLBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 28, 0);
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 28, 12);
  }

  let mu0a = parseFloat(slMu0a.value);
  let mu0b = parseFloat(slMu0b.value);
  let mu1a = parseFloat(slMu1a.value);
  let mu1b = parseFloat(slMu1b.value);
  rebuildMesh(mu0a, mu0b);
  let geo = rebuildGeodesics(mu0a, mu0b, mu1a, mu1b);

  function recompute() {
    mu0a = parseFloat(slMu0a.value);
    mu0b = parseFloat(slMu0b.value);
    mu1a = parseFloat(slMu1a.value);
    mu1b = parseFloat(slMu1b.value);
    slMu0aV.textContent = mu0a.toFixed(2);
    slMu0bV.textContent = mu0b.toFixed(2);
    slMu1aV.textContent = mu1a.toFixed(2);
    slMu1bV.textContent = mu1b.toFixed(2);
    rebuildMesh(mu0a, mu0b);
    geo = rebuildGeodesics(mu0a, mu0b, mu1a, mu1b);
    scheduleRedraw();
  }
  [slMu0a, slMu0b, slMu1a, slMu1b].forEach(el => el.addEventListener("input", recompute));
  [cbQuad, cbM, cbE].forEach(el => el.addEventListener("change", scheduleRedraw));

  function draw() {
    resize();
    const aspect = canvas.width / canvas.height;
    const mvp = mul(perspective(Math.PI / 4, aspect, 0.1, 12),
                    mul(translate(-3.0), mul(rotateX(pitch), rotateY(yaw))));
    gl.uniformMatrix4fv(uMvp, false, mvp);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    gl.uniform1f(uPointSize, 1);
    setPointers(surfaceBuf);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
    gl.drawElements(gl.TRIANGLES, meshIndices.length, gl.UNSIGNED_SHORT, 0);

    setPointers(frameBuf);
    gl.drawArrays(gl.LINES, 0, frameCount);

    // Fisher quadratic as a sparse wireframe overlay. Depth test disabled +
    // depth writes disabled so it always reads on top of the bowl without
    // affecting later geodesic/marker depth comparisons. The wireframe shows
    // where the quadratic sits relative to the bowl — converging at the anchor
    // and visibly diverging as θ moves toward the boundary.
    if (cbQuad.checked) {
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      setPointers(quadBuf);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireIndexBuf);
      gl.drawElements(gl.LINES, wireIndices.length, gl.UNSIGNED_SHORT, 0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
    }

    // Vertical drop lines from base to anchor/endpoint surface height.
    setPointers(dropBuf);
    gl.drawArrays(gl.LINES, 0, 4);

    setPointers(lineBuf);
    if (cbM.checked) gl.drawArrays(gl.LINE_STRIP, geo.mLineStart, geo.mLineCount);
    if (cbE.checked) gl.drawArrays(gl.LINE_STRIP, geo.eLineStart, geo.eLineCount);

    gl.uniform1f(uPointSize, 5);
    setPointers(ptBuf);
    if (cbM.checked) gl.drawArrays(gl.POINTS, geo.mDotStart, geo.mDotCount);
    if (cbE.checked) gl.drawArrays(gl.POINTS, geo.eDotStart, geo.eDotCount);

    gl.uniform1f(uPointSize, 12);
    gl.drawArrays(gl.POINTS, geo.markersStart, 2);

    if (readout) {
      const klApprox = fisherQuad(mu0a, mu0b, mu1a, mu1b);
      const ratio = geo.endKL > 1e-6 ? klApprox / geo.endKL : 1;
      const note = ratio > 1.5 ? "(quadratic over-counts)" : ratio < 0.7 ? "(quadratic under-counts)" : "";
      readout.innerHTML =
        `<div class="row"><span class="lbl">KL(θ₀ ‖ θ₁)</span><span>${geo.endKL.toFixed(3)}</span></div>` +
        `<div class="row"><span class="lbl">Fisher quadratic</span><span>${klApprox.toFixed(3)}</span></div>` +
        `<div class="row"><span class="lbl">ratio</span><span>${ratio.toFixed(2)}× ${note}</span></div>` +
        `<div class="row"><span class="lbl">interaction</span><span>drag canvas to rotate; sliders move θ₀, θ₁</span></div>`;
    }
  }

  scheduleRedraw();
})();
