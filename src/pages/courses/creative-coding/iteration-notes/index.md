---
title: "Iteration Notes"
layout: ../../../../layouts/BaseLayout.astro
---

Educational notes on iteration in creative coding, covering loops and programming patterns.

## From Repetition to Loops

<div class="code-example"><pre><code>// Repeated code
circle(50, 50, 40);
circle(50, 100, 40);
circle(50, 150, 40);
circle(50, 200, 40);

// With a for loop
for (let y = 50; y &lt;= 200; y += 50) {
  circle(50, y, 40);
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: Four circles</div></div></div>

## While vs For Loops

<div class="code-example"><pre><code>// While loop
let y = 50;
while (y &lt;= 200) {
  circle(50, y, 40);
  y += 50;
}

// For loop (equivalent)
for (let y = 50; y &lt;= 200; y += 50) {
  circle(50, y, 40);
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: Same four circles</div></div></div>

## Exponential Growth

<div class="code-example"><pre><code>function draw() {
  background(220);
  for (let size = 10; size &lt; 200; size *= 1.3) {
    circle(200, 150, size);
  }
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: Concentric circles</div></div></div>

## Conditional Modifications

<div class="code-example"><pre><code>function draw() {
  background(220);
  for (let i = 0; i &lt; 5; i++) {
    let y = 40 + 50 * i;
    if (i === 2) {
      fill('red');
    } else {
      fill('white');
    }
    circle(50, y, 40);
  }
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: One red circle</div></div></div>

## Related Tutorials

<ul class="page-list"><li><a href="/courses/creative-coding/arranging-items-in-a-line/">Arranging Items in a Line</a></li><li><a href="/courses/creative-coding/arranging-items-in-a-grid/">Arranging Items in a Grid</a></li><li><a href="/processing/processing-arrays-and-animation/">Processing Arrays and Animation</a></li></ul>
