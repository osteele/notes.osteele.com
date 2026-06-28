# Design Decisions

Retrospective record of decisions for the `/math/` notes that required some
analysis, are not recoverable from the design and implementation, and that a
future reader might be inclined to reverse. Reverse-chronological.

Not a changelog. If a decision is visible in the code or in a commit message,
it does not belong here. Add an entry when rejecting an obvious-looking
feature, deferring an obvious-looking abstraction, or making a non-obvious
scoping call that someone else (or future-you) would otherwise re-litigate.

---

## 2026-06-28 — Transformer ML / interpretability explainers live at `/ml/` (separate from `/math/`), sourced here not on `viz.osteele.com`; deep dives deferred to the `papers` site

Added a set of transformer mechanistic-interpretability explainer pages: the standing concepts, prior literature, and methods behind probes, residual-stream directions, attention-head circuits, syntactic structure, semantic composition, induction/copying, represented-vs-expressed knowledge, and variable binding. These topics were selected because they ground later research, but the pages should read as general background, not as explanations of specific papers or of my research questions. Three scoping calls a future reader might re-litigate:

**Why this site, not `viz.osteele.com`.** The work was first drafted as a planned section on `viz.osteele.com`. Moved here because (a) `viz`'s LLM area (`llm-visualizations`) is scoped to runtime/inference dynamics — compute, memory traffic, KV cache, batching — and explicitly *not* a representation/circuit taxonomy, and (b) the conceptual explainer material (probing, residual stream, circuits, the Bayesian/MDL evidence machinery) is the same register as the existing notes here, including the attention page and the Bayesian-inference section. The `viz` ROADMAP/DECISIONS additions were reverted; the plan was developed in this repo, and the deferred deep dives are tracked in this repo's ROADMAP.md.

**Why `/ml/`, separate from `/math/`.** The ML material — the attention page plus the mechanistic-interpretability sequence — has its own top-level index ("Machine Learning") at `/ml/`, rather than living as sections under "Math Notes". Two reasons. Mechanistic interpretability and transformer internals are not mathematics and read oddly filed under "Math Notes". And folding them under a single "Machine Learning" *section* of the math index overloaded the term: "Machine Learning" would be both the umbrella for the interpretability sequence and a sibling leaf (the attention page). A sibling `/ml/` index dissolves that — `/math/` is mathematics, `/ml/` is machine learning, and within `/ml/` the two sections are "Transformer Internals" (the attention operation, the residual stream, the QK/OV head decomposition) and "Mechanistic Interpretability" (probes, interventions, lenses, and structure — three arc sub-sections: methods; structure & meaning; heads, copying & output). Pages live at `/ml/<slug>/`; layout, idiom, and caveat copy are shared with `/math/` through a common index component (`NotesIndex.astro`), so the split is in URL and taxonomy only, not in style. The pages keep their own public search identity (residual stream, structural probes, induction heads…), per the 2026-05-28 exponential-family rule that a body of content with its own search-term identity gets its own home, even when a consolidation argument sounds tighter on paper.

**Why explainer-flavored, with a hard stop-line, deep dives elsewhere.** The pages teach the *prior* concepts and methods, not my findings; each was authored against an explicit stop-line — the point where standing context ends and would-be results begin — kept as an authoring constraint rather than a reader-facing section, with next-step pointers left to the per-page navigation. The inside-baseball pages that only make sense as an account of my own research program — cross-model representation geometry, tensor-product/DisCoCat composition, named circuits & motifs, inference circuits — are deferred to the companion `papers` site. These notes read as a general study-notes collection (see the index caveat copy), so threading them with one researcher's open results is the wrong register.

**Escape hatch.** Any deferred deep-dive can be pulled onto this site if it earns a standalone interactive figure on its own merits. The shipped background sequence lives under the `/ml/` section "Mechanistic Interpretability".

**Cross-links (notes ↔ papers).** The dependency runs one way: the companion `papers` site links *to* these pages as prerequisites — each Interpretability/Spectral paper page points at the relevant `/ml/` explainer for shared background, so it can assume the concept rather than re-teach it. That wiring (and the per-section mapping) is tracked in `~/sites/papers/ROADMAP.md`, not here. The reverse direction is deliberately light: these notes do **not** link out to specific papers or findings — that would re-import the research-program register the section was scoped to avoid. At most a generic "related research" pointer is acceptable; per-finding links are not.

---

## 2026-05-28 — Exponential family: own page after all

Yesterday's batch added the canonical-form, naming, derivatives-of-A, GLM canonical links, and decomposition picker as §7a–§7d of `sufficient-statistics`, with `conjugate-priors` §1 shrunk to a recap pointing there. The structural argument was that "exponential family" is supposed to be the means to the end (closed-form conjugate posteriors, sufficient statistics for every n) and that conjugate-priors §2 sits more naturally next to a brief exp-family setup than across a page boundary. The cheap consolidation was preferred over creating a fourth overlapping page (a hypothetical `/exponential-family/` alongside `sufficient-statistics`, `named-distributions`, and `conjugate-priors`).

