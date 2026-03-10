---
title: "Common Mistakes with ml5.js DoodleNet + p5.js"
layout: ../../../layouts/BaseLayout.astro
---

A guide to the most frequent beginner errors when using ml5.js's DoodleNet
model with p5.js, their symptoms, and how to fix them.

# 1. ml5.js Version / API Mismatch

**The single biggest source of confusion.** Many tutorials (including popular
Coding Train videos) were written for ml5.js v0.x. Version 1.0, released in
August 2024, changed the API significantly. Code copied from older tutorials
will silently fail or throw errors.

## Key API differences

| Concept | Old API (v0.x) | New API (v1.0+) |
|---|---|---|
| Continuous classification | Call `classify()` recursively inside the callback | `classifyStart(canvas, gotResults)` — handles the loop internally |
| Stop classifying | (no built-in way) | `classifyStop()` |
| Result shape | `results[i].label`, `results[i].confidence` | Same, but returned as `{ label, confidence }` |
| Constructor | `ml5.imageClassifier('DoodleNet', callback)` | Same signature, but also supports `await` |

## Symptoms

- `classifier.classifyStart is not a function` — you're using v0.x code with
  a v1.0 library (or vice versa).
- Classification happens once and stops — you're using the v0.x recursive
  pattern but forgot to recurse, or you're loading v1.0 and should use
  `classifyStart()` instead.
- `ml5.imageClassifier is not a function` — the library failed to load
  entirely, or you're loading a CDN URL that doesn't match the API you're
  calling.

## How to check your version

Look at your `<script>` tag:

```html
<!-- v0.x (old) -->
<script src="https://unpkg.com/ml5@0.12.2/dist/ml5.min.js"></script>

<!-- v1.0+ (new) -->
<script src="https://unpkg.com/ml5@1/dist/ml5.min.js"></script>
```

**Fix:** Match your code to the version you're loading. If following an older
tutorial, either pin to the old version or translate the API calls.

---

# 2. Wrong Canvas Background Color

DoodleNet was trained on Google's [QuickDraw](https://quickdraw.withgoogle.com/data)
dataset, which consists of **black strokes on a white background**. The model
expects this contrast.

## Symptoms

- Classification confidence is uniformly low (< 30%) even for clear drawings.
- Every drawing is classified as the same category regardless of what you drew.
- Results seem random or nonsensical.

<div class="two-column">
<div class="code-wrong">

## Mistake

```js
function setup() {
  createCanvas(280, 280);
  // default background is gray — BAD for DoodleNet
}
```

</div>
<div class="code-correct">

## Fix

```js
function setup() {
  createCanvas(280, 280);
  background(255);  // white — matches training data
}
```

</div>
</div>

---

# 3. Wrong strokeWeight

The QuickDraw training data uses thick, bold strokes — approximately **16
pixels** wide. The default p5.js `strokeWeight` is 1, which produces lines far
too thin for the model to reliably recognize.

## Symptoms

- Model returns results but with very low confidence.
- Drawings of clearly recognizable objects get misclassified.
- Adding more detail to a drawing doesn't improve recognition.

<div class="two-column">
<div class="code-wrong">

## Mistake

```js
function setup() {
  createCanvas(280, 280);
  background(255);
  // strokeWeight defaults to 1 — too thin!
}
```

</div>
<div class="code-correct">

## Fix

```js
function setup() {
  createCanvas(280, 280);
  background(255);
  strokeWeight(16);  // thick lines matching training data
  stroke(0);         // black ink
}
```

</div>
</div>

The exact value doesn't need to be 16, but anything under ~8 will noticeably
degrade accuracy.

---

# 4. Not Waiting for Model to Load

DoodleNet's model weights are downloaded over the network when
`ml5.imageClassifier('DoodleNet')` is called. This takes time. Attempting to
classify before the model is ready causes errors.

## Symptoms

- `TypeError: Cannot read properties of undefined (reading 'classify')`
- `Error: Model not loaded yet`
- Nothing happens — no errors, no results.

