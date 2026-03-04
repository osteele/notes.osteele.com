---
title: "Arranging Items in a Line"
layout: ../../../../layouts/BaseLayout.astro
---

This tutorial teaches creative coding techniques for arranging items in lines using p5.js.

## Two Arrangement Approaches

### By Width

The code draws shapes as will fit in the canvas width (`x <= width`), spaced 50 pixels apart.

<div class="code-example"><pre><code>function setup() {
  createCanvas(400, 200);
}

function draw() {
  background(220);
  for (let x = 25; x &lt;= width; x += 50) {
    circle(x, 100, 40);
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/189e59cc-cff5-4187-8e0a-deedccede1db/Untitled/w=640,quality=90,fit=scale-down" alt="Row of circles by width"></div></div>

### By Item Count

Fixed quantity output regardless of canvas dimensions.

<div class="code-example"><pre><code>function setup() {
  createCanvas(400, 200);
}

function draw() {
  background(220);
  for (let i = 0; i &lt; 8; i++) {
    let x = 25 + i * 50;
    circle(x, 100, 40);
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/e685da9a-a7c7-4448-a868-fb6eb32ee9c4/Untitled/w=640,quality=90,fit=scale-down" alt="8 circles in a row"></div></div>

## Arithmetic vs. Geometric Progressions

### Arithmetic Progression

Equal spacing increments (e.g., `x += 50`)

### Geometric Progression

Proportional spacing multipliers (e.g., `x *= 1.2`)

<div class="code-example"><pre><code>function draw() {
  background(220);
  let x = 20;
  for (let i = 0; i &lt; 10; i++) {
    circle(x, 100, 20);
    x *= 1.3; // Multiply by constant factor
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/6490cac9-91ee-46a9-92f4-cbc5c3079fa5/Untitled/w=640,quality=90,fit=scale-down" alt="Exponentially spaced circles"></div></div>

## Bending Lines

Derive both x and y coordinates from loop index to create diagonal arrangements.

<div class="code-example"><pre><code>function draw() {
  background(220);
  for (let i = 0; i &lt; 10; i++) {
    let x = 20 + 40 * i;
    let y = 50 + 15 * i;
    circle(x, y, 30);
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/7be01561-7fbf-44bb-a96d-da3ded2669db/Screenshot_of_Safari_(4-8-22_9-36-22_AM)/w=640,quality=90,fit=scale-down" alt="Diagonal line of circles"></div></div>

## Wave Patterns

Apply trigonometric functions for sinusoidal arrangements.

<div class="code-example"><pre><code>function draw() {
  background(220);
  for (let i = 0; i &lt; 10; i++) {
    let x = 20 + 40 * i;
    let y = map(sin(i), -1, 1, 80, 120);
    circle(x, y, 30);
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/1d56a70a-d412-4b3c-a1b1-00e577c583ae/Untitled/w=640,quality=90,fit=scale-down" alt="Wave of circles"></div></div>

## Combined Effects

Simultaneously vary position and size using the loop index.

<div class="code-example"><pre><code>function draw() {
  background(220);
  for (let i = 0; i &lt; 10; i++) {
    let x = 20 + 40 * i;
    let y = map(sin(i), -1, 1, 80, 120);
    let diameter = map(i, 0, 9, 20, 50);
    circle(x, y, diameter);
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/110e30bd-0953-4844-a765-756d23b6cffb/Untitled/w=640,quality=90,fit=scale-down" alt="Wave with growing sizes"></div></div>

## Related Tutorials

<ul class="page-list"><li><a href="/courses/creative-coding/arranging-items-in-a-circle-or-spiral/">Arranging Items in a Circle or Spiral</a></li><li><a href="/courses/creative-coding/arranging-items-in-a-grid/">Arranging Items in a Grid</a></li><li><a href="/courses/creative-coding/iteration-notes/">Iteration Notes</a></li></ul>
