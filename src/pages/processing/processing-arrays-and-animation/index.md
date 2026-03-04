---
title: "Processing Arrays and Animation"
layout: ../../../layouts/BaseLayout.astro
---

This tutorial demonstrates how to build animations using arrays and loops in Processing, following an incremental approach.

## Learning Progression

1.  **Initial Concept:** Start with a single animated circle moving downward
2.  **Scaling Up:** Add a second circle, then generalize using arrays
3.  **Loop Implementation:** Replace repetitive code with `for` loops
4.  **Array Operations:** Use `Array.length` for dynamic sizing
5.  **Advanced Features:** Add collision detection and multiple properties per object

## Single Animated Circle

<div class="code-example"><pre><code>float y = 0;

void setup() {
  size(400, 300);
}

void draw() {
  background(200);
  ellipse(200, y, 50, 50);
  y = y + 2;
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: Falling circle</div></div></div>

## Multiple Circles with Arrays

<div class="code-example"><pre><code>float[] xs = {100, 200, 300};
float[] ys = {0, 50, 100};
float[] speeds = {2, 3, 1.5};

void setup() {
  size(400, 300);
}

void draw() {
  background(200);
  for (int i = 0; i &lt; xs.length; i++) {
    ellipse(xs[i], ys[i], 50, 50);
    ys[i] = ys[i] + speeds[i];
  }
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: Multiple falling circles</div></div></div>

## Boundary Detection and Bouncing

<div class="code-example"><pre><code>int numCircles = 10;
float[] xs = new float[numCircles];
float[] ys = new float[numCircles];
float[] speeds = new float[numCircles];

void setup() {
  size(400, 300);
  for (int i = 0; i &lt; numCircles; i++) {
    xs[i] = random(width);
    ys[i] = random(height);
    speeds[i] = random(2, 5);
  }
}

void draw() {
  background(200);
  for (int i = 0; i &lt; numCircles; i++) {
    ellipse(xs[i], ys[i], 50, 50);
    ys[i] = ys[i] + speeds[i];

    // Bounce at boundaries
    if (ys[i] &gt; height &amp;&amp; speeds[i] &gt; 0) {
      speeds[i] = -speeds[i];
    }
    if (ys[i] &lt; 0 &amp;&amp; speeds[i] &lt; 0) {
      speeds[i] = -speeds[i];
    }
  }
}</code></pre><div class="canvas-preview"><div class="canvas-placeholder">Canvas: Bouncing circles</div></div></div>

## Key Concepts

-   Creating parallel arrays for object properties (x, y positions, speeds)
-   Using a common index to access related values across arrays
-   Iterating through all objects in a single `for` loop
-   Use `random()` for procedural initialization
-   Boundary detection: `if (ys[i] > height && speeds[i] > 0)`
-   Velocity reversal for bouncing effects

## Related Tutorials

<ul class="page-list"><li><a href="/processing/processing-and-animation/">Processing and Animation</a></li><li><a href="/courses/creative-coding/iteration-notes/">Iteration Notes</a></li></ul>
