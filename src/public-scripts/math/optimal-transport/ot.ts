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
  pFill: "rgba(31,74,140,0.25)",
  q: "#b8412a",
  qFill: "rgba(184,65,42,0.25)",
  purple: "#6b4592",
  purpleFill: "rgba(107,69,146,0.5)",
};

function clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)); }

// ─────────── Optimal Transport Plan (Sinkhorn) ───────────
(function figOTPlan() {
  const canvas = document.getElementById("fig-ot-plan") as HTMLCanvasElement;
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const regIn = document.getElementById("fig-ot-reg") as HTMLInputElement;
  const regV = document.getElementById("fig-ot-reg-v");
  const readout = document.getElementById("fig-ot-plan-readout");

  const N = 12;
  let p = new Array(N).fill(1/N);
  let q = new Array(N).fill(1/N);
  // Initial bimodal
  p[2] = 0.3; p[3] = 0.2; p[9] = 0.2; p[10] = 0.3;
  q[5] = 0.4; q[6] = 0.4; q[7] = 0.2;
  
  const sumP = p.reduce((a, b) => a + b, 0);
  const sumQ = q.reduce((a, b) => a + b, 0);
  p = p.map(v => v / sumP);
  q = q.map(v => v / sumQ);

  function solveSinkhorn(p: number[], q: number[], lambda: number) {
    const cost = Array.from({ length: N }, (_, i) => 
      Array.from({ length: N }, (_, j) => Math.pow((i - j) / N, 2))
    );
    const K = cost.map(row => row.map(c => Math.exp(-c / lambda)));
    let u = new Array(N).fill(1);
    let v = new Array(N).fill(1);

    for (let iter = 0; iter < 100; iter++) {
      // v = q / (K.T @ u)
      for (let j = 0; j < N; j++) {
        let sum = 0;
        for (let i = 0; i < N; i++) sum += K[i][j] * u[i];
        v[j] = q[j] / (sum + 1e-12);
      }
      // u = p / (K @ v)
      for (let i = 0; i < N; i++) {
        let sum = 0;
        for (let j = 0; j < N; j++) sum += K[i][j] * v[j];
        u[i] = p[i] / (sum + 1e-12);
      }
    }

    const plan = K.map((row, i) => row.map((val, j) => u[i] * val * v[j]));
    return plan;
  }

  const pad = 60;
  const plotW = w - 2 * pad, plotH = h - 2 * pad;
  const binW = plotW / N;

  function draw() {
    const lambda = +regIn.value;
    regV!.textContent = lambda.toFixed(2);
    const plan = solveSinkhorn(p, q, lambda);

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);

    // 2D Matrix
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const val = plan[i][j];
        ctx.fillStyle = C.purple;
        ctx.globalAlpha = Math.min(1, val * N);
        ctx.fillRect(pad + i * binW, pad + j * binW, binW, binW);
      }
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= N; i++) {
      ctx.beginPath(); ctx.moveTo(pad + i * binW, pad); ctx.lineTo(pad + i * binW, pad + plotW); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, pad + i * binW); ctx.lineTo(pad + plotW, pad + i * binW); ctx.stroke();
    }

    // Marginal P (Top)
    p.forEach((v, i) => {
      ctx.fillStyle = C.p;
      const barH = v * 120;
      ctx.fillRect(pad + i * binW + 2, pad - barH, binW - 4, barH);
    });
    // Marginal Q (Left)
    q.forEach((v, j) => {
      ctx.fillStyle = C.q;
      const barH = v * 120;
      ctx.fillRect(pad - barH, pad + j * binW + 2, barH, binW - 4);
    });

    // Connections (lines)
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (plan[i][j] > 0.005) {
          ctx.beginPath();
          ctx.moveTo(pad + i * binW + binW/2, pad - 5);
          ctx.bezierCurveTo(
            pad + i * binW + binW/2, pad + plotW/2,
            pad - 5, pad + j * binW + binW/2,
            pad - 5, pad + j * binW + binW/2
          );
          ctx.strokeStyle = C.purple;
          ctx.globalAlpha = plan[i][j] * N;
          ctx.lineWidth = 1 + plan[i][j] * 20;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    let totalCost = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) totalCost += plan[i][j] * Math.pow((i - j) / N, 2);
    
    readout!.innerHTML = `<div class="row"><span class="lbl">Wasserstein cost (regularized)</span><span>${totalCost.toFixed(4)}</span></div>` +
                         `<div class="row"><span class="lbl">plan</span><span>Σ_ij π_ij = 1.0; Σ_j π_ij = p_i; Σ_i π_ij = q_j</span></div>`;
  }

  canvas.addEventListener("pointerdown", e => {
    const r = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * w / r.width;
    const my = (e.clientY - r.top) * h / r.height;

    const i = Math.floor((mx - pad) / binW);
    const j = Math.floor((my - pad) / binW);

    const onP = my < pad && i >= 0 && i < N;
    const onQ = mx < pad && j >= 0 && j < N;

    if (onP || onQ) {
      const move = (ee: PointerEvent) => {
        const rr = canvas.getBoundingClientRect();
        const mmy = (ee.clientY - rr.top) * h / rr.height;
        const mmx = (ee.clientX - rr.left) * w / rr.width;
        if (onP) {
          p[i] = clamp((pad - mmy) / 120, 0, 0.8);
          const s = p.reduce((a, b) => a + b, 0);
          p = p.map(v => v / s);
        } else {
          q[j] = clamp((pad - mmx) / 120, 0, 0.8);
          const s = q.reduce((a, b) => a + b, 0);
          q = q.map(v => v / s);
        }
        draw();
      };
      const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    }
  });

  document.getElementById("fig-ot-reset")!.addEventListener("click", () => {
    p = new Array(N).fill(1/N); q = new Array(N).fill(1/N); draw();
  });
  regIn.addEventListener("input", draw);
  draw();
})();

