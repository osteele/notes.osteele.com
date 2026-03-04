---
title: "Array 6"
layout: ../../../../../layouts/BaseLayout.astro
---

Removing elements from an array with splice() or shift().

```javascript
let xPositions = [];
let yPositions = [];

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  // Add new circle at mouse position each frame
  xPositions.push(mouseX);
  yPositions.push(mouseY);

  // Remove old circles to limit trail length
  if (xPositions.length > 50) {
    xPositions.shift(); // Remove first element
    yPositions.shift();
  }

  for (let i = 0; i < xPositions.length; i++) {
    let size = map(i, 0, xPositions.length, 5, 30);
    ellipse(xPositions[i], yPositions[i], size, size);
  }
}
```

Using `shift()` to remove old elements creates a trailing effect.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/array5/">Array 5</a></li><li><a href="/courses/creative-coding/cclab-example-codes/function-return/">Function Return</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
