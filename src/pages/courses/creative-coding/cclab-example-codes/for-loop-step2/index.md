---
title: "For Loop Step 2"
layout: ../../../../../layouts/BaseLayout.astro
---

Converting the repeated code into a basic for loop.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  // Using a for loop
  for (let i = 0; i < 5; i++) {
    ellipse(50 + i * 50, 200, 40, 40);
  }
}
```

The loop variable `i` goes from 0 to 4. We use it to calculate each circle's x position.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-step1/">For Loop Step 1</a></li><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-step3/">For Loop Step 3</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
