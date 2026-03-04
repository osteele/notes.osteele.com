---
title: "Arranging Items in a Grid"
layout: ../../../../layouts/BaseLayout.astro
---

This tutorial teaches two strategies for arranging items in a grid layout using p5.js.

## Strategy 1: Single Loop with Derived Positions

The modulo operator `%` "chops" a linear sequence into repeating patterns for columns. Division rounded down with `floor()` produces row positioning.

<div class="code-example"><pre><code>function setup() {
  createCanvas(400, 300);
}

function draw() {
  background(220);
  for (let i = 0; i &lt; 30; i++) {
    let row = floor(i / 6);
    let column = i % 6;
    let x = 30 + 60 * column;
    let y = 30 + 50 * row;
    circle(x, y, 40);
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/621e5ec2-d084-4e1a-9b9d-e33217069599/Screenshot_of_Notion_(4-8-22_12-57-55_AM)/w=640,quality=90,fit=scale-down" alt="Grid of circles using single loop"></div></div>

### Understanding Modulo

For input sequence i = 0, 1, 2, 3, 4, 5..., the modulo operator `i % 5` produces 0, 1, 2, 3, 4, 0, 1, 2, 3, 4...

<div class="code-example"><pre><code>// i % 5 produces:
// i=0 -&gt; 0, i=1 -&gt; 1, i=2 -&gt; 2
// i=3 -&gt; 3, i=4 -&gt; 4, i=5 -&gt; 0
// i=6 -&gt; 1, i=7 -&gt; 2, ...</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/a6b38306-6f11-4826-b8a3-c1060753d8cc/Screenshot_of_Microsoft_Edge_(4-8-22_1-02-54_AM)/w=640,quality=90,fit=scale-down" alt="Modulo visualization"></div></div>

## Strategy 2: Nested Loops

<div class="code-example"><pre><code>function setup() {
  createCanvas(400, 300);
}

function draw() {
  background(220);
  for (let row = 0; row &lt; 5; row++) {
    for (let column = 0; column &lt; 6; column++) {
      let x = 30 + 60 * column;
      let y = 30 + 50 * row;
      circle(x, y, 40);
    }
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/94c40538-753d-4069-a9d4-1dfd2017e5d0/Untitled/w=640,quality=90,fit=scale-down" alt="Grid using nested loops"></div></div>

## Adding Variation

<div class="code-example"><pre><code>function draw() {
  background(220);
  for (let row = 0; row &lt; 5; row++) {
    for (let col = 0; col &lt; 6; col++) {
      let x = 30 + 60 * col;
      let y = 30 + 50 * row;
      let size = map(row + col, 0, 9, 20, 50);
      circle(x, y, size);
    }
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/f2a05479-0044-4868-933a-c683ee75ddbe/Untitled/w=640,quality=90,fit=scale-down" alt="Grid with size variation"></div></div>

## Push/Pop for Transformations

<div class="code-example"><pre><code>function draw() {
  background(220);
  for (let row = 0; row &lt; 3; row++) {
    for (let col = 0; col &lt; 4; col++) {
      let x = 50 + 100 * col;
      let y = 50 + 80 * row;
      push();
      translate(x, y);
      rotate(millis() / 1000);
      rect(-20, -20, 40, 40);
      pop();
    }
  }
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/e89dbcec-dc5c-4b8f-ab1d-9e674c5c611c/Untitled/w=640,quality=90,fit=scale-down" alt="Rotating squares grid"></div></div>

## Higher-Order Functions

<div class="code-example"><pre><code>function drawGrid(rows, cols, spacingX, spacingY, drawFn) {
  for (let row = 0; row &lt; rows; row++) {
    for (let col = 0; col &lt; cols; col++) {
      let x = 70 + spacingX * col;
      let y = 60 + spacingY * row;
      drawFn(x, y, row, col);
    }
  }
}

function draw() {
  background(220);
  drawGrid(3, 3, 100, 80, (x, y, row, col) =&gt; {
    fill((row + col) % 2 === 0 ? 'white' : 'black');
    rect(x - 30, y - 30, 60, 60);
  });
}</code></pre><div class="canvas-preview"><img src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/e9cb1f4b-f74c-4a8f-89f9-ec2d230948a3/Screenshot_of_Safari_(4-8-22_1-06-49_AM)/w=640,quality=90,fit=scale-down" alt="Checkerboard pattern"></div></div>

## Related Tutorials

<ul class="page-list"><li><a href="/courses/creative-coding/arranging-items-in-a-line/">Arranging Items in a Line</a></li><li><a href="/courses/creative-coding/arranging-items-in-a-circle-or-spiral/">Arranging Items in a Circle or Spiral</a></li><li><a href="/courses/creative-coding/iteration-notes/">Iteration Notes</a></li></ul>
