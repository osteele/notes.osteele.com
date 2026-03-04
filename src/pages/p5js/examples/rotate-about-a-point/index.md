---
title: "Rotate About a Point"
layout: ../../../../layouts/BaseLayout.astro
---

How to rotate shapes around an arbitrary point instead of the origin.

## The Problem

`rotate()` always rotates around the origin (0, 0). To rotate around a different point, we need to translate first.

## Solution

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  let cx = width / 2;  // Center x
  let cy = height / 2; // Center y
  let angle = frameCount * 0.02;

  // Mark the rotation center
  fill(255, 0, 0);
  ellipse(cx, cy, 10, 10);

  // Rotate a rectangle around the center point
  push();
  translate(cx, cy);      // Move origin to rotation center
  rotate(angle);          // Rotate
  translate(-cx, -cy);    // Move origin back

  fill(100, 150, 255);
  rect(cx + 50, cy - 25, 100, 50);
  pop();
}
```

## Helper Function

```javascript
function rotateAbout(cx, cy, angle) {
  translate(cx, cy);
  rotate(angle);
  translate(-cx, -cy);
}

// Usage in draw():
push();
rotateAbout(200, 200, frameCount * 0.02);
rect(250, 175, 100, 50);
pop();
```

## Related

<ul class="page-list"><li><a href="/p5js/examples/drawing-an-arrow/">Drawing an Arrow</a></li><li><a href="/p5js/tutorials/two-point-transforms/">Two-Point Transforms</a></li><li><a href="/p5js/examples/">All Examples</a></li></ul>
