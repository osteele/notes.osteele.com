---
title: "Array 5"
layout: ../../../../../layouts/BaseLayout.astro
---

Adding elements to an array dynamically with push().

```javascript
let xPositions = [];
let yPositions = [];

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  for (let i = 0; i < xPositions.length; i++) {
    ellipse(xPositions[i], yPositions[i], 30, 30);
  }
}

function mousePressed() {
  // Add new position when mouse is clicked
  xPositions.push(mouseX);
  yPositions.push(mouseY);
}
```

Each click adds a new circle at the mouse position using `push()`.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/array4/">Array 4</a></li><li><a href="/courses/creative-coding/cclab-example-codes/array6/">Array 6</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
