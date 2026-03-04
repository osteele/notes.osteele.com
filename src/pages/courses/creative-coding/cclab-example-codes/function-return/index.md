---
title: "Function Return"
layout: ../../../../../layouts/BaseLayout.astro
---

Functions can return values using the `return` keyword.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  let d = distance(100, 100, mouseX, mouseY);
  fill(0);
  text("Distance: " + d.toFixed(2), 20, 30);

  // Size based on distance
  let size = map(d, 0, 300, 100, 20);
  ellipse(100, 100, size, size);
  ellipse(mouseX, mouseY, 20, 20);

  // Draw line between points
  line(100, 100, mouseX, mouseY);
}

// Custom function that returns a value
function distance(x1, y1, x2, y2) {
  let dx = x2 - x1;
  let dy = y2 - y1;
  return sqrt(dx * dx + dy * dy);
}
```

The `distance` function calculates and returns the distance between two points.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/array6/">Array 6</a></li><li><a href="/courses/creative-coding/cclab-example-codes/inspiration-step1/">Inspiration Step 1</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
