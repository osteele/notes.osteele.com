---
title: "Array 4"
layout: ../../../../../layouts/BaseLayout.astro
---

Using parallel arrays for x and y positions.

```javascript
let xPositions = [];
let yPositions = [];

function setup() {
  createCanvas(400, 400);
  // Initialize arrays with random positions
  for (let i = 0; i < 10; i++) {
    xPositions.push(random(width));
    yPositions.push(random(height));
  }
}

function draw() {
  background(220);

  for (let i = 0; i < xPositions.length; i++) {
    ellipse(xPositions[i], yPositions[i], 30, 30);
  }
}
```

Two arrays work together: `xPositions[i]` and `yPositions[i]` define each circle's position.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/array3/">Array 3</a></li><li><a href="/courses/creative-coding/cclab-example-codes/array5/">Array 5</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
