---
title: "Refactoring into Functions"
layout: ../../../../layouts/BaseLayout.astro
---

This guide demonstrates how to improve code organization through systematic function extraction.

## Before: Repeated Code

<div class="code-example"><pre><code>function draw() {
  background(220);

  // Draw first face
  fill(255, 220, 180);
  ellipse(100, 100, 80, 100);
  fill(0);
  ellipse(85, 90, 10, 10);
  ellipse(115, 90, 10, 10);
  arc(100, 115, 30, 20, 0, PI);

  // Draw second face
  fill(255, 220, 180);
  ellipse(250, 100, 80, 100);
  fill(0);
  ellipse(235, 90, 10, 10);
  ellipse(265, 90, 10, 10);
  arc(250, 115, 30, 20, 0, PI);
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: Two faces</div></div></div>

## After: Extracted Function

<div class="code-example"><pre><code>function draw() {
  background(220);
  drawFace(100, 100);
  drawFace(250, 100);
}

function drawFace(x, y) {
  fill(255, 220, 180);
  ellipse(x, y, 80, 100);
  fill(0);
  ellipse(x - 15, y - 10, 10, 10);
  ellipse(x + 15, y - 10, 10, 10);
  arc(x, y + 15, 30, 20, 0, PI);
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: Same two faces</div></div></div>

## Adding Parameters

<div class="code-example"><pre><code>function draw() {
  background(220);
  drawFace(100, 100, 80);
  drawFace(250, 100, 60);
  drawFace(175, 200, 100);
}

function drawFace(x, y, size) {
  let scale = size / 80;
  fill(255, 220, 180);
  ellipse(x, y, size, size * 1.25);
  fill(0);
  ellipse(x - 15 * scale, y - 10 * scale, 10 * scale, 10 * scale);
  ellipse(x + 15 * scale, y - 10 * scale, 10 * scale, 10 * scale);
  arc(x, y + 15 * scale, 30 * scale, 20 * scale, 0, PI);
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: Three faces, different sizes</div></div></div>

<div class="callout"><p>The methodology transforms code from procedure-heavy structures into clean, self-explanatory functions through incremental improvements rather than wholesale rewrites.</p></div>

## Related Tutorials

<ul class="page-list"><li><a href="/courses/creative-coding/iteration-notes/">Iteration Notes</a></li><li><a href="/courses/creative-coding/arranging-items-in-a-grid/">Arranging Items in a Grid</a></li></ul>