Reversed today after seeing the consolidated page rendered. Two problems became visible only in the rendered form:

- The naming table + cumulants + GLM-link table + decomposition picker is ~250 lines of dense content that visually overwhelmed the sufficient-statistics narrative (Fisher–Neyman → fiber picture → Rao–Blackwell → exponential family → flow diagram). §7 was supposed to be the bridge from sufficiency-as-property to the family-where-it-holds; instead it became the centre of mass of the page.
- "Exponential family" is genuinely searchable as a top-level topic. A reader looking for GLM canonical links, the log-partition derivative identity, or the moment-function $\nabla A(\eta) = \mu$ is not searching `sufficient-statistics`. A standalone slug is the discoverable home.

Yesterday's worry about "fourth overlapping page" turned out to be wrong on the facts: there is no overlap with `named-distributions` (which lists named distributions and their PDFs/PMFs but does not cover the canonical form), and the overlap with `conjugate-priors` §1 was already shrunk to a recap. `sufficient-statistics` §7 is now a short pointer paragraph.

The reversal cost was real but bounded: ~30 minutes for a new page, ~10 inbound-link edits, page-index entry, script directory rename. The decision rule for next time: **build the standalone page first when the content has its own search-term identity, even if the consolidation argument sounds tighter on paper.**

---

## 2026-05-28 — Combined conjugate-update widget on conjugate-priors: deferred

The conjugate-priors page already has the Beta-Bernoulli pseudo-counts figure (Figure 1) and a six-row table of standard conjugate pairs (§6). A single dropdown-driven widget covering Beta-Bernoulli + Gamma-Poisson + Normal-Normal under one canvas was considered as part of this batch and rejected for now.

**Reason.** The Beta-Bernoulli figure already conveys the "prior is pseudo-data; posterior = prior + actual data in the same parametrization" claim. Re-implementing the same demonstration for two more conjugate pairs is incremental — it would not change a reader's mental model, only confirm it twice more. The marginal teaching value per line of code is low compared with the two viz that did ship this batch (exponential-family decomposition and general CLT), neither of which had any visual counterpart on the existing pages.

**Trigger to revisit.** If a reader (or future-me) reports that the conjugacy table in §6 reads as a list rather than as a unified phenomenon, the right response is a single multi-pair widget — not a third or fourth standalone figure. The natural design is one canvas with: pair picker (Beta-Bernoulli, Gamma-Poisson, Normal-Normal known σ²), prior hyperparameter sliders, a "draw n samples" button, and the posterior animating into place. Keep it one viz, not three.

---

## 2026-05-27 — Information-theory / measure-theory connections on four new Bayesian pages: noted, not rewritten

Four Bayesian pages added this batch (simulated-annealing subsection, posterior-summaries, hierarchical-bayes, vb-gaussian-mixture) each have natural deeper framings — Gibbs / free energy for SA, log loss / KL for posterior summaries, de Finetti for hierarchical Bayes, rate-distortion / I-projection for VB-GMM. The chosen treatment varies by page:

- **Posterior summaries.** Table extended with a fourth row for log loss → the posterior itself, and a paragraph noting that the mean and median are properties of the measure while the mode requires a reference measure (reparametrization-non-invariant). These are conceptual completions of an under-stated table, not added decoration.
- **Simulated annealing, hierarchical Bayes, VB-GMM.** Short single-paragraph asides labelled "Information-theory aside" or "Measure-theory aside" with cross-links to entropy-mutual-information, measure-theory, kl-divergence, or variational-inference. The main derivation and figure remain as written.

**Rejected alternative: rewrite around the deeper framing.** For SA, leading with "Gibbs distribution / free-energy descent" was considered and rejected because the rest of `monte-carlo.astro` doesn't run that vocabulary — the subsection would stand out. For hierarchical Bayes, leading with de Finetti as a representation theorem was considered and rejected because it would eat the page's "formula, picture, MSE comparison" cadence. For VB-GMM, restructuring around rate-distortion was rejected because the CAVI updates section is already dense and the page already references the ELBO and free energy by name.

**When to revisit.** If a future "information-geometry of Bayesian inference" or "rate-distortion as model selection" page is added, the connections in these four pages become natural cross-references to expand into figures. Until then the asides do the work.

---

## 2026-05-19 — Curved graph-edge convention: extracted within sampling-methods, not yet across pages

