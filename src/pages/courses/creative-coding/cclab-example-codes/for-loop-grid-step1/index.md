---
title: "For Loop Grid Step 1"
layout: ../../../../../layouts/BaseLayout.astro
---

Using nested for loops to create a grid of shapes.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      ellipse(50 + x * 75, 50 + y * 75, 50, 50);
    }
  }
}
```

The outer loop controls rows (y), and the inner loop controls columns (x).

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-step4/">For Loop Step 4</a></li><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-grid-step2/">For Loop Grid Step 2</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
