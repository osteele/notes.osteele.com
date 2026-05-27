// Reusable helpers for information-geometry figures: the Fisher metric on
// the Normal family, ellipses from 2×2 matrices, KL divergence, geodesics
// on the Poincaré half-plane, the natural gradient, and exponential-family
// quantities. These are intentionally framework-free so they can be bundled
// into multiple page scripts (Fisher metric, KL-as-squared-geodesic,
// natural gradient, dually-flat exponential families).
//
// Conventions:
//   - Parameters are 2-vectors [a, b].
//   - 2×2 matrices are [[m00, m01], [m10, m11]] with m01 = m10 for
//     symmetric Fisher matrices.
//   - The Normal family uses θ = (μ, σ) with σ > 0. The Fisher information
//     in these coordinates is diag(1/σ², 2/σ²); the parameter space
//     coincides with the hyperbolic upper half-plane up to a constant
//     rescaling of μ.

export type Vec2 = [number, number];
export type Mat2 = [[number, number], [number, number]];

// ---------------------------------------------------------------------------
// Linear algebra on 2×2 symmetric positive-definite matrices.
// ---------------------------------------------------------------------------

export function det2(M: Mat2): number {
  return M[0][0] * M[1][1] - M[0][1] * M[1][0];
}

export function inv2(M: Mat2): Mat2 {
  const d = det2(M);
  return [
    [ M[1][1] / d, -M[0][1] / d],
    [-M[1][0] / d,  M[0][0] / d],
  ];
}

export function matVec(M: Mat2, v: Vec2): Vec2 {
  return [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];
}

// Eigen-decomposition of a 2×2 symmetric matrix. Returns eigenvalues
// (lam1 ≥ lam2) and unit eigenvectors. Used to draw ellipses.
export interface SymEig {
  lam1: number;
  lam2: number;
  v1: Vec2;
  v2: Vec2;
}

export function eigSym2(M: Mat2): SymEig {
  const a = M[0][0], b = M[0][1], c = M[1][1];
  const tr = a + c;
  const disc = Math.sqrt(Math.max(0, (a - c) * (a - c) + 4 * b * b));
  const lam1 = (tr + disc) / 2;
  const lam2 = (tr - disc) / 2;
  // Eigenvector for lam1: solve (M - lam1·I)v = 0.
  let v1: Vec2;
  if (Math.abs(b) > 1e-12) {
    v1 = [lam1 - c, b];
  } else {
    v1 = a >= c ? [1, 0] : [0, 1];
  }
  const n1 = Math.hypot(v1[0], v1[1]) || 1;
  v1 = [v1[0] / n1, v1[1] / n1];
  const v2: Vec2 = [-v1[1], v1[0]];
  return { lam1, lam2, v1, v2 };
}

// ---------------------------------------------------------------------------
// Fisher information for the Normal family in (μ, σ) coordinates.
// ---------------------------------------------------------------------------

// I(μ, σ) = diag(1/σ², 2/σ²).
export function fisherNormalMuSigma(_mu: number, sigma: number): Mat2 {
  const s2 = sigma * sigma;
  return [
    [1 / s2, 0],
    [0, 2 / s2],
  ];
}

// √det I(μ, σ) = √2 / σ². The Jeffreys prior density on (μ, σ).
export function jeffreysNormalMuSigma(_mu: number, sigma: number): number {
  return Math.SQRT2 / (sigma * sigma);
}

// Fisher in (μ, log σ) coordinates: I = diag(1/σ², 2). The σ-direction
// becomes parameter-free, which is why log σ is the "natural" scale.
export function fisherNormalMuLogSigma(_mu: number, _logSigma: number): Mat2 {
  const sigma = Math.exp(_logSigma);
  return [
    [1 / (sigma * sigma), 0],
    [0, 2],
  ];
}

// Exact KL between two univariate normals.
//   KL(N(μ1, σ1²) || N(μ2, σ2²)) = log(σ2/σ1) + (σ1² + (μ1 − μ2)²)/(2 σ2²) − 1/2.
export function klNormal(p: Vec2, q: Vec2): number {
  const [m1, s1] = p, [m2, s2] = q;
  return Math.log(s2 / s1) + (s1 * s1 + (m1 - m2) * (m1 - m2)) / (2 * s2 * s2) - 0.5;
}

// Local quadratic approximation: KL ≈ ½ · δθᵀ · I(θ) · δθ. This is the
// leading-order approximation that downstream figures (KL-as-geodesic)
// build on.
export function klQuadraticApprox(theta: Vec2, dtheta: Vec2): number {
  const I = fisherNormalMuSigma(theta[0], theta[1]);
  const v = matVec(I, dtheta);
  return 0.5 * (dtheta[0] * v[0] + dtheta[1] * v[1]);
}

