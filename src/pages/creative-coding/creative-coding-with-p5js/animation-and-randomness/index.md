---
title: "Animation and Randomness"
layout: ../../../../layouts/BaseLayout.astro
---

This tutorial covers techniques for creating dynamic sketches using p5.js by introducing sources of change: time, randomness, and updates.

## Sources of Change

Five mechanisms for generating different images per frame:

-   Time functions (`frameCount`, `millis()`)
-   Global variables tracking state
-   Randomness (`random()`)
-   Input devices (mouse, keyboard)
-   External connections (Arduino, internet)

## Time-Based Animation

Use `millis()` to drive shape properties. This creates oscillating vertical positions for circles that update each frame.

<div class="code-example"><pre><code>function setup() {
  createCanvas(400, 200);
}

function draw() {
  background(220);
  for (let i = 0; i &lt; 10; i++) {
    let x = 20 + i * 40;
    let y = map(sin(i + millis() / 100), -1, 1, 80, 120);
    circle(x, y, 30);
  }
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: Oscillating circles</div></div></div>

## Random Values

The `random()` function generates different values each frame. However, calling it repeatedly causes flickering.

<div class="code-example"><pre><code>// This causes flickering!
function draw() {
  background(220);
  for (let i = 0; i &lt; 10; i++) {
    let x = 20 + i * 40;
    let y = random(80, 120); // Different each frame
    circle(x, y, 30);
  }
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: Flickering circles</div></div></div>

**Solution:** Store random values in an array initialized during `setup()`, then reference them in `draw()`.

<div class="code-example"><pre><code>let ys = [];

function setup() {
  createCanvas(400, 200);
  for (let i = 0; i &lt; 10; i++) {
    ys[i] = random(80, 120);
  }
}

function draw() {
  background(220);
  for (let i = 0; i &lt; 10; i++) {
    let x = 20 + i * 40;
    circle(x, ys[i], 30);
  }
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: Stable random positions</div></div></div>

## Update-Based Animation

Modify global variables each frame to create progressive changes. This incrementally shifts positions, creating organic motion without time dependencies.

<div class="code-example"><pre><code>let ys = [];

function setup() {
  createCanvas(400, 200);
  for (let i = 0; i &lt; 10; i++) {
    ys[i] = 100;
  }
}

function draw() {
  background(220);
  for (let i = 0; i &lt; 10; i++) {
    let x = 20 + i * 40;
    ys[i] += random(-2, 2); // Accumulate changes
    circle(x, ys[i], 30);
  }
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: Drifting circles</div></div></div>

## Noise Function

Unlike `random()`, `noise()` returns consistent values for identical inputs and produces smooth transitions between nearby input values.

<div class="code-example"><pre><code>function setup() {
  createCanvas(400, 200);
}

function draw() {
  background(220);
  for (let i = 0; i &lt; 10; i++) {
    let x = 20 + i * 40;
    // Combine spatial variation with temporal smoothness
    let y = map(noise(i, millis() / 1000), 0, 1, 60, 140);
    circle(x, y, 30);
  }
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: Smooth noise motion</div></div></div>

Calling `noise(i, millis() / 1000)` combines spatial variation (different circle positions) with temporal smoothness (frame-to-frame continuity).

<div class="callout"><p><strong>Important:</strong> Always call <code>background()</code> at the start of <code>draw()</code> when animating, preventing previous frames from overlapping. Store arrays as global variables initialized in <code>setup()</code> to preserve values across frames.</p></div>

## Related Tutorials

<ul class="page-list"><li><a href="/courses/creative-coding/arranging-items-in-a-line/">Arranging Items in a Line</a></li><li><a href="/processing/processing-and-animation/">Processing and Animation</a></li><li><a href="/creative-coding/sine/">Sine in Creative Coding</a></li></ul>
