---
title: "For Loop Step 1"
layout: ../../../../../layouts/BaseLayout.astro
---

Drawing multiple shapes manually without a loop.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  // Drawing circles manually
  ellipse(50, 200, 40, 40);
  ellipse(100, 200, 40, 40);
  ellipse(150, 200, 40, 40);
  ellipse(200, 200, 40, 40);
  ellipse(250, 200, 40, 40);
}
```

This code draws 5 circles, but we're repeating ourselves. Let's use a for loop to simplify this.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-step2/">For Loop Step 2</a></li><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-step3/">For Loop Step 3</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
