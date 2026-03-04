---
title: "Drawing an Arrow"
layout: ../../../../layouts/BaseLayout.astro
---

A function to draw an arrow from one point to another.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  // Draw arrow from center to mouse
  drawArrow(width/2, height/2, mouseX, mouseY, 10);
}

function drawArrow(x1, y1, x2, y2, headSize) {
  // Draw the line
  line(x1, y1, x2, y2);

  // Calculate angle
  let angle = atan2(y2 - y1, x2 - x1);

  // Draw the arrowhead
  push();
  translate(x2, y2);
  rotate(angle);

  // Triangle for arrowhead
  triangle(0, 0,
           -headSize, -headSize/2,
           -headSize, headSize/2);
  pop();
}
```

The arrow points from the center of the canvas toward the mouse position.

## With Fill Options

```javascript
function drawArrow(x1, y1, x2, y2, options = {}) {
  let headSize = options.headSize || 10;
  let headAngle = options.headAngle || PI/6;

  let angle = atan2(y2 - y1, x2 - x1);
  let len = dist(x1, y1, x2, y2);

  push();
  translate(x1, y1);
  rotate(angle);

  // Line (shortened to meet arrowhead)
  line(0, 0, len - headSize, 0);

  // Arrowhead
  translate(len, 0);
  triangle(0, 0,
           -headSize, tan(headAngle) * headSize,
           -headSize, -tan(headAngle) * headSize);
  pop();
}
```

## Related

<ul class="page-list"><li><a href="/p5js/examples/rotate-about-a-point/">Rotate About a Point</a></li><li><a href="/p5js/examples/trim-the-ends-of-a-line/">Trim the Ends of a Line</a></li><li><a href="/p5js/examples/">All Examples</a></li></ul>
