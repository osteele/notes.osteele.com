---
title: "For Loop Grid Step 3"
layout: ../../../../../layouts/BaseLayout.astro
---

Adding interactivity to the grid based on mouse position.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      let x = 25 + col * 50;
      let y = 25 + row * 50;

      // Size based on distance to mouse
      let d = dist(mouseX, mouseY, x, y);
      let size = map(d, 0, 200, 40, 10);
      size = constrain(size, 10, 40);

      ellipse(x, y, size, size);
    }
  }
}
```

Circles near the mouse are larger, creating a magnifying effect.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-grid-step2/">For Loop Grid Step 2</a></li><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-grid-step5/">For Loop Grid Step 5</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