<div class="code-wrong">

## Mistake

```js
let classifier;

function setup() {
  createCanvas(280, 280);
  classifier = ml5.imageClassifier('DoodleNet');
  // model is still loading!
  classifier.classify(canvas, gotResults); // ERROR
}
```

</div>

<div class="code-correct">

## Fix — Option A: Callback

```js
function setup() {
  createCanvas(280, 280);
  classifier = ml5.imageClassifier('DoodleNet', modelReady);
}

function modelReady() {
  console.log('DoodleNet loaded!');
  classifier.classify(canvas, gotResults);
}
```

</div>

<div class="code-correct">

## Fix — Option B: preload() (p5.js 1.x only)

```js
let classifier;

function preload() {
  // p5.js waits for preload() to finish before calling setup()
  classifier = ml5.imageClassifier('DoodleNet');
}

function setup() {
  createCanvas(280, 280);
  // classifier is guaranteed to be ready here
  classifier.classify(canvas, gotResults);
}
```

</div>

<div class="code-correct">

## Fix — Option C: async/await (ml5 v1.0 without p5.js)

```js
const classifier = await ml5.imageClassifier('DoodleNet');
// now safe to classify
```

</div>

Note: If you're **not** using p5.js, constructors in ml5.js v1.0 require
`await`. With p5.js, the `preload()` approach still works.

---

# 5. Recursive classify() Loop Done Wrong (v0.x)

In ml5.js v0.x, continuous classification requires you to manually create a
loop by calling `classify()` again inside the results callback. Forgetting this
step is extremely common.

## Symptoms

- The label updates once (or only when you reload the page) and never changes
  again no matter what you draw.

<div class="two-column">
<div class="code-wrong">

## Mistake

```js
function gotResults(error, results) {
  if (error) {
    console.error(error);
    return;
  }
  label = results[0].label;
  confidence = results[0].confidence;
  // WRONG: classification happens once and stops
}
```

</div>
<div class="code-correct">

## Fix (v0.x)

```js
function gotResults(error, results) {
  if (error) {
    console.error(error);
    return;
  }
  label = results[0].label;
  confidence = results[0].confidence;
  // call classify again to keep the loop going
  classifier.classify(canvas, gotResults);
}
```

</div>
</div>

## Fix (v1.0+)

Use `classifyStart()`, which handles the loop internally:

```js
function modelReady() {
  classifier.classifyStart(canvas, gotResults);
}

function gotResults(results) {
  // note: v1.0 does not pass error as the first argument
  label = results[0].label;
  confidence = results[0].confidence;
  // no need to call classify again — classifyStart manages the loop
}
```

---

# 6. Not Clearing Canvas Properly

## Symptoms

