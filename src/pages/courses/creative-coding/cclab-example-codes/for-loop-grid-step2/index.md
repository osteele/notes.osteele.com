---
title: "For Loop Grid Step 2"
layout: ../../../../../layouts/BaseLayout.astro
---

Adding color variation to the grid based on position.

```javascript
function setup() {
  createCanvas(400, 400);
  colorMode(HSB);
}

function draw() {
  background(220);

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      // Color based on position
      fill(col * 50 + row * 10, 80, 90);
      ellipse(50 + col * 75, 50 + row * 75, 50, 50);
    }
  }
}
```

Each circle's color is determined by its row and column position.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-grid-step1/">For Loop Grid Step 1</a></li><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-grid-step3/">For Loop Grid Step 3</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
