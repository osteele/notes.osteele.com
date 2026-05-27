# Roadmap

Prospective work for the `/math/` notes on `notes.osteele.com`. Items live here
until they ship; once shipped they leave the roadmap and live in the commit log.

## Explainer-page consolidation

Additional consolidation still worth doing:

- Introduce typed DOM lookup helpers for public scripts, then migrate the
  loose `document.getElementById(...)` call sites gradually. The helper API
  should make the intended runtime behavior explicit: some optional figures
  should keep the current "missing element means skip this initializer" path,
  while required controls can fail fast with a clear error. Avoid a one-shot
  migration across all long page scripts, because that would touch many files
  and could accidentally change missing-element behavior from null-check-and
  skip to throw.
- Normalize the two older pages, `entropy-mutual-information.astro` and
  `distance-correlation.astro`, a step at a time. Keep their custom
  visualization CSS, but continue deleting local copies of shell styles
  after visual review confirms the shared CSS preserves the intended look.
- Replace remaining hand-written `.controls` blocks with `<ControlRange>`
  and `<ControlSelect>` where the DOM IDs map cleanly to existing JS.
- Convert repeated statistic tiles to a shared readout/stat component only
  if it can preserve the page-specific label/value class names used by the
  scripts.
- Add a tiny component API guide in developer docs once the component set
  stabilizes, so future pages can start from primitives instead of copying
  a finished page.

## Math & stats explainer pages — Random Processes

Remaining gaps relative to the SIGS Random Processes course
(`~/Documents/Tsinghua SIGS/Courses/F25/Random Processes/Lectures`), less
visually-driven or already partly adjacent to existing pages.

- **Stochastic process foundations.** `X(t, ξ)` as an ensemble of waveforms;
  realization-vs-random-variable picture; n-th order distributions. Likely
  folded into the openings of the GP and Markov-chain pages rather than
  given its own.
- **Ergodicity.** A live side-by-side: ensemble average over many
  realizations vs. time average from a single realization. Show one process
  where they agree (genuine ergodic case) and one where they don't (random
  frequency or random offset). Good interactive payoff; deferred only
  because it shares so much UI with the PSD page.
- **Random walks and Brownian motion.** High visual value: symmetric random
  walk refining toward Brownian motion as step size shrinks; CLT envelope;
  drift; geometric Brownian motion as a stock-price toy; white noise as the
  formal derivative. Could host the heavy-tail page below as a sibling.
- **Heavy-tailed and Lévy-stable processes.** Lévy flights vs Brownian
  motion side by side; α-stable distribution slider (`α = 2` Gaussian,
  `α = 1` Cauchy, `α < 2` heavy-tailed); generalized CLT. Naturally pairs
  with the random-walks page.
- **ARMA / AR / MA / GARCH / SETAR.** Parametric time-series zoo. AR(1)
  already partly covered by the LTI page; the broader zoo (AR(2) pole
  positions in the unit circle, MA vs AR identifiability, GARCH as
  "variance is itself an ARMA") deserves its own page if pursued.
- **Matched filter and Wiener filter.** Optimal linear detection / estimation
  problems with orthogonality principle. Sharp pedagogy (optimum is
  geometrically obvious once drawn), but smaller audience than the others.

## Direct-manipulation extensions

Initial drag-on-canvas support landed for center-style sliders (μ_q on the
variational-inference Gaussians, query position q on Nadaraya–Watson,
probability p on the Fisher-information fig3). The drag coexists with the
sliders and just dispatches `input` so the existing redraw paths stay
unchanged. Two extensions deferred from that pass:

- **2-D (μ, σ) drag on a single Gaussian.** Drag the peak to move μ; drag a
  flank (left/right of the peak by some threshold) to widen or narrow σ.
  Hover affordances need to distinguish the two regions (e.g. `ew-resize` on
  the peak, `col-resize` on the flanks, or two visible handles). Wire it
  first on `variational-inference` fig1's q-curve, where there is a single
  filled q-Gaussian to grab and σ_q already has a slider for coexistence.
  Open question: does flank-drag feel natural, or is a peak-only μ drag plus
  a visible σ handle (a small bracket on one half-max point) better?
- **`fig2-y` (observation) drag** on variational-inference fig2. The dashed
  vertical "y" marker is already drawn at `xS(y)`; horizontal drag inside
  the density panel would move it directly. Needs a region split with the
  existing μ_q drag (e.g. drag near the dashed line moves y, drag elsewhere
  moves μ_q) or a separate hit-region tied to a visible handle.

## Technical widget enhancements

- **Responsive design for complex widgets.** Optimize touch controls and
  provide simplified 1D projections for complex 3D and 2D canvas widgets on
  smaller viewports. Ensure that all interactive elements are easily usable
  on mobile devices.
- **Performance optimization (Web Workers).** Move heavy computations (e.g.,
  numerical integration, matrix inversions for GPs, real-time optimizations
  like bimodal KL gradient descent) to Web Workers. This will ensure that
  the UI thread remains perfectly smooth, especially on lower-end devices or
  during complex interactive tasks.
