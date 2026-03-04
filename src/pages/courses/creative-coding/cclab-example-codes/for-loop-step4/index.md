---
title: "For Loop Step 4"
layout: ../../../../../layouts/BaseLayout.astro
---

Adding color variation using the loop variable.

```javascript
function setup() {
  createCanvas(400, 400);
  colorMode(HSB);
}

function draw() {
  background(220);

  for (let i = 0; i < 10; i++) {
    // Use i to vary the hue
    fill(i * 36, 80, 90);
    let x = 40 + i * 35;
    ellipse(x, 200, 30, 30);
  }
}
```

Each circle has a different hue, creating a rainbow effect across the row.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-step3/">For Loop Step 3</a></li><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-grid-step1/">For Loop Grid Step 1</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
