---
title: "For Loop Step 3"
layout: ../../../../../layouts/BaseLayout.astro
---

Adding variation to each circle using the loop variable.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  for (let i = 0; i < 8; i++) {
    // Use i to vary the size
    let size = 20 + i * 10;
    ellipse(50 + i * 45, 200, size, size);
  }
}
```

Each circle gets progressively larger because we use `i` to calculate the size.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-step2/">For Loop Step 2</a></li><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-step4/">For Loop Step 4</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
