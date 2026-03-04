---
title: "Array 3"
layout: ../../../../../layouts/BaseLayout.astro
---

Modifying array values to create animation.

```javascript
let xPositions = [50, 100, 150, 200, 250];

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  for (let i = 0; i < xPositions.length; i++) {
    // Move each circle to the right
    xPositions[i] = xPositions[i] + 1;

    // Wrap around when off screen
    if (xPositions[i] > width) {
      xPositions[i] = 0;
    }

    ellipse(xPositions[i], 200, 40, 40);
  }
}
```

Each frame, we update the values in the array to create movement.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/array2/">Array 2</a></li><li><a href="/courses/creative-coding/cclab-example-codes/array4/">Array 4</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