// ─────────── Wasserstein vs KL ───────────
(function figOTCompare() {
  const canvas = document.getElementById("fig-ot-compare") as HTMLCanvasElement;
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig-ot-compare-readout");

  let muQ = 2.0;
  const muP = -1.5, sigmaP = 0.5, sigmaQ = 0.5;
  const pad = 40;

  function gaussian(x: number, m: number, s: number) {
    return Math.exp(-0.5 * Math.pow((x - m) / s, 2)) / (s * Math.sqrt(2 * Math.PI));
  }

  function kl(mq: number) {
    // KL(P || Q) where Q is moving
    const m1 = muP, s1 = sigmaP, m2 = mq, s2 = sigmaQ;
    const v = Math.log(s2/s1) + (s1*s1 + (m1-m2)*(m1-m2))/(2*s2*s2) - 0.5;
    return v;
  }
  function wasserstein(mq: number) {
    // W2^2 = (m1-m2)^2 + (s1-s2)^2
    return Math.sqrt(Math.pow(muP - mq, 2) + Math.pow(sigmaP - sigmaQ, 2));
  }
  function gradKl(mq: number) {
    return (mq - muP) / (sigmaQ * sigmaQ);
  }
  function gradW(mq: number) {
    const wv = Math.max(1e-9, wasserstein(mq));
    return (mq - muP) / wv;
  }

  function draw() {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const xRange = [-5, 5];
    const toPxX = (x: number) => pad + (x - xRange[0]) / (xRange[1] - xRange[0]) * (w - 2 * pad);
    
    // Distributions
    const yDist = h * 0.4;
    ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(pad, yDist); ctx.lineTo(w - pad, yDist); ctx.stroke();
    
    const xs = Array.from({ length: 200 }, (_, i) => xRange[0] + (i / 199) * (xRange[1] - xRange[0]));
    
    // P (Fixed)
    ctx.beginPath();
    xs.forEach((x, i) => {
      const y = yDist - gaussian(x, muP, sigmaP) * 100;
      if (i === 0) ctx.moveTo(toPxX(x), y); else ctx.lineTo(toPxX(x), y);
    });
    ctx.strokeStyle = C.p; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = C.pFill; ctx.fill();

    // Q (Draggable)
    ctx.beginPath();
    xs.forEach((x, i) => {
      const y = yDist - gaussian(x, muQ, sigmaQ) * 100;
      if (i === 0) ctx.moveTo(toPxX(x), y); else ctx.lineTo(toPxX(x), y);
    });
    ctx.strokeStyle = C.q; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = C.qFill; ctx.fill();

    // Metrics Chart
    const yChart = h * 0.9;
    const chartH = h * 0.4;
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, yChart); ctx.lineTo(w - pad, yChart); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, yChart - chartH); ctx.lineTo(pad, yChart); ctx.stroke();

    const mRange = [-4.5, 4.5];
    const ms = Array.from({ length: 100 }, (_, i) => mRange[0] + (i / 99) * (mRange[1] - mRange[0]));
    
    // Wasserstein (Linear-ish)
    ctx.beginPath();
    ms.forEach((m, i) => {
      const val = wasserstein(m);
      const px = pad + (m - mRange[0]) / (mRange[1] - mRange[0]) * (w - 2 * pad);
      const py = yChart - (val / 6) * chartH;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = C.purple; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = C.purple; ctx.font = "11px sans-serif"; ctx.fillText("Wasserstein", pad + 5, yChart - chartH + 15);

    // KL (Explosive)
    ctx.beginPath();
    ms.forEach((m, i) => {
      const val = kl(m);
      const px = pad + (m - mRange[0]) / (mRange[1] - mRange[0]) * (w - 2 * pad);
      const py = yChart - (Math.min(10, val) / 6) * chartH;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = C.axis; ctx.setLineDash([4, 2]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.axis; ctx.fillText("KL Divergence", pad + 5, yChart - chartH + 30);

    // Current Marker
    const curX = pad + (muQ - mRange[0]) / (mRange[1] - mRange[0]) * (w - 2 * pad);
    ctx.beginPath(); ctx.moveTo(curX, yChart); ctx.lineTo(curX, yChart - chartH);
    ctx.strokeStyle = C.q; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
    
    readout!.innerHTML = `<div class="row"><span class="lbl">KL divergence</span><span>${kl(muQ).toFixed(3)}</span></div>` +
                         `<div class="row"><span class="lbl">Wasserstein-2</span><span>${wasserstein(muQ).toFixed(3)}</span></div>` +
                         `<div class="row"><span class="lbl">local gradients</span><span>dKL/dμ = ${gradKl(muQ).toFixed(2)}, dW/dμ = ${gradW(muQ).toFixed(2)}</span></div>`;
  }

  canvas.addEventListener("pointerdown", e => {
    const r = canvas.getBoundingClientRect();
    const move = (ee: PointerEvent) => {
      const mx = (ee.clientX - r.left) * w / r.width;
      muQ = clamp(-4.5 + (mx - pad) / (w - 2 * pad) * 9, -4.5, 4.5);
      draw();
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });

  draw();
})();

// ─────────── Figure 2: Brenier potential in 3D (WebGL) ───────────
//
// For two isotropic 2D Gaussians, p = N(μ_p, σ_p²I) and q = N(μ_q, σ_q²I),
// the Brenier potential has the closed form
//   φ(x) = (σ_q / 2σ_p) ‖x − μ_p‖² + (μ_q − (σ_q/σ_p) μ_p) · x
// and the optimal transport map is its gradient,
//   T(x) = ∇φ(x) = (σ_q/σ_p)(x − μ_p) + μ_q.
// The figure lifts φ to a 3D surface, draws source/target disks and the
// gradient field on the base plane, and an orange translucent tangent plane
// at μ_p whose slope equals the displacement vector μ_q − μ_p · (σ_q/σ_p).
(function figOTBrenier() {
  const canvas = document.getElementById("fig-ot-brenier") as HTMLCanvasElement | null;
  if (!canvas) return;
  const readout = document.getElementById("fig-ot-brenier-readout");
  const ctxGl = canvas.getContext("webgl", { antialias: true, premultipliedAlpha: false });
  if (!ctxGl) {
    if (readout) readout.innerHTML = `<div class="row"><span class="lbl">status</span><span>WebGL is not available in this browser.</span></div>`;
    return;
  }
  const gl = ctxGl;

  const slSp = document.getElementById("fig-ot-brenier-sp") as HTMLInputElement;
  const slSq = document.getElementById("fig-ot-brenier-sq") as HTMLInputElement;
  const slDx = document.getElementById("fig-ot-brenier-dx") as HTMLInputElement;
  const slDy = document.getElementById("fig-ot-brenier-dy") as HTMLInputElement;
  const slSpV = document.getElementById("fig-ot-brenier-sp-v") as HTMLElement;
  const slSqV = document.getElementById("fig-ot-brenier-sq-v") as HTMLElement;
  const slDxV = document.getElementById("fig-ot-brenier-dx-v") as HTMLElement;
  const slDyV = document.getElementById("fig-ot-brenier-dy-v") as HTMLElement;
  const cbDisks = document.getElementById("fig-ot-brenier-show-disks") as HTMLInputElement;
  const cbArrows = document.getElementById("fig-ot-brenier-show-arrows") as HTMLInputElement;
  const cbTangent = document.getElementById("fig-ot-brenier-show-tangent") as HTMLInputElement;

  const PARAM_HALF = 3.0;
  const WORLD_SCALE = 1.0 / PARAM_HALF;
  const Z_BASE = -0.4;
  const WORLD_HEIGHT = 1.4;
  function toWX(x: number) { return x * WORLD_SCALE; }
  function toWY(y: number) { return y * WORLD_SCALE; }

  function compile(type: number, source: string) {
    const sh = gl.createShader(type);
    if (!sh) throw new Error("shader");
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

  function ramp(t: number): [number, number, number] {
    const tt = clamp(t, 0, 1);
    return [0.12 + 0.62 * tt, 0.28 + 0.08 * tt - 0.05 * tt * tt, 0.55 - 0.45 * tt];
  }

  const N = 60;
  const surfaceVerts = new Float32Array(N * N * 7);
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

  const surfaceBuf = gl.createBuffer()!;
  const frameBuf = gl.createBuffer()!;
  const disksBuf = gl.createBuffer()!;
  const arrowsBuf = gl.createBuffer()!;
  const tangentBuf = gl.createBuffer()!;
  const ptBuf = gl.createBuffer()!;

  {
    const arr: number[] = [];
    const gray: [number, number, number, number] = [0.55, 0.55, 0.55, 1];
    const push = (x: number, y: number) => arr.push(x, Z_BASE, y, gray[0], gray[1], gray[2], gray[3]);
    push(-1, -1); push(1, -1);
    push(1, -1); push(1, 1);
    push(1, 1); push(-1, 1);
    push(-1, 1); push(-1, -1);
    gl.bindBuffer(gl.ARRAY_BUFFER, frameBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
  }
  const frameCount = 8;

  let phiMin = 0, phiMax = 1;
  function worldZ(phi: number) {
    if (phiMax - phiMin < 1e-6) return Z_BASE;
    return Z_BASE + WORLD_HEIGHT * (phi - phiMin) / (phiMax - phiMin);
  }
  function phiAt(x: number, y: number, mpx: number, mpy: number, mqx: number, mqy: number, sp: number, sq: number) {
    const dx = x - mpx, dy = y - mpy;
    return (sq / (2 * sp)) * (dx * dx + dy * dy)
         + (mqx - (sq / sp) * mpx) * x
         + (mqy - (sq / sp) * mpy) * y;
  }

  type Info = {
    ringVerts: number; arrowVerts: number; tangentVerts: number; ptVerts: number;
    mpx: number; mpy: number; mqx: number; mqy: number; sp: number; sq: number;
  };

  function rebuildAll(sp: number, sq: number, dx: number, dy: number): Info {
    const mpx = -dx / 2, mpy = -dy / 2;
    const mqx = dx / 2, mqy = dy / 2;

    const raw = new Float64Array(N * N);
    let lo = Infinity, hi = -Infinity;
    for (let j = 0; j < N; j++) {
      const y = -PARAM_HALF + 2 * PARAM_HALF * j / (N - 1);
      for (let i = 0; i < N; i++) {
        const x = -PARAM_HALF + 2 * PARAM_HALF * i / (N - 1);
        const v = phiAt(x, y, mpx, mpy, mqx, mqy, sp, sq);
        raw[j * N + i] = v;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    phiMin = lo; phiMax = hi;

    for (let j = 0; j < N; j++) {
      const y = -PARAM_HALF + 2 * PARAM_HALF * j / (N - 1);
      for (let i = 0; i < N; i++) {
        const x = -PARAM_HALF + 2 * PARAM_HALF * i / (N - 1);
        const v = raw[j * N + i];
        const t = (v - lo) / Math.max(1e-9, hi - lo);
        const c = ramp(t);
        const off = (j * N + i) * 7;
        surfaceVerts[off + 0] = toWX(x);
        surfaceVerts[off + 1] = worldZ(v);
        surfaceVerts[off + 2] = toWY(y);
        surfaceVerts[off + 3] = c[0];
        surfaceVerts[off + 4] = c[1];
        surfaceVerts[off + 5] = c[2];
        surfaceVerts[off + 6] = 1;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, surfaceBuf);
    gl.bufferData(gl.ARRAY_BUFFER, surfaceVerts, gl.DYNAMIC_DRAW);

    // Source/target rings
    const ringSegs = 36;
    const disksArr: number[] = [];
    function pushRing(cx: number, cy: number, r: number, col: [number, number, number, number]) {
      for (let k = 0; k < ringSegs; k++) {
        const a0 = 2 * Math.PI * k / ringSegs;
        const a1 = 2 * Math.PI * (k + 1) / ringSegs;
        disksArr.push(toWX(cx + r * Math.cos(a0)), Z_BASE + 0.005, toWY(cy + r * Math.sin(a0)), col[0], col[1], col[2], col[3]);
        disksArr.push(toWX(cx + r * Math.cos(a1)), Z_BASE + 0.005, toWY(cy + r * Math.sin(a1)), col[0], col[1], col[2], col[3]);
      }
    }
    pushRing(mpx, mpy, sp, [0.12, 0.29, 0.55, 1]);
    pushRing(mqx, mqy, sq, [0.72, 0.26, 0.16, 1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, disksBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(disksArr), gl.DYNAMIC_DRAW);

    // Gradient arrows on a 5×5 grid covering the source disk
    const arrowsArr: number[] = [];
    const G = 5;
    const span = 1.6 * sp;
    const green: [number, number, number, number] = [0.18, 0.55, 0.30, 1];
    function pushSeg(x0: number, y0: number, x1: number, y1: number) {
      arrowsArr.push(toWX(x0), Z_BASE + 0.012, toWY(y0), green[0], green[1], green[2], green[3]);
      arrowsArr.push(toWX(x1), Z_BASE + 0.012, toWY(y1), green[0], green[1], green[2], green[3]);
    }
    for (let j = 0; j < G; j++) {
      for (let i = 0; i < G; i++) {
        const sx = mpx + (i / (G - 1) - 0.5) * span;
        const sy = mpy + (j / (G - 1) - 0.5) * span;
        const tx = (sq / sp) * (sx - mpx) + mqx;
        const ty = (sq / sp) * (sy - mpy) + mqy;
        pushSeg(sx, sy, tx, ty);
        const vx = tx - sx, vy = ty - sy;
        const len = Math.hypot(vx, vy);
        if (len > 1e-3) {
          const ux = vx / len, uy = vy / len;
          const ah = Math.min(0.22, 0.25 * len);
          const lx = tx - ah * (ux + 0.5 * uy);
          const ly = ty - ah * (uy - 0.5 * ux);
          const rx = tx - ah * (ux - 0.5 * uy);
          const ry = ty - ah * (uy + 0.5 * ux);
          pushSeg(tx, ty, lx, ly);
          pushSeg(tx, ty, rx, ry);
        }
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, arrowsBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arrowsArr), gl.DYNAMIC_DRAW);

    // Tangent plane at μ_p
    const r = 0.9;
    const phiMp = phiAt(mpx, mpy, mpx, mpy, mqx, mqy, sp, sq);
    function planeZ(x: number, y: number) {
      return phiMp + mqx * (x - mpx) + mqy * (y - mpy);
    }
    const tcol: [number, number, number, number] = [0.93, 0.62, 0.20, 0.45];
    const tangentArr: number[] = [];
    function pv(x: number, y: number) {
      tangentArr.push(toWX(x), worldZ(planeZ(x, y)), toWY(y), tcol[0], tcol[1], tcol[2], tcol[3]);
    }
    pv(mpx - r, mpy - r); pv(mpx + r, mpy - r); pv(mpx + r, mpy + r);
    pv(mpx - r, mpy - r); pv(mpx + r, mpy + r); pv(mpx - r, mpy + r);
    gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tangentArr), gl.DYNAMIC_DRAW);

    // Markers: μ_p (blue), μ_q (red) on base; lifted (μ_p, φ(μ_p)) purple
    const ptArr: number[] = [];
    ptArr.push(toWX(mpx), Z_BASE + 0.02, toWY(mpy), 0.12, 0.29, 0.55, 1);
    ptArr.push(toWX(mqx), Z_BASE + 0.02, toWY(mqy), 0.72, 0.26, 0.16, 1);
    ptArr.push(toWX(mpx), worldZ(phiMp) + 0.02, toWY(mpy), 0.42, 0.27, 0.57, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ptArr), gl.DYNAMIC_DRAW);

    return {
      ringVerts: ringSegs * 4,
      arrowVerts: arrowsArr.length / 7,
      tangentVerts: 6,
      ptVerts: 3,
      mpx, mpy, mqx, mqy, sp, sq,
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
  function translate(z: number) { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -0.1, z, 1]); }
  function rotateX(a: number) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  }
  function rotateY(a: number) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
  }

  let yaw = 0.6, pitch = -0.7, dragging = false, dragX = 0, dragY = 0;
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

  let sp = parseFloat(slSp.value);
  let sq = parseFloat(slSq.value);
  let dx = parseFloat(slDx.value);
  let dy = parseFloat(slDy.value);
  let info = rebuildAll(sp, sq, dx, dy);

  function recompute() {
    sp = parseFloat(slSp.value);
    sq = parseFloat(slSq.value);
    dx = parseFloat(slDx.value);
    dy = parseFloat(slDy.value);
    slSpV.textContent = sp.toFixed(2);
    slSqV.textContent = sq.toFixed(2);
    slDxV.textContent = dx.toFixed(2);
    slDyV.textContent = dy.toFixed(2);
    info = rebuildAll(sp, sq, dx, dy);
    scheduleRedraw();
  }
  [slSp, slSq, slDx, slDy].forEach(el => el.addEventListener("input", recompute));
  [cbDisks, cbArrows, cbTangent].forEach(el => el.addEventListener("change", scheduleRedraw));

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

    if (cbDisks.checked) {
      setPointers(disksBuf);
      gl.drawArrays(gl.LINES, 0, info.ringVerts);
    }

    if (cbArrows.checked) {
      setPointers(arrowsBuf);
      gl.drawArrays(gl.LINES, 0, info.arrowVerts);
    }

    if (cbTangent.checked) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      setPointers(tangentBuf);
      gl.drawArrays(gl.TRIANGLES, 0, info.tangentVerts);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    gl.uniform1f(uPointSize, 10);
    setPointers(ptBuf);
    gl.drawArrays(gl.POINTS, 0, info.ptVerts);

    if (readout) {
      const stretch = info.sq / info.sp;
      const sep = Math.hypot(info.mqx - info.mpx, info.mqy - info.mpy);
      const note = stretch > 1.01 ? "(target broader)" : stretch < 0.99 ? "(target tighter)" : "(equal width)";
      readout.innerHTML =
        `<div class="row"><span class="lbl">σ_q / σ_p</span><span>${stretch.toFixed(2)}× ${note}</span></div>` +
        `<div class="row"><span class="lbl">‖μ_q − μ_p‖</span><span>${sep.toFixed(2)}</span></div>` +
        `<div class="row"><span class="lbl">interaction</span><span>drag canvas to rotate; sliders reshape p and q</span></div>`;
    }
  }

  scheduleRedraw();
})();
