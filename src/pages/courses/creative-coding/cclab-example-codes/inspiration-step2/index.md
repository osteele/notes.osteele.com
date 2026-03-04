---
title: "Inspiration Step 2"
layout: ../../../../../layouts/BaseLayout.astro
---

Adding repetition with a for loop.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(240);

  noStroke();
  // Create multiple circles using a loop
  for (let i = 0; i < 10; i++) {
    let size = 200 - i * 18;
    let alpha = map(i, 0, 10, 255, 50);
    fill(100, 150, 255, alpha);
    ellipse(width / 2, height / 2, size, size);
  }
}
```

We add layers of circles with decreasing size and transparency.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/inspiration-step1/">Inspiration Step 1</a></li><li><a href="/courses/creative-coding/cclab-example-codes/inspiration-step3/">Inspiration Step 3</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