// ---------------------------------------------------------------------------
// Geodesics on the Poincaré upper half-plane.
//
// With Fisher metric I = diag(1/σ², 2/σ²) on (μ, σ), the σ-direction picks
// up a √2 prefactor. Substituting μ̃ = μ/√2 puts the metric in the standard
// hyperbolic form ds² = (dμ̃² + dσ²)/σ². Geodesics are vertical rays or
// half-circles centered on the σ = 0 axis. We work in (μ̃, σ) internally
// and convert back to (μ, σ) at the boundary.
// ---------------------------------------------------------------------------

export interface Geodesic {
  // Sampled points (μ, σ) along the geodesic, in order.
  points: Vec2[];
  // Arc length (Fisher-information distance) between the two endpoints.
  length: number;
}

export function fisherGeodesicNormal(p: Vec2, q: Vec2, samples = 64): Geodesic {
  const SQRT2 = Math.SQRT2;
  const p1: Vec2 = [p[0] / SQRT2, p[1]];
  const p2: Vec2 = [q[0] / SQRT2, q[1]];

  const points: Vec2[] = [];
  let length = 0;

  // Vertical ray: μ̃-coordinates agree.
  if (Math.abs(p1[0] - p2[0]) < 1e-10) {
    const muOut = p[0];
    const s0 = Math.min(p1[1], p2[1]);
    const s1 = Math.max(p1[1], p2[1]);
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      // Parameterize log σ linearly: that's the natural arc-length parameter.
      const sigma = s0 * Math.pow(s1 / s0, t);
      points.push([muOut, sigma]);
    }
    if (p1[1] > p2[1]) points.reverse();
    length = Math.abs(Math.log(p1[1] / p2[1]));
    return { points, length };
  }

  // Half-circle centered on the boundary σ = 0, passing through both points.
  // Center (c, 0) and radius r satisfy (p1 − c)² + p1.σ² = r² = (p2 − c)² + p2.σ².
  // Solving gives c = ((p1.μ̃² + p1.σ²) − (p2.μ̃² + p2.σ²)) / (2·(p1.μ̃ − p2.μ̃)).
  const a1 = p1[0] * p1[0] + p1[1] * p1[1];
  const a2 = p2[0] * p2[0] + p2[1] * p2[1];
  const c = (a1 - a2) / (2 * (p1[0] - p2[0]));
  const r = Math.hypot(p1[0] - c, p1[1]);

  // Parameterize by angle from the boundary.
  const ang1 = Math.atan2(p1[1], p1[0] - c);
  const ang2 = Math.atan2(p2[1], p2[0] - c);
  const a = Math.min(ang1, ang2);
  const b = Math.max(ang1, ang2);
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const ang = a + t * (b - a);
    const muTilde = c + r * Math.cos(ang);
    const sigma = r * Math.sin(ang);
    points.push([muTilde * SQRT2, sigma]);
  }
  if (ang1 > ang2) points.reverse();

  // Arc length along a half-circle of radius r in the hyperbolic metric
  // ds² = (dμ̃² + dσ²)/σ²: with σ = r sin θ, length = ∫|dθ|/sin θ.
  length = Math.abs(
    Math.log(Math.tan(b / 2)) - Math.log(Math.tan(a / 2)),
  );
  return { points, length };
}

// ---------------------------------------------------------------------------
// Natural gradient: ∇̃ f(θ) = I(θ)⁻¹ ∇ f(θ).
// ---------------------------------------------------------------------------

export function naturalGradient(theta: Vec2, euclideanGrad: Vec2): Vec2 {
  const I = fisherNormalMuSigma(theta[0], theta[1]);
  return matVec(inv2(I), euclideanGrad);
}

// ---------------------------------------------------------------------------
// Exponential-family helpers for the Normal in canonical coordinates.
//
// p(x | η) = exp(η · T(x) − A(η)) with T(x) = (x, x²/2). For the Normal
// these reduce to η = (μ/σ², −1/(2σ²)) and A(η) = −η1²/(4 η2) −
// ½ log(−2 η2). Useful for the dually-flat exponential-family figure.
// ---------------------------------------------------------------------------

export interface NormalDualParams {
  // Natural / canonical parameters η.
  eta: Vec2;
  // Expectation parameters μ = ∇A(η) = (μ, σ² + μ²).
  expect: Vec2;
  // Log partition.
  A: number;
}

export function normalToDual(mu: number, sigma: number): NormalDualParams {
  const s2 = sigma * sigma;
  const eta: Vec2 = [mu / s2, -1 / (2 * s2)];
  const expect: Vec2 = [mu, s2 + mu * mu];
  const A = -(eta[0] * eta[0]) / (4 * eta[1]) - 0.5 * Math.log(-2 * eta[1]);
  return { eta, expect, A };
}

