---
title: "Array 1"
layout: ../../../../../layouts/BaseLayout.astro
---

Introduction to arrays: storing multiple values in a single variable.

```javascript
let xPositions = [50, 100, 150, 200, 250];

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  // Access array elements by index
  ellipse(xPositions[0], 200, 40, 40);
  ellipse(xPositions[1], 200, 40, 40);
  ellipse(xPositions[2], 200, 40, 40);
  ellipse(xPositions[3], 200, 40, 40);
  ellipse(xPositions[4], 200, 40, 40);
}
```

Arrays store multiple values. Access each value using its index (starting from 0).

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/array2/">Array 2</a></li><li><a href="/courses/creative-coding/cclab-example-codes/for-loop-step1/">For Loop Step 1</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
