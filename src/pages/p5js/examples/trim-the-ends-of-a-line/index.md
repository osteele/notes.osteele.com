---
title: "Trim the Ends of a Line"
layout: ../../../../layouts/BaseLayout.astro
---

Draw a line that starts and ends a certain distance from two points.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  let x1 = 100, y1 = 100;
  let x2 = mouseX, y2 = mouseY;

  // Draw circles at endpoints
  fill(200);
  ellipse(x1, y1, 60, 60);
  ellipse(x2, y2, 60, 60);

  // Draw trimmed line
  stroke(0);
  strokeWeight(2);
  trimmedLine(x1, y1, x2, y2, 30, 30);
}

function trimmedLine(x1, y1, x2, y2, startTrim, endTrim) {
  let d = dist(x1, y1, x2, y2);

  // Don't draw if line would be negative length
  if (d <= startTrim + endTrim) return;

  // Calculate direction
  let dx = (x2 - x1) / d;
  let dy = (y2 - y1) / d;

  // Calculate new endpoints
  let newX1 = x1 + dx * startTrim;
  let newY1 = y1 + dy * startTrim;
  let newX2 = x2 - dx * endTrim;
  let newY2 = y2 - dy * endTrim;

  line(newX1, newY1, newX2, newY2);
}
```

Useful for drawing connections between shapes without overlapping their boundaries.

## Related

<ul class="page-list"><li><a href="/p5js/examples/drawing-an-arrow/">Drawing an Arrow</a></li><li><a href="/p5js/examples/">All Examples</a></li></ul>