- After "clearing" and drawing again, the model still sees the old drawing
  (if there's content behind the canvas in the HTML).
- The transparent background confuses the model — results become erratic.

<div class="two-column">
<div class="code-wrong">

## Mistake: Using clear() instead of background(255)

```js
function clearCanvas() {
  clear(); // makes the canvas transparent, not white!
}
```

</div>
<div class="code-correct">

## Fix

```js
function clearCanvas() {
  background(255); // reset to white, matching training data
}
```

</div>
</div>

**Also:** If you don't provide a "clear" button or mechanism, users draw over
previous doodles. The overlapping shapes confuse the classifier.

---

# 7. Passing the Wrong Element to classify()

The `classify()` method accepts several input types, but mixing them up causes
errors.

## Symptoms

- `Error: No input image provided`
- `TypeError: Cannot read properties of null`
- The model runs but always returns the same result (it may be classifying a
  blank or uninitialized buffer).

<div class="code-wrong">

## Mistake: Passing a DOM element instead of a p5 canvas

```js
// WRONG — document.getElementById returns a DOM element
classifier.classify(document.getElementById('defaultCanvas0'), gotResults);
```

</div>

<div class="code-wrong">

## Mistake: Passing nothing

```js
// WRONG
classifier.classify(gotResults); // missing the image/canvas argument
```

</div>

<div class="code-correct">

## Fix for canvas drawing classification

In p5.js, the built-in `canvas` variable (available after `createCanvas()`)
is the correct thing to pass:

```js
classifier.classify(canvas, gotResults);
```

</div>

<div class="code-correct">

## Fix for video/webcam classification

Pass the video element when constructing the classifier:

```js
let video = createCapture(VIDEO);
classifier = ml5.imageClassifier('DoodleNet', video, modelReady);
```

</div>

However, note that DoodleNet on a webcam feed rarely makes sense — see
[mistake #8](#8-using-doodlenet-on-photos-or-webcam).

---

# 8. Using DoodleNet on Photos or Webcam

DoodleNet was trained exclusively on hand-drawn doodles (simple black line
drawings on white backgrounds from Google QuickDraw). It is **not** a
general-purpose image classifier.

## Symptoms

- Every frame is classified as the same category with similar confidence.
- Results have no correlation with what the camera sees.
- Confidence values cluster around the same low range for all inputs.

<div class="code-wrong">

## Mistake

```js
let video = createCapture(VIDEO);
// DoodleNet cannot meaningfully classify camera images
classifier = ml5.imageClassifier('DoodleNet', video, modelReady);
```

</div>

## Fix

Use the right model for the job:

| Task | Model |
|---|---|
| Classify photos or webcam | `MobileNet` |
| Classify hand-drawn doodles | `DoodleNet` |
| Custom categories | Train your own with Teachable Machine |

---

# 9. Not Handling Errors in the Callback

<div class="two-column">
<div class="code-wrong">

## Mistake (v0.x)

```js
function gotResults(error, results) {
  // WRONG: if error is not null, results is undefined
  label = results[0].label;
}
```

</div>
<div class="code-correct">

## Fix (v0.x)

```js
function gotResults(error, results) {
  if (error) {
    console.error(error);
    return;
  }
  label = results[0].label;
  confidence = results[0].confidence;
  classifier.classify(canvas, gotResults);
}
```

</div>
</div>

## Symptoms

- `TypeError: Cannot read properties of undefined (reading '0')` — appears
  intermittently, especially on slow connections or when the model is still
  warming up.

## Note for v1.0

In ml5.js v1.0, the callback signature changed — errors are no longer passed
as the first argument. Instead, errors are thrown as exceptions or logged to the
console. The callback receives only `results`:

```js
function gotResults(results) {
  label = results[0].label;
  confidence = results[0].confidence;
}
```

**Mixing up the callback signatures between versions** is itself a common
error: if you write `function gotResults(error, results)` with v1.0, what you
think is `error` is actually `results`, and `results` is `undefined`.

---

# 10. TensorFlow.js Version Conflicts

ml5.js bundles its own compatible version of TensorFlow.js internally. Loading
a separate TensorFlow.js `<script>` tag can cause version conflicts.

## Symptoms

- `Error: Number of splits must evenly divide the axis` (a known DoodleNet
  issue with certain TF.js versions — [GitHub #558](https://github.com/ml5js/ml5-library/issues/558)).
- `Error: Argument 'x' passed to 'conv2d' must be a Tensor`
- Random tensor shape errors during classification.
- Model loads but crashes on first `classify()` call.

<div class="code-wrong">

## Mistake

```html
<!-- DON'T load TensorFlow.js separately when using ml5.js -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
<script src="https://unpkg.com/ml5@1/dist/ml5.min.js"></script>
```

</div>

<div class="code-correct">

## Fix

Only load ml5.js — it includes TensorFlow.js:

```html
<script src="https://unpkg.com/ml5@1/dist/ml5.min.js"></script>
<!-- that's all you need -->
```

</div>

---

# 11. Canvas Size Issues

DoodleNet internally resizes the input to a fixed size (28x28 or similar). But
extreme canvas dimensions can cause unexpected behavior.

## Symptoms

- On tiny canvases: strokes fill the entire space, everything looks like a blob.
- On very large canvases: even with `strokeWeight(16)`, strokes look thin
  relative to the canvas area. The model sees mostly white.

<div class="code-wrong">

## Mistake: Very large or very small canvas

```js
createCanvas(50, 50);    // very small — hard to draw recognizable shapes
createCanvas(1920, 1080); // very large — performance issues, drawing looks thin relative to canvas
```

</div>

<div class="code-correct">

## Fix

Use a moderate canvas size (200-400px). The official examples use 280x280:

```js
createCanvas(280, 280);
```

</div>

If you need a larger drawing area, consider drawing on an off-screen graphics
buffer at 280x280 and displaying a scaled-up version.

---

# 12. Drawing with mousePressed Instead of mouseDragged

## Symptoms

- Drawing produces dots instead of smooth strokes.
- DoodleNet can't recognize disconnected dots as meaningful shapes.

<div class="two-column">
<div class="code-wrong">

## Mistake

```js
function mousePressed() {
  // only draws a single point per click — no continuous lines
  point(mouseX, mouseY);
}
```

</div>
<div class="code-correct">

## Fix

```js
function mouseDragged() {
  strokeWeight(16);
  line(pmouseX, pmouseY, mouseX, mouseY);
}
```

</div>
</div>

Using `line(pmouseX, pmouseY, mouseX, mouseY)` connects the previous mouse
position to the current one, creating smooth strokes even when the mouse moves
fast.

---

# 13. Calling classify() in draw() Without Throttling

## Symptoms

- Browser becomes sluggish or unresponsive.
- Console fills with results faster than you can read them.
- GPU memory usage spikes.
- Results flicker rapidly as each frame triggers a new classification.

<div class="code-wrong">

## Mistake

```js
function draw() {
  // WRONG: classify runs 60 times per second — hammers the model
  classifier.classify(canvas, gotResults);
}
```

</div>

<div class="code-correct">

## Fix

Either use the callback-based loop (v0.x) or `classifyStart()` (v1.0), which
internally manages timing. Don't drive classification from `draw()`:

```js
// v1.0
function modelReady() {
  classifier.classifyStart(canvas, gotResults);
}

// v0.x — the recursive callback pattern naturally throttles itself
// because the next classify() only runs after the previous one finishes
```

</div>

---

# 14. Forgetting noFill() or Using fill()

If `fill()` is active (it is by default in p5.js), shapes you draw will have
a filled interior, which can interfere with doodle recognition.

## Symptoms

- Drawings look different from what the model expects (filled shapes vs. line
  drawings).
- Classification is unreliable even though the drawing looks correct to you.

<div class="two-column">
<div class="code-wrong">

## Mistake

```js
function mouseDragged() {
  // ellipse has a white fill by default — drawing with ellipses
  // creates filled circles, not strokes
  ellipse(mouseX, mouseY, 16, 16);
}
```

</div>
<div class="code-correct">

## Fix

```js
function setup() {
  createCanvas(280, 280);
  background(255);
  stroke(0);
  strokeWeight(16);
  noFill();  // prevent filled shapes from interfering
}
```

</div>
</div>

---

# 15. CDN and Script Loading Order

## Symptoms

- `ml5 is not defined`
- `createCanvas is not defined`
- Page loads but nothing happens — no canvas, no errors (script failed to load
  silently with a 404).

<div class="code-wrong">

## Mistake: Loading ml5.js before p5.js

```html
<!-- WRONG order -->
<script src="https://unpkg.com/ml5@1/dist/ml5.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/p5"></script>
<script src="sketch.js"></script>
```

</div>

<div class="code-wrong">

## Mistake: Typo or wrong CDN URL

```html
<!-- WRONG: 'ml5js' is not the correct package name -->
<script src="https://unpkg.com/ml5js@1/dist/ml5.min.js"></script>
```

</div>

<div class="code-correct">

## Fix

Load p5.js first, then ml5.js, then your sketch:

```html
<script src="https://cdn.jsdelivr.net/npm/p5@1/lib/p5.min.js"></script>
<script src="https://unpkg.com/ml5@1/dist/ml5.min.js"></script>
<script src="sketch.js"></script>
```

</div>

Always check the browser's Network tab to confirm all scripts loaded with
status 200.

---

# Quick Diagnostic Table

| Symptom | Likely Cause |
|---|---|
| Model never loads / page hangs | Wrong CDN URL, network issue, or script loading order |
| `classify is not a function` | Model not loaded yet, or v0.x/v1.0 API mismatch |
| Everything classified the same | Wrong background color, wrong strokeWeight, or DoodleNet on photos |
| Low confidence on all drawings | Thin strokes, wrong background, canvas too small or too large |
| Works once then stops | Missing recursive `classify()` call (v0.x), or need `classifyStart()` (v1.0) |
| `results` is undefined in callback | Using v0.x callback signature (`error, results`) with v1.0 library |
| Tensor errors in console | TensorFlow.js version conflict (extra `<script>` tag) |
| Browser is sluggish | Calling `classify()` inside `draw()` without throttling |
| Drawings are dots, not lines | Using `mousePressed` instead of `mouseDragged`, or `point()` instead of `line()` |
| Canvas looks transparent after clear | Using `clear()` instead of `background(255)` |
| `ml5 is not defined` | Script failed to load (404), wrong URL, or wrong loading order |

---

# Minimal Working Example

A complete, working sketch for ml5.js v1.0 with DoodleNet:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/p5@1/lib/p5.min.js"></script>
  <script src="https://unpkg.com/ml5@1/dist/ml5.min.js"></script>
</head>
<body>
<script>
let classifier;
let label = "Loading model...";
let confidence = 0;

function preload() {
  classifier = ml5.imageClassifier('DoodleNet');
}

function setup() {
  let cnv = createCanvas(280, 280);
  background(255);
  stroke(0);
  strokeWeight(16);
  noFill();

  // start continuous classification
  classifier.classifyStart(cnv, gotResults);

  // clear button
  let btn = createButton('Clear');
  btn.mousePressed(() => background(255));
}

function draw() {
  // display the current classification
  fill(0);
  noStroke();
  textSize(16);
  textAlign(CENTER);
  text(label + ' (' + nf(confidence * 100, 2, 1) + '%)', width / 2, height - 10);

  // restore drawing settings
  noFill();
  stroke(0);
  strokeWeight(16);
}

function mouseDragged() {
  line(pmouseX, pmouseY, mouseX, mouseY);
}

function gotResults(results) {
  label = results[0].label;
  confidence = results[0].confidence;
}
</script>
</body>
</html>
```

---

# Sources

- [The Coding Train: Classifying Drawings with DoodleNet](https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/9-doodlenet/1-doodlenet/)
- [ml5.js Official DoodleNet Canvas Example](https://editor.p5js.org/ml5/sketches/oi74rlMSjT)
- [ml5.js 1.0 Release Blog Post](https://ml5js.org/blog/releasing-version-1/)
- [ml5.js + p5.js 2.0 Async Model Constructors](https://ml5js.org/blog/using-ml5-with-p5-2/)
- [DoodleNet TF.js Error — GitHub Issue #558](https://github.com/ml5js/ml5-library/issues/558)
- [ml5.js ImageClassifier Source (next-gen)](https://github.com/ml5js/ml5-next-gen/blob/main/src/ImageClassifier/index.js)
- [Canvas Image Classification DoodleNet Example (ml5 examples)](https://ml5js.github.io/ml5-examples/p5js/ImageClassification/ImageClassification_DoodleNet_Canvas/)
- [DoodleNet Model Repository](https://github.com/ml5js/ml5-data-and-models/tree/master/models/doodlenet)
- [Original DoodleNet by Yining Shi](https://github.com/yining1023/doodleNet)
