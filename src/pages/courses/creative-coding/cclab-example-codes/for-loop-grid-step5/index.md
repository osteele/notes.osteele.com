---
title: "For Loop Grid Step 5"
layout: ../../../../../layouts/BaseLayout.astro
---

Advanced grid with animation using sine waves.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      let x = 20 + col * 40;
      let y = 20 + row * 40;

      // Animate size with sine wave
      let offset = (row + col) * 0.3;
      let size = 15 + sin(frameCount * 0.05 + offset) * 10;

      ellipse(x, y, size, size);
    }
  }
}
```

The sine wave creates a rippling animation across the grid.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-grid-step3/">For Loop Grid Step 3</a></li><li><a href="/courses/creative-coding/cclab-example-codes/array1/">Array 1</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