Within `src/public-scripts/math/sampling-methods/sampling.ts`, `curveGeometry` / `drawCurvedEdge` / `drawSelfLoop` / `bezierPt` / `selfLoopPoint` plus a `dynamicCurveOffsetLine` helper now live at module scope. Both the MCMC variant lab (Figure 3) and the discrete topology figure (Figure 8) use them, with `dynamicCurveOffsetLine` computing per-edge curvature that clears intermediate nodes given their radii — important for Figure 8's line layout where 19 nodes can be near maximum-radius.

The function-graph on the `chord-progressions` page (in the sister viz codebase) still has its own SVG-path implementation. A cross-site extraction is not pursued — different renderers (SVG vs. canvas), different node-radius conventions (fixed vs. π-scaled), and the canvas side animates a dot along the curve every frame.

**Trigger to extract within notes.** When a third page in `/math/` reaches for curved graph edges (likely `hidden-markov-models.astro`), pull `curveGeometry` plus thin SVG and canvas adapters into a shared module (e.g. `src/public-scripts/math/_shared/curved-edges.ts`) and migrate both existing sites.

---

## 2026-05-17 — Hypothesis Testing page: three rejected supplementary figures

The page has four figures (overlap, LR curve, ROC, Bayes risk), all views of the same $(P_0, P_1)$. Three further visualizations were considered and rejected:

- **Log-LR histograms (Stein-exponent view).** For Gaussians $\log\Lambda$ is linear in $x$, so the histograms are the originals with axes relabeled — Figure 1 already shows them. The Stein-exponent point is named inline in §2.
- **Posterior $P(H_1 \mid x)$.** A sigmoid in $\log\Lambda$ shifted by prior log-odds — duplicates the prior handling in Figure 4 and the LR curve in Figure 2.
- **SPRT random walk.** Different problem (sample size as stopping time). Belongs on its own future page with martingales and optional stopping, not as a fifth figure here.

**Escape hatch if SPRT gets its own page.** Add a fifth NextCards card or an inline mention in §2; the LR figure already establishes the per-sample $\log\Lambda$ that SPRT accumulates.

---

## 2026-05-17 — Modes of Convergence page: skip CLT, skip Slutsky, no shared sampling lib

The page covers a.s. / in-prob / in-dist / $L^p$ with the implication lattice + counterexample scrubber + inequality overlays + MCT/DCT. Several natural-looking expansions were rejected:

- **CLT viewer with empirical histogram + Berry–Esseen overlay.** Tells a *different* story ($\sqrt n$-rescaled $X_n$ converging to a non-degenerate $X$) that conflicts with the page's "modes" framing. Belongs on `/math/named-distributions/` or its own future limit-theorems page.
- **Slutsky / continuous-mapping interactive.** Needs two scrubbers, two limit objects, and a combinator dropdown for a story the implication lattice already covers (continuous mapping is "in dist is preserved by continuous transforms"; Slutsky is its $X+Y$ specialization).
- **Collapse $L^p$ readout to $L^2$ only.** Kept both $p=1,2$ — the spike preset's $L^1$ failure side-by-side with finite $L^2$ is the principal moment-escalation point.

**No shared lib (`src/lib/distributions.ts`) yet.** `poisson-processes/poisson.ts` and `named-distributions/distributions.ts` already roll their own samplers; extracting now would create a third copy that nobody else would adopt without separate refactors, and would re-introduce the SSR-vs-browser-import problem that the sister viz codebase documents around `tonic.ts`.

**Escape hatch.** When extracting, pull `convergence.ts`'s `makePath` registry and the Gaussian / Cauchy / Bernoulli samplers into a shared module (e.g. `src/public-scripts/math/_shared/sample-paths.ts`); the current code is structured for copy-paste, not redesign.

---

## 2026-05-14 — Distance correlation explainer: no interactive power-curve panel

The 2007 paper makes its empirical case via power curves vs. Wilks' LRT, Puri-Sen, and sign tests on four alternatives (Figs. 2–7). Reproducing this as an interactive panel was rejected.

**Why not.** Foreordained punchline — three flat lines and one climbing line regardless of which alternative the user picks; no exploration affordance. Faithful reproduction needs 5-dimensional vectors and three rival multivariate tests (Wilks' LRT, Puri-Sen rank correlation, multivariate sign test); a univariate simplification defeats "reproducing Fig. 2." Honest rep counts (~10⁴ as in the paper) take 30–60s in the browser; cutting 20× to stay snappy makes the figure quantitatively worse than the source. The "what it replaced" prose in §3 and the existing permutation-test panel already deliver the takeaway.

**Escape hatch if the empirical case ever feels under-made.** Pre-compute curves offline (R via `energy`, or a Node script) at proper rep counts and embed as a static labeled SVG. No runtime cost, paper-faithful, trades interactivity (which had little to offer here) for fidelity.
