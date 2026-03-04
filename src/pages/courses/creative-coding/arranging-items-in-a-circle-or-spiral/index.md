---
title: "Arranging Items in a Circle or Spiral"
layout: ../../../../layouts/BaseLayout.astro
---

This tutorial teaches creative coding techniques using p5.js to arrange visual elements in circular and spiral patterns.

## Using Sin and Cos

<div class="code-example"><pre><code>function draw() {
  background(220);
  for (let i = 0; i &lt; 10; i++) {
    let x = 200 + 100 * sin(i);
    let y = 150 + 100 * sin(i);
    circle(x, y, 20);
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/e2a4172b-f25a-42ef-b53a-05fae594a512/Screenshot_of_Notion_(4-7-22_11-42-58_PM)/w=640,quality=90,fit=scale-down" alt="Diagonal using same function"></div></div>

## Items in a Circle

### Method 1: Radians

<div class="code-example"><pre><code>function setup() {
  createCanvas(400, 300);
}

function draw() {
  background(220);
  for (let i = 0; i &lt; 10; i++) {
    let angle = i * TWO_PI / 10;
    let x = 200 + 100 * cos(angle);
    let y = 150 + 100 * sin(angle);
    circle(x, y, 30);
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/ca501b70-0bab-4589-9b72-248bee2dd233/Untitled/w=640,quality=90,fit=scale-down" alt="10 circles in a ring"></div></div>

### Method 2: Degrees

<div class="code-example"><pre><code>function setup() {
  createCanvas(400, 300);
  angleMode(DEGREES);
}

function draw() {
  background(220);
  for (let i = 0; i &lt; 10; i++) {
    let angle = i * 360 / 10;
    let x = 200 + 100 * cos(angle);
    let y = 150 + 100 * sin(angle);
    circle(x, y, 30);
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/23ca25fd-33ea-4bb5-a19e-34eb7b88e4f8/Untitled/w=640,quality=90,fit=scale-down" alt="Circle using degrees"></div></div>

## Drawing Items Differently

<div class="code-example"><pre><code>function setup() {
  createCanvas(400, 300);
  angleMode(DEGREES);
}

function draw() {
  background(220);
  for (let angle = 0; angle &lt; 360; angle += 30) {
    let x = 200 + 100 * cos(angle);
    let y = 150 + 100 * sin(angle);

    if (angle === 180) {
      fill('red');
    } else {
      fill('white');
    }
    circle(x, y, 30);
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/916fe202-6b72-4387-a76d-72f2c275464a/Untitled/w=640,quality=90,fit=scale-down" alt="Colored circle items"></div></div>

## Animating the Circle

Incorporate `millis()` into angle calculations to create rotation effects.

<div class="code-example"><pre><code>function setup() {
  createCanvas(400, 300);
  angleMode(DEGREES);
}

function draw() {
  background(220);
  for (let i = 0; i &lt; 12; i++) {
    let angle = i * 30 + millis() / 15;
    let x = 200 + 100 * cos(angle);
    let y = 150 + 100 * sin(angle);
    circle(x, y, 25);
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/e357f0b0-f549-4430-9100-216e038353b6/2021-02-25_20.30.57/w=640,quality=90,fit=scale-down" alt="Rotating ring animation"></div></div>

## From Circle to Spiral

<div class="code-example"><pre><code>function setup() {
  createCanvas(400, 300);
  angleMode(DEGREES);
}

function draw() {
  background(220);
  for (let angle = 0; angle &lt; 720; angle += 20) {
    let radius = map(angle, 0, 720, 10, 150);
    let x = 200 + radius * cos(angle);
    let y = 150 + radius * sin(angle);
    let size = map(angle, 0, 720, 5, 25);
    circle(x, y, size);
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/dae92b6b-17c2-45f2-8e04-fe9c3aa0421b/Untitled/w=640,quality=90,fit=scale-down" alt="Spiral of circles"></div></div>

## Related Tutorials

<ul class="page-list"><li><a href="/courses/creative-coding/arranging-items-in-a-line/">Arranging Items in a Line</a></li><li><a href="/courses/creative-coding/arranging-items-in-a-grid/">Arranging Items in a Grid</a></li><li><a href="/creative-coding/sine/">Sine in Creative Coding</a></li></ul>
