---
title: "Selective Trails with Arrays"
layout: ../../../../layouts/BaseLayout.astro
---

Create trail effects by storing previous positions in arrays.

```javascript
let trail = [];
const maxTrailLength = 50;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  // Add current position to trail
  trail.push({x: mouseX, y: mouseY});

  // Limit trail length
  if (trail.length > maxTrailLength) {
    trail.shift();
  }

  // Draw trail with fading opacity
  noStroke();
  for (let i = 0; i < trail.length; i++) {
    let alpha = map(i, 0, trail.length, 0, 255);
    let size = map(i, 0, trail.length, 5, 30);
    fill(255, 0, 0, alpha);
    ellipse(trail[i].x, trail[i].y, size, size);
  }

  // Draw non-trailing object
  fill(0, 0, 255);
  ellipse(width/2, height/2, 50, 50);
}
```

This approach stores positions in an array and draws them with varying size and opacity.

## Related

<ul class="page-list"><li><a href="/p5js/examples/selective-trails-using-creategraphics/">Selective Trails using createGraphics</a></li><li><a href="/p5js/tutorials/selective-trails-1-arrays/">Tutorial: Selective Trails 1</a></li><li><a href="/p5js/examples/">All Examples</a></li></ul>