// ---------------------------------------------------------------------------
// Generic 2×2 ellipse and Riemannian-ball rendering helpers.
//
// `ellipseFromMetric` draws a small ellipse showing the *unit ball* of the
// metric M at a point: {v : vᵀ M v ≤ r²}. Its semi-axes are r/√λᵢ along
// the eigenvectors of M. Use scaleToPixels to convert from parameter
// units to canvas pixels.
// ---------------------------------------------------------------------------

export interface EllipseShape {
  // Semi-axis lengths in metric-unit space (before pixel scaling).
  semiMajor: number;
  semiMinor: number;
  // Orientation of the major axis (radians, CCW from +x).
  angle: number;
}

export function ellipseFromMetric(M: Mat2, r = 1): EllipseShape {
  const e = eigSym2(M);
  // Larger eigenvalue → smaller semi-axis (the metric ball is tight along
  // high-info directions). Sort so semiMajor ≥ semiMinor.
  const aMaj = r / Math.sqrt(e.lam2);
  const aMin = r / Math.sqrt(e.lam1);
  return {
    semiMajor: aMaj,
    semiMinor: aMin,
    angle: Math.atan2(e.v2[1], e.v2[0]),
  };
}

// Draw a metric ellipse on a 2D canvas. `xAt`/`yAt` convert parameter
// units to canvas pixels. The ellipse is drawn at the parameter-point
// (mu, sigma) with the given radius `r` (in metric units).
export function drawMetricEllipse(
  ctx: CanvasRenderingContext2D,
  M: Mat2,
  cxPx: number,
  cyPx: number,
  xUnit: number, // pixels per unit in x
  yUnit: number, // pixels per unit in y
  r: number,
  stroke: string,
  fill?: string,
  lineWidth = 1.4,
): void {
  const e = ellipseFromMetric(M, r);
  ctx.save();
  ctx.translate(cxPx, cyPx);
  // The metric is defined in parameter units; rotation is computed there,
  // then we apply the axis scales so the ellipse appears correctly in pixel
  // space (this keeps the shape geometrically faithful when the canvas
  // axes use different pixels-per-unit).
  ctx.rotate(e.angle);
  ctx.scale(xUnit, yUnit);
  ctx.beginPath();
  ctx.ellipse(0, 0, e.semiMajor, e.semiMinor, 0, 0, Math.PI * 2);
  ctx.restore();
  ctx.lineWidth = lineWidth;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// Camera for the 3D toggle on the Fisher-metric figure.
//
// We render a single parametric patch (the Normal family as a surface
// embedded in ℝ³) using painter's algorithm on the existing 2D canvas
// context. No three.js or WebGL dependency; the surface is small (a few
// hundred triangles) and Canvas2D handles it fine.
// ---------------------------------------------------------------------------

export interface Camera3 {
  // Orbit angles in radians.
  yaw: number;
  pitch: number;
  // Distance from the origin.
  distance: number;
  // Output canvas size.
  width: number;
  height: number;
  // Field of view (radians).
  fov: number;
}

export function defaultCamera(width: number, height: number): Camera3 {
  return { yaw: -0.7, pitch: 0.55, distance: 4.5, width, height, fov: Math.PI / 4 };
}

// Project a world-space point [x, y, z] to canvas pixels. Returns NaNs if
// the point is behind the camera.
export function project3(cam: Camera3, p: [number, number, number]): { x: number; y: number; depth: number } {
  // Camera at distance d, looking at origin. Rotate world by −yaw around z,
  // then −pitch around x, so the camera ends up at (0, −d, 0) looking +y.
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  // Rotate around z by −yaw.
  const x1 =  cy * p[0] + sy * p[1];
  const y1 = -sy * p[0] + cy * p[1];
  const z1 = p[2];
  // Rotate around x by −pitch.
  const x2 = x1;
  const y2 = cp * y1 + sp * z1;
  const z2 = -sp * y1 + cp * z1;
  // Translate so camera sits at (0, −d, 0).
  const yc = y2 + cam.distance;
  if (yc <= 0.01) return { x: NaN, y: NaN, depth: yc };
  const f = (cam.height / 2) / Math.tan(cam.fov / 2);
  const sx = cam.width / 2 + (x2 * f) / yc;
  const sy2 = cam.height / 2 - (z2 * f) / yc;
  return { x: sx, y: sy2, depth: yc };
}

// Convenience: rotate the camera by (dyaw, dpitch). Pitch is clamped to a
// near-vertical range to avoid flipping the world upside-down.
export function orbitCamera(cam: Camera3, dyaw: number, dpitch: number): void {
  cam.yaw += dyaw;
  cam.pitch = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, cam.pitch + dpitch));
}
